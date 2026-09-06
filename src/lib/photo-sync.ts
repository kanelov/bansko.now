import "server-only";

import { artGalleryIntegrationSecret, artGalleryReservationApiUrl } from "@/lib/env";
import { localeUrl } from "@/lib/i18n";
import { getPublicPhotoUrl } from "@/lib/photo-storage";
import type { Photo } from "@/lib/types";

/**
 * Mirrors the photo archive into the request app catalog (app.kanelov.com), where prints are
 * ordered and produced. The photo files stay on our CDN: the catalog only gets a row per
 * published photo (SKU = photo code, image = the public thumbnail). Best effort: the admin
 * action that triggered the sync has already succeeded when this runs.
 */

export const photoSyncApiUrl =
  process.env.ART_GALLERY_PHOTO_SYNC_API_URL
  || artGalleryReservationApiUrl.replace(/\/api\/reservations\/?$/, "/api/bansko-now-photos");

export type SyncablePhoto = Pick<
  Photo,
  "photo_code" | "slug" | "title_bg" | "alt_bg" | "description_bg" | "category" | "thumb_key" | "article_key" | "catalog_sku" | "is_published" | "print_enabled"
>;

export const photoSyncColumns = "photo_code,slug,title_bg,alt_bg,description_bg,category,thumb_key,article_key,catalog_sku,is_published,print_enabled";

export type PhotoSyncSummary = { created: number; updated: number; archived: number; skipped: number; warnings: unknown[] };
export type PhotoSyncResult = { ok: true; summary: PhotoSyncSummary } | { ok: false; error: string };

const chunkSize = 100;

export function photoSyncConfigured() {
  return Boolean(photoSyncApiUrl && artGalleryIntegrationSecret);
}

function toPayload(photo: SyncablePhoto, archive: boolean) {
  return {
    photo_code: photo.photo_code,
    slug: photo.slug,
    title: photo.title_bg,
    alt: photo.alt_bg || photo.title_bg,
    description: photo.description_bg || "",
    category: photo.category || "",
    thumb_url: getPublicPhotoUrl(photo.thumb_key) || "",
    article_url: getPublicPhotoUrl(photo.article_key) || "",
    page_url: localeUrl("bg", `/photos/${photo.slug}`),
    catalog_sku: (photo.catalog_sku || "").trim().toUpperCase(),
    is_published: archive ? false : photo.is_published,
    print_enabled: photo.print_enabled
  };
}

/** Sends the photos in chunks. `archive` marks all of them as unpublished (used before a delete). */
export async function syncPhotosToRequestApp(photos: SyncablePhoto[], options?: { archive?: boolean }): Promise<PhotoSyncResult> {
  if (!photoSyncConfigured()) {
    return { ok: false, error: "Синхронизацията не е конфигурирана: липсва адрес или общ секрет към приложението за заявки." };
  }
  if (!photos.length) return { ok: true, summary: { created: 0, updated: 0, archived: 0, skipped: 0, warnings: [] } };

  const totals: PhotoSyncSummary = { created: 0, updated: 0, archived: 0, skipped: 0, warnings: [] };
  for (let index = 0; index < photos.length; index += chunkSize) {
    const chunk = photos.slice(index, index + chunkSize).map((photo) => toPayload(photo, Boolean(options?.archive)));
    try {
      const response = await fetch(photoSyncApiUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${artGalleryIntegrationSecret}`, "Content-Type": "application/json" },
        body: JSON.stringify({ photos: chunk }),
        cache: "no-store",
        signal: AbortSignal.timeout(20000)
      });
      const data = (await response.json().catch(() => ({}))) as Partial<PhotoSyncSummary> & { error?: string };
      if (!response.ok) {
        return { ok: false, error: data.error || `Приложението за заявки отговори ${response.status}.` };
      }
      totals.created += data.created ?? 0;
      totals.updated += data.updated ?? 0;
      totals.archived += data.archived ?? 0;
      totals.skipped += data.skipped ?? 0;
      if (Array.isArray(data.warnings)) totals.warnings.push(...data.warnings);
    } catch (error) {
      console.error("[photo sync] request app unreachable", error);
      return { ok: false, error: "Приложението за заявки не отговори. Опитай отново след малко." };
    }
  }

  return { ok: true, summary: totals };
}

/** Short Bulgarian summary for the admin banner. */
export function describePhotoSync(summary: PhotoSyncSummary) {
  const parts = [
    summary.created ? `${summary.created} нови` : "",
    summary.updated ? `${summary.updated} обновени` : "",
    summary.archived ? `${summary.archived} архивирани` : "",
    summary.skipped ? `${summary.skipped} пропуснати` : ""
  ].filter(Boolean);
  const warnings = summary.warnings.length ? ` Предупреждения: ${summary.warnings.length} (проверете „SKU в каталога“).` : "";
  return `${parts.length ? parts.join(", ") : "няма промени"}.${warnings}`;
}
