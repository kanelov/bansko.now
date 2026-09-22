"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBusinessOwner } from "@/lib/business-platform/auth";
import {
  businessMediaConfigured,
  businessMediaUrls,
  createBusinessUploadTicket,
  deleteBusinessMedia,
  finalizeBusinessImage
} from "@/lib/business-platform/media";
import { revalidateBusinessPublic } from "@/lib/business-platform/revalidate";
import { resolveTheme, serializeTheme, themeReadabilityIssue } from "@/lib/business-platform/theme";
import type { Json } from "@/lib/types";

/**
 * Брандът на бизнеса: една тема за QR менюто, телевизорите и печата.
 * Записва се в business_platform_settings.branding през клиента с бисквитки
 * (RLS: собственикът пише само своя ред; пазачът на колони пази статус и
 * план). Нищо от формата не стига до базата сурово - минава през
 * resolveTheme(), така че в стиловете влизат само стойности от списъка.
 */

const brandingPath = "/business/branding";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function boolValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "on" || value === "1" || value === "true";
}

/** Цвят от <input type="color">: празен или с отметка „по темата“ значи null (пресетът решава). */
function colorValue(formData: FormData, key: string) {
  if (boolValue(formData, `${key}_auto`)) return null;
  const value = stringValue(formData, key);
  return value || null;
}

export async function saveBrandingAction(formData: FormData) {
  const { supabase, business } = await requireBusinessOwner({ businessId: stringValue(formData, "business_id") });

  /* Празен шрифт = „според темата“: resolveTheme() взима подразбирането на пресета. */
  const theme = resolveTheme({
    preset: stringValue(formData, "preset"),
    accent: colorValue(formData, "accent"),
    background: colorValue(formData, "background"),
    ink: colorValue(formData, "ink"),
    heading_font: stringValue(formData, "heading_font") || undefined,
    body_font: stringValue(formData, "body_font") || undefined,
    grain: boolValue(formData, "grain"),
    ornament: stringValue(formData, "ornament"),
    logo_media_id: stringValue(formData, "logo_media_id") || null,
    qr_icon: stringValue(formData, "qr_icon")
  });

  /* Ръчни цветове, които не се четат (тъмен фон с тъмен текст, блед акцент), не се записват. */
  const readability = themeReadabilityIssue(theme);
  if (readability) redirect(`${brandingPath}?error=${readability}`);

  /* Логото трябва да е реален ред от вида 'logo' на същия бизнес; иначе се пази без лого. */
  if (theme.logo_media_id) {
    const { data: logo } = await supabase
      .from("business_media")
      .select("id")
      .eq("id", theme.logo_media_id)
      .eq("business_id", business.businessId)
      .eq("kind", "logo")
      .eq("media_type", "image")
      .maybeSingle();
    if (!logo) {
      theme.logo_media_id = null;
    }
  }

  const { data, error } = await supabase
    .from("business_platform_settings")
    /* serializeTheme() дава плосък обект само с низове, булеви и null - валиден jsonb. */
    .update({ branding: serializeTheme(theme) as Json })
    .eq("business_id", business.businessId)
    .select("business_id");

  if (error) redirect(`${brandingPath}?error=save`);
  /* Без ред в настройките (бизнесът още не е на платформата) няма къде да се запише. */
  if (!data || data.length === 0) redirect(`${brandingPath}?error=settings`);

  /* Едва сега си отиват старото лого и качванията без запис: всеки ред от вида 'logo',
     който записаната тема не ползва. Неуспешно чистене не проваля записа. */
  await cleanupUnusedLogos(supabase, business.businessId, theme.logo_media_id);

  /* QR менюто е статично - пресъздава се; телевизорите виждат новата версия сами. */
  await revalidateBusinessPublic(supabase, business.businessId);
  revalidatePath(brandingPath);
  redirect(`${brandingPath}?saved=1`);
}

async function cleanupUnusedLogos(supabase: Awaited<ReturnType<typeof requireBusinessOwner>>["supabase"], businessId: string, keepId: string | null) {
  let query = supabase.from("business_media").select("id").eq("business_id", businessId).eq("kind", "logo");
  if (keepId) {
    query = query.neq("id", keepId);
  }
  const { data: stale } = await query;
  for (const row of stale ?? []) {
    await deleteBusinessMedia(supabase, businessId, row.id).catch(() => undefined);
  }
}

/* ------------------------------------------------------------------------ */
/* Лого: викат се от клиентското поле, не от формата                          */
/* ------------------------------------------------------------------------ */

type UploadTicket = { ok: true; key: string; url: string } | { ok: false; error: string };

export async function createBrandLogoUploadAction(input: { contentType: string; bytes: number }): Promise<UploadTicket> {
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

type FinalizeResult = { ok: true; id: string; url: string | null; width: number | null } | { ok: false; error: string };

export async function finalizeBrandLogoAction(input: { key: string }): Promise<FinalizeResult> {
  const { supabase, business } = await requireBusinessOwner();

  try {
    const media = await finalizeBusinessImage({ supabase, businessId: business.businessId, key: String(input.key || ""), kind: "logo", alt: business.name });
    return { ok: true, id: media.id, url: businessMediaUrls(media).w480, width: media.width };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Обработката на логото не успя." };
  }
}

