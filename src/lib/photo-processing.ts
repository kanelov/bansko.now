import "server-only";

import sharp from "sharp";
import { photoObjectKey, uploadPhoto } from "@/lib/photo-storage";

/**
 * Turns one finished JPEG into the five files the photo library needs.
 * Runs server side only (admin upload or the Drive import queue), never in a visitor request.
 */

export const watermarkText = "© Лубо Кънелов · bansko.now";

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

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (character) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character] as string
  );
}

/** Discreet bottom-right watermark; `strength` controls how visible it is. */
function watermarkSvg(width: number, height: number, strength: "light" | "strong") {
  const fontSize = Math.max(14, Math.round(width * (strength === "strong" ? 0.026 : 0.018)));
  const padding = Math.round(fontSize * 1.1);
  const opacity = strength === "strong" ? 0.5 : 0.32;
  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <text x="${width - padding}" y="${height - padding}" text-anchor="end"
        font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}"
        fill="#ffffff" fill-opacity="${opacity}"
        stroke="#000000" stroke-opacity="${opacity * 0.5}" stroke-width="${Math.max(1, fontSize * 0.02)}"
      >${escapeXml(watermarkText)}</text>
    </svg>`
  );
}

/**
 * Creates and uploads every derivative for one photo.
 * Public files are WebP, licensed files are clean JPEG without a watermark.
 */
export async function createPhotoDerivatives(buffer: Buffer, photoCode: string): Promise<PhotoDerivatives> {
  if (buffer.byteLength > maxSourceBytes) throw new Error("Файлът е над 80 MB.");

  const base = sharp(buffer, { failOn: "none" }).rotate();
  const metadata = await base.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (!width || !height) throw new Error("Файлът не е разпознат като изображение.");

  const stats = await base.stats();
  const dominant = stats.dominant
    ? `#${[stats.dominant.r, stats.dominant.g, stats.dominant.b].map((value) => value.toString(16).padStart(2, "0")).join("")}`
    : null;

  const resize = (targetWidth: number) =>
    sharp(buffer, { failOn: "none" }).rotate().resize({ width: targetWidth, withoutEnlargement: true });

  // Public derivatives. EXIF is dropped by sharp unless explicitly kept, so no GPS leaks.
  const thumb = await resize(800).webp({ quality: 78, effort: 4 }).toBuffer();
  const article = await resize(1800).webp({ quality: 82, effort: 4 }).toBuffer();

  const previewBase = await resize(2000).toBuffer({ resolveWithObject: true });
  const preview = await sharp(previewBase.data)
    .composite([{ input: watermarkSvg(previewBase.info.width, previewBase.info.height, "strong"), gravity: "southeast" }])
    .webp({ quality: 80, effort: 4 })
    .toBuffer();

  // Private licensed files, clean and without a watermark.
  const webLicense = await resize(3000).jpeg({ quality: 92, mozjpeg: true }).toBuffer();
  const fullResolution = await sharp(buffer, { failOn: "none" }).rotate().jpeg({ quality: 95, mozjpeg: true }).toBuffer();

  const keys = {
    thumb_key: photoObjectKey("thumb", photoCode),
    article_key: photoObjectKey("article", photoCode),
    preview_key: photoObjectKey("preview", photoCode),
    web_license_key: photoObjectKey("web_license", photoCode),
    full_resolution_key: photoObjectKey("full_resolution", photoCode)
  };

  await Promise.all([
    uploadPhoto(keys.thumb_key, thumb, "image/webp"),
    uploadPhoto(keys.article_key, article, "image/webp"),
    uploadPhoto(keys.preview_key, preview, "image/webp"),
    uploadPhoto(keys.web_license_key, webLicense, "image/jpeg"),
    uploadPhoto(keys.full_resolution_key, fullResolution, "image/jpeg")
  ]);

  return {
    ...keys,
    width,
    height,
    orientation: width === height ? "square" : width > height ? "landscape" : "portrait",
    dominant_color: dominant
  };
}
