"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { revalidateEditorialPaths, revalidatePublicPath } from "@/lib/articles-admin";
import { defaultArticleBlocks, isArticleToggleKey, manualBlockPlacement, sanitizeBlockHtml } from "@/lib/article-blocks";
import { slugify } from "@/lib/slug";
import { requireAdmin } from "@/lib/supabase/auth";

const adminPath = "/admin/blocks";

function value(formData: FormData, key: string, maxLength = 300) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim().slice(0, maxLength) : "";
}

function fail(message: string): never {
  redirect(`${adminPath}?error=${encodeURIComponent(message)}`);
}

/** The blocks sit on the home page, the lists and every article, so all of them are refreshed. */
function refreshPublicPages() {
  revalidatePath(adminPath);
  revalidatePublicPath("/", "layout");
  revalidateEditorialPaths();
  revalidatePublicPath("/[categorySlug]", "page");
  revalidatePublicPath("/[categorySlug]/[articleSlug]", "page");
}

/** Creates or updates one block by its key. HTML is kept as written, minus scripts and handlers. */
export async function saveArticleBlockAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const title = value(formData, "title", 120);
  if (!title) fail("Липсва име на блока.");

  const key = slugify(value(formData, "key", 60) || title).replace(/-/g, "_").slice(0, 60);
  if (!key) fail("Липсва ключ на блока.");

  const toggle = value(formData, "article_toggle", 60);
  const sortOrder = Number.parseInt(value(formData, "sort_order", 10), 10);
  const payload = {
    key,
    title,
    html_bg: sanitizeBlockHtml(value(formData, "html_bg", 40000)),
    html_en: sanitizeBlockHtml(value(formData, "html_en", 40000)),
    is_active: formData.get("is_active") === "on",
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    article_toggle: isArticleToggleKey(toggle) || toggle === manualBlockPlacement ? toggle : null
  };

  const { error } = await supabase.from("article_blocks").upsert(payload, { onConflict: "key" });
  if (error) fail(error.message);
  refreshPublicPages();
  redirect(`${adminPath}?saved=${encodeURIComponent(key)}`);
}

/** Removes the stored row. A built in key falls back to the default block in code. */
export async function deleteArticleBlockAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const key = value(formData, "key", 60);
  if (!key) fail("Липсва ключ на блока.");
  const { error } = await supabase.from("article_blocks").delete().eq("key", key);
  if (error) fail(error.message);
  refreshPublicPages();
  const isDefault = defaultArticleBlocks.some((block) => block.key === key);
  redirect(`${adminPath}?saved=${isDefault ? "reset" : "deleted"}`);
}
