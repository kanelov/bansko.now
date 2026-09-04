import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { createUploadUrl, photoStorageConfigured } from "@/lib/photo-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Gives the admin browser a short lived URL to upload one master JPEG straight into R2. */
export async function POST(request: Request) {
  await requireAdmin();
  if (!photoStorageConfigured()) {
    return NextResponse.json({ error: "R2 не е конфигуриран." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { filename?: string; contentType?: string } | null;
  const contentType = String(body?.contentType || "");
  if (!["image/jpeg", "image/jpg", "image/png", "image/webp", "image/tiff"].includes(contentType)) {
    return NextResponse.json({ error: "Позволени са JPEG, PNG, WebP и TIFF." }, { status: 400 });
  }

  const key = `photos/incoming/${randomUUID()}`;
  const url = await createUploadUrl(key);
  return NextResponse.json({ key, url }, { headers: { "Cache-Control": "no-store" } });
}
