"use server";

import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { revalidatePublicPath } from "@/lib/articles-admin";
import { businessPlaceholderSlugs, type BusinessPlaceholderSlug } from "@/lib/business-placeholders";
import { createUploadUrl, deletePhoto, getPhotoObject, headObject, photoStorageConfigured, putPublicObject } from "@/lib/photo-storage";
import { requireAdmin } from "@/lib/supabase/auth";

/**
 * Илюстрациите за бизнеси без своя снимка (по една на категория). Браузърът
 * качва файла направо в R2 на временно място (подписан адрес, без лимита на
 * Vercel), сървърът го смалява до 1200 px WebP (около 120–200 KB) и го записва като
 * business/placeholders/placeholder-<slug>.webp. Кешът е за ден, защото
 * илюстрацията може да се смени под същото име.
 */

const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const maxBytes = 15 * 1024 * 1024;
const incomingPrefix = "business/placeholders/incoming/";

function isSlug(value: string): value is BusinessPlaceholderSlug {
  return (businessPlaceholderSlugs as readonly string[]).includes(value);
}

type Ticket = { ok: true; key: string; url: string } | { ok: false; error: string };

export async function createPlaceholderUploadAction(input: { slug: string; contentType: string; bytes: number }): Promise<Ticket> {
  await requireAdmin();
  if (!photoStorageConfigured()) return { ok: false, error: "Хранилището (R2) не е настроено тук." };
  if (!isSlug(String(input.slug))) return { ok: false, error: "Непозната категория." };
  if (!allowedTypes.has(String(input.contentType))) return { ok: false, error: "Позволени са PNG, JPEG и WebP." };
  if (!(Number(input.bytes) > 0) || Number(input.bytes) > maxBytes) return { ok: false, error: "Файлът е над 15 MB." };

  const key = `${incomingPrefix}${input.slug}-${randomUUID()}`;
  return { ok: true, key, url: await createUploadUrl(key, 900) };
}

export async function finalizePlaceholderAction(input: { slug: string; key: string }): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const slug = String(input.slug);
  const key = String(input.key || "");
  if (!isSlug(slug) || !key.startsWith(`${incomingPrefix}${slug}-`) || key.includes("..")) {
    return { ok: false, error: "Невалиден файл." };
  }

  try {
    const head = await headObject(key);
    if (!head || head.bytes > maxBytes) throw new Error("Файлът не е стигнал до хранилището.");
    const original = await getPhotoObject(key);
    const meta = await sharp(original, { failOn: "none" }).metadata();
    /* Вече оптимизиран WebP (до 1200 px и 300 KB) се пази както е, без второ компресиране. */
    const alreadyOptimized = meta.format === "webp" && (meta.width ?? 0) <= 1200 && original.length <= 300 * 1024;
    const webp = alreadyOptimized
      ? original
      : await sharp(original, { failOn: "none" })
          .rotate()
          .resize({ width: 1200, withoutEnlargement: true })
          .webp({ quality: 72, effort: 6, smartSubsample: true })
          .toBuffer();
    await putPublicObject(`business/placeholders/placeholder-${slug}.webp`, webp, "image/webp", "public, max-age=86400");
    await deletePhoto(key);
  } catch (error) {
    await deletePhoto(key).catch(() => undefined);
    return { ok: false, error: error instanceof Error ? error.message : "Обработката не успя." };
  }

  /* Каталогът проверява веднъж на ден кои илюстрации има; така ги вижда веднага. */
  revalidatePublicPath("/places", "layout");
  revalidatePublicPath("/");
  return { ok: true };
}
