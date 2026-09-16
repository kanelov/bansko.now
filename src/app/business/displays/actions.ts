"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBusinessOwner } from "@/lib/business-platform/auth";
import { generateDisplayToken } from "@/lib/business-platform/displays";
import {
  businessMediaConfigured,
  businessMediaUrls,
  createBusinessUploadTicket,
  deleteBusinessMedia,
  finalizeBusinessImage
} from "@/lib/business-platform/media";
import type { BusinessDisplayTemplate, BusinessDisplayTheme } from "@/lib/types";

/**
 * Всички записи по екраните. Първият ред на всяко действие е
 * requireBusinessOwner(); клиентът е с бисквитки, така че RLS важи. Екраните
 * не пресъздават публични страници - телевизорът сам вижда новата версия.
 */

const displaysPath = "/business/displays";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const templates: BusinessDisplayTemplate[] = ["menu_only", "menu_image", "menu_video"];
const themes: BusinessDisplayTheme[] = ["dark", "light"];

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function boolValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "on" || value === "1" || value === "true";
}

function idValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  return uuidPattern.test(value) ? value : null;
}

function withError(path: string, code: string) {
  return `${path}${path.includes("?") ? "&" : "?"}error=${code}`;
}

export async function saveDisplayAction(formData: FormData) {
  const { supabase, business } = await requireBusinessOwner({ businessId: stringValue(formData, "business_id") });
  const id = idValue(formData, "id");
  const formPath = id ? `${displaysPath}/${id}` : `${displaysPath}/new`;

  const name = stringValue(formData, "name").slice(0, 60);
  const template = stringValue(formData, "template") as BusinessDisplayTemplate;
  const theme = stringValue(formData, "theme") as BusinessDisplayTheme;
  const mediaId = idValue(formData, "media_id");
  const showDescriptions = boolValue(formData, "show_descriptions");
  const isActive = boolValue(formData, "is_active");
  /* Категориите идват като списък от отметки в реда на менюто; редът на екрана е същият. */
  const categoryIds = formData
    .getAll("category_ids")
    .map((value) => (typeof value === "string" ? value : ""))
    .filter((value) => uuidPattern.test(value));

  if (!name) redirect(withError(formPath, "name"));
  if (!templates.includes(template)) redirect(withError(formPath, "template"));
  if (!themes.includes(theme)) redirect(withError(formPath, "template"));
  if (template !== "menu_only" && !mediaId) redirect(withError(formPath, "media"));

  /* Снимка към шаблон „видео“ или обратното не се приема: избраната медия трябва да е от вида на шаблона. */
  if (mediaId) {
    const { data: media } = await supabase
      .from("business_media")
      .select("id, media_type")
      .eq("id", mediaId)
      .eq("business_id", business.businessId)
      .maybeSingle();
    if (!media) redirect(withError(formPath, "media"));
    if (template === "menu_image" && media.media_type !== "image") redirect(withError(formPath, "media-kind"));
    if (template === "menu_video" && media.media_type !== "video") redirect(withError(formPath, "media-kind"));
  }

  const values = {
    name,
    template,
    theme,
    media_id: template === "menu_only" ? null : mediaId,
    show_descriptions: showDescriptions,
    is_active: isActive
  };

  let displayId = id;

  if (displayId) {
    const { error } = await supabase.from("business_displays").update(values).eq("id", displayId).eq("business_id", business.businessId);
    if (error) redirect(withError(formPath, "save"));
  } else {
    const { data, error } = await supabase
      .from("business_displays")
      .insert({ ...values, business_id: business.businessId, token: generateDisplayToken() })
      .select("id")
      .single();
    if (error || !data) redirect(withError(formPath, "save"));
    displayId = data.id;
  }

  /* Категориите се записват наведнъж: изтриване и вмъкване, най-много няколко реда. */
  await supabase.from("business_display_categories").delete().eq("display_id", displayId).eq("business_id", business.businessId);

  if (categoryIds.length > 0) {
    const { error } = await supabase.from("business_display_categories").insert(
      categoryIds.map((categoryId, index) => ({
        display_id: displayId as string,
        category_id: categoryId,
        business_id: business.businessId,
        sort_order: (index + 1) * 10
      }))
    );
    if (error) redirect(withError(`${displaysPath}/${displayId}`, "categories"));
  }

  revalidatePath(displaysPath);
  revalidatePath("/business");
  redirect(`${displaysPath}/${displayId}?saved=1`);
}

export async function deleteDisplayAction(formData: FormData) {
  const { supabase, business } = await requireBusinessOwner({ businessId: stringValue(formData, "business_id") });
  const id = idValue(formData, "id");

  if (!id) redirect(withError(displaysPath, "missing"));

  const { error } = await supabase.from("business_displays").delete().eq("id", id).eq("business_id", business.businessId);
  if (error) redirect(withError(displaysPath, "delete"));

  revalidatePath(displaysPath);
  revalidatePath("/business");
  redirect(`${displaysPath}?saved=deleted`);
}

/** Нов адрес за екрана: старият спира веднага. За случай, че адресът е изтекъл навън. */
export async function regenerateDisplayTokenAction(formData: FormData) {
  const { supabase, business } = await requireBusinessOwner({ businessId: stringValue(formData, "business_id") });
  const id = idValue(formData, "id");

  if (!id) redirect(withError(displaysPath, "missing"));

  const { error } = await supabase
    .from("business_displays")
    .update({ token: generateDisplayToken() })
    .eq("id", id)
    .eq("business_id", business.businessId);
  if (error) redirect(withError(`${displaysPath}/${id}`, "save"));

  revalidatePath(displaysPath);
  redirect(`${displaysPath}/${id}?saved=token`);
}

/* ------------------------------------------------------------------------ */
/* Снимка за екран: викат се от клиентския компонент, не от форма             */
/* ------------------------------------------------------------------------ */

type UploadTicket = { ok: true; key: string; url: string } | { ok: false; error: string };

export async function createDisplayImageUploadAction(input: { contentType: string; bytes: number }): Promise<UploadTicket> {
  const { business } = await requireBusinessOwner();

  if (!businessMediaConfigured()) {
    return { ok: false, error: "Хранилището за снимки не е настроено." };
  }

  try {
    const ticket = await createBusinessUploadTicket({
      businessId: business.businessId,
      contentType: String(input.contentType || ""),
      bytes: Number(input.bytes),
      mediaType: "image"
    });
    return { ok: true, ...ticket };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Неуспешна заявка за качване." };
  }
}

type FinalizeResult = { ok: true; id: string; url: string | null } | { ok: false; error: string };

export async function finalizeDisplayImageAction(input: { key: string }): Promise<FinalizeResult> {
  const { supabase, business } = await requireBusinessOwner();

  try {
    const media = await finalizeBusinessImage({ supabase, businessId: business.businessId, key: String(input.key || ""), kind: "display", alt: null });
    return { ok: true, id: media.id, url: businessMediaUrls(media).w480 };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Обработката на снимката не успя." };
  }
}

export async function deleteDisplayMediaAction(input: { id: string }): Promise<{ ok: boolean; error?: string }> {
  const { supabase, business } = await requireBusinessOwner();

  if (!uuidPattern.test(String(input.id || ""))) {
    return { ok: false, error: "Невалидна медия." };
  }

  try {
    await deleteBusinessMedia(supabase, business.businessId, input.id);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Изтриването не успя." };
  }
}
