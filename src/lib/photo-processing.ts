import "server-only";

import sharp from "sharp";
import { photoObjectKey, uploadPhoto } from "@/lib/photo-storage";
import { watermarkImage } from "@/lib/photo-watermark";

/**
 * Turns one finished JPEG into the five files the photo library needs.
 * Runs server side only (admin upload or the Drive import queue), never in a visitor request.
 */

export type PhotoDerivatives = {
  thumb_key: string;
  article_key: string;
  preview_key: string;
  web_license_key: string;
  full_resolution_key: string;
  width: number;
  height: number;
  orientation: "landscape" | "portrait" | "square";
  dominant_color: string | null;
};

const maxSourceBytes = 80 * 1024 * 1024;

/** Scales the pre-rendered mark to about a third of the photo width. */
async function watermarkFor(width: number) {
  const target = Math.max(320, Math.round(width * 0.34));
  return sharp(watermarkImage()).resize({ width: target, withoutEnlargement: false }).png().toBuffer();
}

export async function createPhotoDerivatives(buffer: Buffer, photoCode: string): Promise<PhotoDerivatives> {
  if (buffer.byteLength > maxSourceBytes) throw new Error("Файлът е над 80 MB.");

  let width = 0;
  let height = 0;
  let dominant: string | null = null;

  try {
    const probe = sharp(buffer, { failOn: "none" }).rotate();
    const metadata = await probe.metadata();
    width = metadata.width ?? 0;
    height = metadata.height ?? 0;
    if (!width || !height) throw new Error("Файлът не е разпознат като изображение.");
    const stats = await probe.stats();
    dominant = stats.dominant
      ? `#${[stats.dominant.r, stats.dominant.g, stats.dominant.b].map((value) => value.toString(16).padStart(2, "0")).join("")}`
      : null;
  } catch (error) {
    throw new Error(`Четене на файла: ${error instanceof Error ? error.message : String(error)}`);
  }

  const keys = {
    thumb_key: photoObjectKey("thumb", photoCode),
    article_key: photoObjectKey("article", photoCode),
    preview_key: photoObjectKey("preview", photoCode),
    web_license_key: photoObjectKey("web_license", photoCode),
    full_resolution_key: photoObjectKey("full_resolution", photoCode)
  };

  // One derivative at a time: create, upload, release. EXIF is dropped, so no GPS leaks.
  const step = async (label: string, key: string, contentType: string, make: () => Promise<Buffer>) => {
    try {
      const output = await make();
      await uploadPhoto(key, output, contentType);
    } catch (error) {
      throw new Error(`${label}: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const resize = (targetWidth: number) =>
    sharp(buffer, { failOn: "none" }).rotate().resize({ width: targetWidth, withoutEnlargement: true });

  await step("миниатюра", keys.thumb_key, "image/webp", () => resize(800).webp({ quality: 78, effort: 4 }).toBuffer());
  await step("за статии", keys.article_key, "image/webp", () => resize(1800).webp({ quality: 82, effort: 4 }).toBuffer());
  await step("преглед с воден знак", keys.preview_key, "image/webp", async () => {
    const base = await resize(2000).toBuffer({ resolveWithObject: true });
    const mark = await watermarkFor(base.info.width);
    return sharp(base.data)
      .composite([{ input: mark, gravity: "southeast" }])
      .webp({ quality: 80, effort: 4 })
      .toBuffer();
  });
  await step("файл за уеб лиценз", keys.web_license_key, "image/jpeg", () => resize(3000).jpeg({ quality: 92, mozjpeg: true }).toBuffer());
  await step("оригинал", keys.full_resolution_key, "image/jpeg", () =>
    sharp(buffer, { failOn: "none" }).rotate().jpeg({ quality: 95, mozjpeg: true }).toBuffer()
  );

  return {
    ...keys,
    width,
    height,
    orientation: width === height ? "square" : width > height ? "landscape" : "portrait",
    dominant_color: dominant
  };
}
