import "server-only";

import { AwsClient } from "aws4fetch";
import { photoPublicBaseUrl, r2AccessKeyId, r2AccountId, r2BucketName, r2SecretAccessKey } from "@/lib/env";

/**
 * Cloudflare R2 (S3 compatible) storage for the photo library.
 *
 * Object keys follow the spec:
 *   photos/public/thumb|article|preview/<code>.webp   served from the public bucket URL
 *   photos/private/web|full/<code>.jpg                only reachable through a signed URL
 *
 * Credentials never leave the server. Public files are addressed through
 * PHOTO_PUBLIC_BASE_URL so the bucket can move to photos.bansko.now without code changes.
 */

export type PhotoVariant = "thumb" | "article" | "preview" | "web_license" | "full_resolution";

const publicPrefixes: Record<Extract<PhotoVariant, "thumb" | "article" | "preview">, string> = {
  thumb: "photos/public/thumb",
  article: "photos/public/article",
  preview: "photos/public/preview"
};

const privatePrefixes: Record<Extract<PhotoVariant, "web_license" | "full_resolution">, string> = {
  web_license: "photos/private/web",
  full_resolution: "photos/private/full"
};

export function photoStorageConfigured() {
  return Boolean(r2AccountId && r2AccessKeyId && r2SecretAccessKey && r2BucketName);
}

export function photoPublicUrlConfigured() {
  return Boolean(photoPublicBaseUrl);
}

export function photoObjectKey(variant: PhotoVariant, photoCode: string) {
  if (variant === "web_license") return `${privatePrefixes.web_license}/${photoCode}.jpg`;
  if (variant === "full_resolution") return `${privatePrefixes.full_resolution}/${photoCode}.jpg`;
  return `${publicPrefixes[variant]}/${photoCode}.webp`;
}

/** Public URL of an already uploaded derivative; null when the key or the base URL is missing. */
export function getPublicPhotoUrl(key: string | null | undefined) {
  if (!key || !photoPublicBaseUrl) return null;
  if (key.startsWith("photos/private/")) return null;
  return `${photoPublicBaseUrl}/${key.replace(/^\//, "")}`;
}

function client() {
  if (!photoStorageConfigured()) throw new Error("R2 storage is not configured");
  return new AwsClient({
    accessKeyId: r2AccessKeyId as string,
    secretAccessKey: r2SecretAccessKey as string,
    service: "s3",
    region: "auto"
  });
}

function objectUrl(key: string) {
  return `https://${r2AccountId}.r2.cloudflarestorage.com/${r2BucketName}/${key.replace(/^\//, "")}`;
}

export async function uploadPhoto(key: string, body: Buffer, contentType: string) {
  const payload = new Uint8Array(body);
  const signed = await client().sign(objectUrl(key), {
    method: "PUT",
    body: payload,
    headers: {
      "Content-Type": contentType,
      // Derivatives are immutable: the key changes when a photo is reprocessed.
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });

  // Send the signed request with a plain body and an explicit length: a Request object turns the
  // body into a stream, the length header is lost and R2 answers 411 Length Required.
  const headers = new Headers(signed.headers);
  headers.set("Content-Length", String(payload.byteLength));

  const response = await fetch(signed.url, { method: "PUT", headers, body: payload });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`R2 upload failed (${response.status}) for ${key}${detail ? `: ${detail.slice(0, 200)}` : ""}`);
  }
  return key;
}

/**
 * Presigned PUT URL so the admin browser can send a large master straight to R2.
 * Vercel caps request bodies at a few megabytes, so the file never passes through the server.
 */
export async function createUploadUrl(key: string, expiresInSeconds = 900) {
  const url = new URL(objectUrl(key));
  url.searchParams.set("X-Amz-Expires", String(Math.min(Math.max(expiresInSeconds, 60), 3600)));
  const signed = await client().sign(url.toString(), { method: "PUT", aws: { signQuery: true } });
  return signed.url;
}

/** Reads an object back into the server (used to build derivatives from an uploaded master). */
export async function getPhotoObject(key: string) {
  const response = await client().fetch(objectUrl(key), { method: "GET" });
  if (!response.ok) throw new Error(`R2 read failed (${response.status}) for ${key}`);
  return Buffer.from(await response.arrayBuffer());
}

export async function deletePhoto(key: string) {
  const response = await client().fetch(objectUrl(key), { method: "DELETE" });
  if (!response.ok && response.status !== 404) {
    throw new Error(`R2 delete failed (${response.status}) for ${key}`);
  }
}

export async function objectExists(key: string) {
  const response = await client().fetch(objectUrl(key), { method: "HEAD" });
  return response.ok;
}

/**
 * Temporary GET URL for a purchased file. Generated on demand and never stored,
 * so a leaked link stops working after `expiresInSeconds`.
 */
export async function createPrivateDownloadUrl(key: string, expiresInSeconds = 1800, downloadName?: string) {
  const url = new URL(objectUrl(key));
  url.searchParams.set("X-Amz-Expires", String(Math.min(Math.max(expiresInSeconds, 60), 604800)));
  if (downloadName) {
    url.searchParams.set("response-content-disposition", `attachment; filename="${downloadName.replace(/"/g, "")}"`);
  }
  const signed = await client().sign(url.toString(), { method: "GET", aws: { signQuery: true } });
  return signed.url;
}
