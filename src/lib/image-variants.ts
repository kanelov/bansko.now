import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { mediaBucket } from "@/lib/articles-admin";
import type { Database } from "@/lib/types";

/**
 * Creates three WebP sizes of an article image and uploads them to
 * `articles/r/<yyyy-mm>/<id>-w{480,960,1600}.webp`. The returned URL points at the
 * largest file; ResponsiveImage derives the smaller ones from the file name.
 * Smaller originals are never upscaled: the variant keeps the original width.
 */

export const imageVariantWidths = [480, 960, 1600] as const;
const maxSourceBytes = 25 * 1024 * 1024;

export type ImageVariantResult = {
  url: string;
  width: number;
  height: number;
  bytes: number;
};

export async function createImageVariants(
  supabase: SupabaseClient<Database>,
  input: { buffer: Buffer; id: string; cacheControl?: string }
): Promise<ImageVariantResult> {
  if (input.buffer.byteLength > maxSourceBytes) {
    throw new Error("Изображението е над 25 MB.");
  }

  const source = sharp(input.buffer, { failOn: "none" }).rotate();
  const metadata = await source.metadata();
  const sourceWidth = metadata.width ?? 1600;
  const month = new Date().toISOString().slice(0, 7);
  const folder = `articles/r/${month}`;
  let largest: ImageVariantResult | null = null;

  for (const width of imageVariantWidths) {
    const output = await sharp(input.buffer, { failOn: "none" })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: width >= 1600 ? 82 : 78, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    const path = `${folder}/${input.id}-w${width}.webp`;
    const { error } = await supabase.storage.from(mediaBucket).upload(path, output.data, {
      cacheControl: input.cacheControl ?? "31536000",
      contentType: "image/webp",
      upsert: true
    });

    if (error) {
      throw new Error(error.message);
    }

    const {
      data: { publicUrl }
    } = supabase.storage.from(mediaBucket).getPublicUrl(path);

    largest = { url: publicUrl, width: output.info.width, height: output.info.height, bytes: output.info.size };
  }

  if (!largest) {
    throw new Error("Изображението не можа да бъде обработено.");
  }

  void sourceWidth;
  return largest;
}
