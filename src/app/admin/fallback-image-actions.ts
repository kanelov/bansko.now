"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { revalidateEditorialPaths, revalidatePublicPath } from "@/lib/articles-admin";
import { parseFallbackKeywords } from "@/lib/fallback-images";
import { requireAdmin } from "@/lib/supabase/auth";
import type { ArticleFallbackImage } from "@/lib/types";

const adminPath = "/admin/settings/fallback-images";

function value(formData: FormData, key: string, maxLength = 300) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim().slice(0, maxLength) : "";
}

function fail(message: string): never {
  redirect(`${adminPath}?error=${encodeURIComponent(message)}`);
}

/** Every article without its own picture may change, so the lists and the article pages are refreshed. */
function refreshPublicPages() {
  revalidatePath(adminPath);
  revalidatePath("/admin/articles");
  revalidateEditorialPaths();
  revalidatePublicPath("/[categorySlug]", "page");
  revalidatePublicPath("/[categorySlug]/[articleSlug]", "page");
}

function imageUrlFrom(formData: FormData) {
  const url = value(formData, "image_url", 1000) || value(formData, "image_pick", 1000);
  if (!url) fail("Избери снимка или постави адрес на снимка.");
  if (!/^https:\/\/|^\//.test(url)) fail("Адресът на снимката трябва да започва с https:// .");
  return url;
}

function fieldsFrom(formData: FormData): Pick<ArticleFallbackImage, "title" | "title_en" | "keywords" | "sort_order"> {
  const title = value(formData, "title", 200);
  if (!title) fail("Липсва описание на снимката.");
  const sortOrder = Number.parseInt(value(formData, "sort_order", 10), 10);
  return {
    title,
    title_en: value(formData, "title_en", 200) || null,
    keywords: parseFallbackKeywords(value(formData, "keywords", 2000)).slice(0, 60),
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0
  };
}

export async function createFallbackImageAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const payload = { ...fieldsFrom(formData), image_url: imageUrlFrom(formData), is_active: true };
  const { error } = await supabase.from("article_fallback_images").insert(payload);
  if (error) fail(error.message);
  refreshPublicPages();
  redirect(`${adminPath}?saved=created`);
}

export async function updateFallbackImageAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = value(formData, "id", 40);
  if (!id) fail("Липсва идентификатор.");
  const payload = {
    ...fieldsFrom(formData),
    image_url: imageUrlFrom(formData),
    is_active: formData.get("is_active") === "on"
  };
  const { error } = await supabase.from("article_fallback_images").update(payload).eq("id", id);
  if (error) fail(error.message);
  refreshPublicPages();
  redirect(`${adminPath}?saved=updated`);
}

export async function deleteFallbackImageAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = value(formData, "id", 40);
  if (!id) fail("Липсва идентификатор.");
  const { error } = await supabase.from("article_fallback_images").delete().eq("id", id);
  if (error) fail(error.message);
  refreshPublicPages();
  redirect(`${adminPath}?saved=deleted`);
}
