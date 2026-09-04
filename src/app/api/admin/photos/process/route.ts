import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/auth";
import { createPhotoDerivatives } from "@/lib/photo-processing";
import { deletePhoto, getPhotoObject, photoStorageConfigured } from "@/lib/photo-storage";
import { revalidatePublicPath } from "@/lib/articles-admin";
import { slugify } from "@/lib/slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Turns an uploaded master into a photo record: reads it back from R2, builds the five
 * derivatives, stores them and creates the draft row. The temporary upload is removed.
 */
export async function POST(request: Request) {
  const { supabase } = await requireAdmin();
  if (!photoStorageConfigured()) {
    return NextResponse.json({ error: "R2 не е конфигуриран." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { key?: string; filename?: string } | null;
  const key = String(body?.key || "");
  if (!key.startsWith("photos/incoming/")) {
    return NextResponse.json({ error: "Невалиден файл." }, { status: 400 });
  }

  const filename = String(body?.filename || "").replace(/\.[^.]+$/, "").slice(0, 120);
  const title = filename.replace(/[-_]+/g, " ").trim() || "Нова фотография";
  let photoId: string | null = null;

  try {
    const buffer = await getPhotoObject(key);

    // Reserve the row first so the photo code exists before the files are named after it.
    const baseSlug = slugify(title) || "photo";
    const { data: created, error: insertError } = await supabase
      .from("photos")
      .insert({ slug: `${baseSlug}-${Date.now().toString(36)}`, title_bg: title, master_source: "admin_upload" })
      .select("id,photo_code,slug")
      .single();
    if (insertError || !created) throw new Error(insertError?.message || "Записът не беше създаден.");
    photoId = created.id;

    const derivatives = await createPhotoDerivatives(buffer, created.photo_code);
    const { error: updateError } = await supabase
      .from("photos")
      .update({ ...derivatives, slug: `${baseSlug}-${created.photo_code.toLowerCase()}` })
      .eq("id", created.id);
    if (updateError) throw new Error(updateError.message);

    await deletePhoto(key).catch(() => undefined);
    revalidatePath("/admin/photos");
    revalidatePublicPath("/photos");
    return NextResponse.json({ id: created.id, photo_code: created.photo_code, title }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Обработката не успя.";
    console.error("[photo processing failed]", message);

    // Leave no half made photo behind, and keep the reason where the admin can read it.
    if (photoId) await supabase.from("photos").delete().eq("id", photoId);
    await supabase
      .from("photo_import_jobs")
      .upsert(
        {
          source: "admin_upload",
          source_file_id: key,
          source_filename: String(body?.filename || "").slice(0, 200),
          status: "failed",
          error_message: message.slice(0, 500),
          processed_at: new Date().toISOString()
        },
        { onConflict: "source,source_file_id" }
      );
    await deletePhoto(key).catch(() => undefined);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
