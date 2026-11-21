"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBusinessOwner } from "@/lib/business-platform/auth";
import { generateDisplayToken, sendTvRefreshSignal, slideDurationDefault, slideDurationMax, slideDurationMin } from "@/lib/business-platform/displays";
import { slideHtmlMaxLength } from "@/lib/business-platform/display-slides";
import {
  businessMediaConfigured,
  businessMediaUrls,
  createBusinessUploadTicket,
  deleteBusinessMedia,
  finalizeBusinessImage,
  finalizeBusinessVideo
} from "@/lib/business-platform/media";
import type { BusinessDisplayTemplate, BusinessDisplayTheme } from "@/lib/types";

/**
 * Всички записи по екраните. Първият ред на всяко действие е
 * requireBusinessOwner(); клиентът е с бисквитки, така че RLS важи. Екраните
 * не пресъздават публични страници - телевизорът сам вижда новата версия.
 */

const displaysPath = "/business/displays";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const templates: BusinessDisplayTemplate[] = ["menu_only", "menu_image", "menu_video", "slides"];
const maxSlides = 30;
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

type SlideInput = { kind: "media" | "html"; mediaId: string; html: string; title: string; subtitle: string; duration: number };
const maxSlidesHtmlTotal = 3_000_000;

/** Слайдовете идват като JSON от клиентското поле; приема се само познат вид и граници. */
function slidesValue(formData: FormData): SlideInput[] | null {
  const raw = stringValue(formData, "slides_json");
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.slice(0, maxSlides).map((item) => {
      const entry = (item ?? {}) as Record<string, unknown>;
      const duration = Math.round(Number(entry.duration));
      const kind = entry.kind === "html" ? "html" : "media";
      const html = kind === "html" && typeof entry.html === "string" ? entry.html.trim() : "";
      return {
        kind,
        html: html.length <= slideHtmlMaxLength ? html : "",
        mediaId: kind === "media" && typeof entry.mediaId === "string" && uuidPattern.test(entry.mediaId) ? entry.mediaId : "",
        title: typeof entry.title === "string" ? entry.title.trim().slice(0, 80) : "",
        subtitle: typeof entry.subtitle === "string" ? entry.subtitle.trim().slice(0, 160) : "",
        duration: Number.isFinite(duration) ? Math.min(slideDurationMax, Math.max(slideDurationMin, duration)) : slideDurationDefault
      };
    });
  } catch {
    return null;
  }
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
  const slides = template === "slides" ? slidesValue(formData) : [];
  if (template === "slides") {
    if (!slides || slides.some((slide) => (slide.kind === "html" ? !slide.html : !slide.mediaId))) redirect(withError(formPath, "slides"));
    if (slides.length === 0) redirect(withError(formPath, "slides-empty"));
    if (slides.reduce((sum, slide) => sum + slide.html.length, 0) > maxSlidesHtmlTotal) redirect(withError(formPath, "slides-html-size"));
    /* Всяка медия на слайд трябва да е на този бизнес. */
    const ids = Array.from(new Set(slides.filter((slide) => slide.kind === "media").map((slide) => slide.mediaId)));
    if (ids.length > 0) {
      const { data: owned } = await supabase.from("business_media").select("id").eq("business_id", business.businessId).in("id", ids);
      if ((owned ?? []).length !== ids.length) redirect(withError(formPath, "slides"));
    }
  }
  if ((template === "menu_image" || template === "menu_video") && !mediaId) redirect(withError(formPath, "media"));

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
    media_id: template === "menu_image" || template === "menu_video" ? mediaId : null,
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

  /* Слайдовете също наведнъж. При друг шаблон редовете остават, за да не се
     губят, ако собственикът се върне към „Слайдове“. */
  if (template === "slides" && slides) {
    const { error: clearError } = await supabase
      .from("business_display_slides")
      .delete()
      .eq("display_id", displayId)
      .eq("business_id", business.businessId);
    if (clearError) redirect(withError(`${displaysPath}/${displayId}`, "slides-save"));

    const { error: slidesError } = await supabase.from("business_display_slides").insert(
      slides.map((slide, index) => ({
        display_id: displayId as string,
        business_id: business.businessId,
        kind: slide.kind,
        media_id: slide.kind === "media" ? slide.mediaId : null,
        html: slide.kind === "html" ? slide.html : null,
        title: slide.title,
        subtitle: slide.subtitle,
        duration_seconds: slide.duration,
        sort_order: (index + 1) * 10
      }))
    );
    if (slidesError) redirect(withError(`${displaysPath}/${displayId}`, "slides-save"));
  }

  /* Записан екран = телевизорите на бизнеса се опресняват до 2 минути. */
  try {
    await sendTvRefreshSignal(business.businessId);
  } catch (error) {
    console.error("[tv refresh after save]", error);
  }

  revalidatePath(displaysPath);
  revalidatePath("/business");
  redirect(`${displaysPath}/${displayId}?saved=1`);
}

/**
 * „Опресни телевизорите“: след промени в менюто или слайдовете. Телевизорите
 * поглеждат сигнала на 2 минути и се презареждат. Иначе се зареждат сами
 * само 3 пъти на ден (06, 12 и 18 ч.).
 */
export async function refreshDisplaysAction(formData: FormData) {
  const { business } = await requireBusinessOwner({ businessId: stringValue(formData, "business_id") });

  try {
    await sendTvRefreshSignal(business.businessId);
  } catch (error) {
    console.error("[tv refresh]", error);
    redirect(withError(displaysPath, "refresh"));
  }

  redirect(`${displaysPath}?saved=refresh`);
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

export async function createDisplayImageUploadAction(input: { contentType: string; bytes: number; mediaType?: "image" | "video" }): Promise<UploadTicket> {
  const { business } = await requireBusinessOwner();
  const mediaType = input.mediaType === "video" ? "video" : "image";

  if (!businessMediaConfigured()) {
    return { ok: false, error: "Хранилището за снимки не е настроено." };
  }

  try {
    const ticket = await createBusinessUploadTicket({
      businessId: business.businessId,
      contentType: String(input.contentType || ""),
      bytes: Number(input.bytes),
      mediaType
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

/** Видео за екран, качено от собственика (MP4 до 150 MB, направо в R2). */
export async function finalizeDisplayVideoAction(input: { key: string }): Promise<FinalizeResult> {
  const { supabase, business } = await requireBusinessOwner();

  try {
    const media = await finalizeBusinessVideo({ supabase, businessId: business.businessId, key: String(input.key || ""), kind: "display", alt: null });
    return { ok: true, id: media.id, url: businessMediaUrls(media).original };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Обработката на видеото не успя." };
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
