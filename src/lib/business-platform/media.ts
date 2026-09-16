import "server-only";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createUploadUrl, deletePhoto, getPhotoObject, getPublicPhotoUrl, headObject, photoStorageConfigured, uploadPhoto } from "@/lib/photo-storage";
import type { BusinessMedia, BusinessMediaKind, Database, Json } from "@/lib/types";

/**
 * Медията на бизнеса живее в R2 под business/<business_id>/…, по същия път като
 * фотоархива: браузърът качва оригинала с подписан адрес (Vercel реже тела над
 * 4,5 MB), после сървърът прави три WebP размера и записва реда. Оригиналът се
 * пази - печатът иска пълната резолюция.
 */

export const businessImageTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

export const businessVideoTypes: Record<string, string> = {
  "video/mp4": "mp4"
};

export const maxBusinessImageBytes = 8 * 1024 * 1024;
export const maxBusinessVideoBytes = 150 * 1024 * 1024;
export const businessImageWidths = [480, 960, 1600] as const;

export type BusinessMediaUrls = {
  original: string | null;
  w480: string | null;
  w960: string | null;
  w1600: string | null;
};

function businessMediaKey(businessId: string, folder: "original" | "image" | "video", name: string) {
  return `business/${businessId}/${folder}/${name}`;
}

export function businessMediaConfigured() {
  return photoStorageConfigured();
}

/** Подписан адрес за качване на един файл направо в R2. */
export async function createBusinessUploadTicket(input: {
  businessId: string;
  contentType: string;
  bytes: number;
  mediaType: "image" | "video";
}) {
  const table = input.mediaType === "video" ? businessVideoTypes : businessImageTypes;
  const extension = table[input.contentType];

  if (!extension) {
    throw new Error(input.mediaType === "video" ? "Позволен е само MP4." : "Позволени са JPEG, PNG и WebP.");
  }

  const limit = input.mediaType === "video" ? maxBusinessVideoBytes : maxBusinessImageBytes;
  if (!Number.isFinite(input.bytes) || input.bytes <= 0 || input.bytes > limit) {
    throw new Error(`Файлът е над ${Math.round(limit / 1024 / 1024)} MB.`);
  }

  const key = businessMediaKey(input.businessId, input.mediaType === "video" ? "video" : "original", `${randomUUID()}.${extension}`);
  const url = await createUploadUrl(key, 900);
  return { key, url };
}

function assertOwnKey(businessId: string, key: string, folder: "original" | "video") {
  const prefix = `business/${businessId}/${folder}/`;
  if (!key.startsWith(prefix) || key.includes("..") || key.length > prefix.length + 64) {
    throw new Error("Невалиден файл.");
  }
}

/** След качен оригинал: проверка, три размера, ред в business_media. */
export async function finalizeBusinessImage(input: {
  supabase: SupabaseClient<Database>;
  businessId: string;
  key: string;
  kind: BusinessMediaKind;
  alt?: string | null;
}): Promise<BusinessMedia> {
  assertOwnKey(input.businessId, input.key, "original");

  const head = await headObject(input.key);
  if (!head) {
    throw new Error("Файлът не е стигнал до хранилището.");
  }
  if (head.bytes > maxBusinessImageBytes) {
    await deletePhoto(input.key);
    throw new Error("Файлът е над 8 MB.");
  }

  const buffer = await getPhotoObject(input.key);
  const metadata = await sharp(buffer, { failOn: "none" }).rotate().metadata();
  if (!metadata.width || !metadata.height) {
    await deletePhoto(input.key);
    throw new Error("Файлът не е разпознат като изображение.");
  }

  const id = randomUUID();
  const variantKeys: Record<string, string> = {};
  let largest = { width: metadata.width, height: metadata.height };

  /* Един размер наведнъж: направи, качи, освободи паметта. Оригиналът се пресъздава
     от sharp, така че каквото и да е било вътре, навън излиза чист WebP. */
  for (const width of businessImageWidths) {
    const output = await sharp(buffer, { failOn: "none" })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: width >= 1600 ? 82 : 78, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    const key = businessMediaKey(input.businessId, "image", `${id}-w${width}.webp`);
    await uploadPhoto(key, output.data, "image/webp");
    variantKeys[String(width)] = key;
    largest = { width: output.info.width, height: output.info.height };
  }

  const { data, error } = await input.supabase
    .from("business_media")
    .insert({
      id,
      business_id: input.businessId,
      media_type: "image",
      kind: input.kind,
      original_key: input.key,
      variant_keys: variantKeys as Json,
      mime_type: head.contentType || "image/jpeg",
      bytes: head.bytes,
      width: largest.width,
      height: largest.height,
      alt: input.alt?.trim() || null
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Записът на снимката не успя.");
  }

  return data;
}

/** След качено видео (MP4, без обработка): проверка и ред в business_media. */
export async function finalizeBusinessVideo(input: {
  supabase: SupabaseClient<Database>;
  businessId: string;
  key: string;
  kind: BusinessMediaKind;
  alt?: string | null;
}): Promise<BusinessMedia> {
  assertOwnKey(input.businessId, input.key, "video");

  const head = await headObject(input.key);
  if (!head) {
    throw new Error("Файлът не е стигнал до хранилището.");
  }
  if (head.bytes > maxBusinessVideoBytes || !businessVideoTypes[head.contentType]) {
    await deletePhoto(input.key);
    throw new Error("Позволен е само MP4 до 150 MB.");
  }

  const { data, error } = await input.supabase
    .from("business_media")
    .insert({
      business_id: input.businessId,
      media_type: "video",
      kind: input.kind,
      original_key: input.key,
      mime_type: head.contentType,
      bytes: head.bytes,
      alt: input.alt?.trim() || null
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Записът на видеото не успя.");
  }

  return data;
}

export function businessMediaUrls(media: Pick<BusinessMedia, "original_key" | "variant_keys">): BusinessMediaUrls {
  const variants = (media.variant_keys ?? {}) as Record<string, string>;
  return {
    original: getPublicPhotoUrl(media.original_key),
    w480: getPublicPhotoUrl(variants["480"]),
    w960: getPublicPhotoUrl(variants["960"]),
    w1600: getPublicPhotoUrl(variants["1600"])
  };
}

/** Изтрива реда и файловете. Артикулите губят снимката си сами (FK on delete set null). */
export async function deleteBusinessMedia(supabase: SupabaseClient<Database>, businessId: string, mediaId: string) {
  const { data: media } = await supabase.from("business_media").select("*").eq("business_id", businessId).eq("id", mediaId).maybeSingle();

  if (!media) {
    return;
  }

  const { error } = await supabase.from("business_media").delete().eq("id", mediaId).eq("business_id", businessId);
  if (error) {
    throw new Error(error.message);
  }

  const keys = [media.original_key, ...Object.values((media.variant_keys ?? {}) as Record<string, string>)];
  await Promise.all(keys.map((key) => deletePhoto(key).catch(() => undefined)));
}
