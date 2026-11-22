"use server";

import { redirect } from "next/navigation";
import { requireBusinessOwner } from "@/lib/business-platform/auth";
import {
  businessMediaConfigured,
  businessMediaUrls,
  createBusinessUploadTicket,
  finalizeBusinessImage
} from "@/lib/business-platform/media";
import { revalidateBusinessPublic } from "@/lib/business-platform/revalidate";

/**
 * Профилът на бизнеса от портала (2026-11-22): описание BG/EN, адрес, контакти,
 * линкове и снимки. Името, адресът в сайта (slug), категорията, премиум статусът,
 * одобрението и собствената HTML част остават за администратора – пазят ги
 * тригерите в базата, а тук формата изобщо не ги праща. Клиентът е с бисквитки,
 * така че важи RLS.
 */

const profilePath = "/business/profile";
const maxImages = 12;

function text(formData: FormData, key: string, max: number) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function urlOrNull(value: string) {
  if (!value) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export async function saveBusinessProfileAction(formData: FormData) {
  const { supabase, business } = await requireBusinessOwner({ businessId: text(formData, "business_id", 64) });

  const descriptionBg = text(formData, "description_bg", 3000);
  const descriptionEn = text(formData, "description_en", 3000);
  const addressBg = text(formData, "address_bg", 200);
  const addressEn = text(formData, "address_en", 200);
  const phone = text(formData, "phone", 40);
  const email = text(formData, "email_public", 160);
  const website = urlOrNull(text(formData, "website_url", 300));
  const facebook = urlOrNull(text(formData, "facebook_url", 300));
  const instagram = urlOrNull(text(formData, "instagram_url", 300));

  if (website === undefined || facebook === undefined || instagram === undefined) redirect(`${profilePath}?error=url`);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) redirect(`${profilePath}?error=email`);
  if (phone && !/^[+\d][\d\s()/-]{4,}$/.test(phone)) redirect(`${profilePath}?error=phone`);

  const { error } = await supabase
    .from("businesses")
    .update({
      description: descriptionBg,
      address: addressBg || "Банско",
      phone: phone || null,
      email_public: email || null,
      website_url: website ?? null,
      facebook_url: facebook ?? null,
      instagram_url: instagram ?? null
    })
    .eq("id", business.businessId);
  if (error) redirect(`${profilePath}?error=save`);

  const { error: bgError } = await supabase
    .from("business_translations")
    .update({ description: descriptionBg, address: addressBg || "Банско" })
    .eq("business_id", business.businessId)
    .eq("locale", "bg");
  if (bgError) redirect(`${profilePath}?error=save`);

  /* Английският превод: обновява се, а ако още го няма и има описание – създава се. */
  const { data: english } = await supabase
    .from("business_translations")
    .select("business_id")
    .eq("business_id", business.businessId)
    .eq("locale", "en")
    .maybeSingle();

  if (english) {
    const { error: enError } = await supabase
      .from("business_translations")
      .update({ description: descriptionEn, address: addressEn || addressBg || "Bansko" })
      .eq("business_id", business.businessId)
      .eq("locale", "en");
    if (enError) redirect(`${profilePath}?error=save`);
  } else if (descriptionEn) {
    const [{ data: bg }, { data: row }] = await Promise.all([
      supabase.from("business_translations").select("slug, name").eq("business_id", business.businessId).eq("locale", "bg").maybeSingle(),
      supabase.from("businesses").select("category_id").eq("id", business.businessId).maybeSingle()
    ]);
    const { data: category } = row?.category_id
      ? await supabase.from("business_category_translations").select("name").eq("category_id", row.category_id).eq("locale", "en").maybeSingle()
      : { data: null };
    const { error: insertError } = await supabase.from("business_translations").insert({
      business_id: business.businessId,
      locale: "en",
      slug: bg?.slug ?? business.slug,
      name: bg?.name ?? business.name,
      category: category?.name ?? "Business",
      description: descriptionEn,
      address: addressEn || addressBg || "Bansko",
      faqs: [],
      features: [],
      robots_index: true,
      robots_follow: true
    });
    if (insertError) redirect(`${profilePath}?error=save`);
  }

  await revalidateBusinessPublic(supabase, business.businessId);
  redirect(`${profilePath}?saved=1`);
}

/* ------------------------------------------------------------ снимки */

type Ticket = { ok: true; key: string; url: string } | { ok: false; error: string };

export async function createProfilePhotoUploadAction(input: { contentType: string; bytes: number }): Promise<Ticket> {
  const { business } = await requireBusinessOwner();
  if (!businessMediaConfigured()) return { ok: false, error: "Хранилището за снимки не е настроено." };
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

type ImagesResult = { ok: true; images: string[] } | { ok: false; error: string };

async function currentImages(supabase: Awaited<ReturnType<typeof requireBusinessOwner>>["supabase"], businessId: string) {
  const { data } = await supabase.from("businesses").select("images").eq("id", businessId).maybeSingle();
  return (data?.images ?? []).filter((url): url is string => typeof url === "string" && url.length > 0);
}

async function saveImages(supabase: Awaited<ReturnType<typeof requireBusinessOwner>>["supabase"], businessId: string, images: string[]): Promise<ImagesResult> {
  const { error } = await supabase.from("businesses").update({ images }).eq("id", businessId);
  if (error) return { ok: false, error: "Снимките не се записаха." };
  await revalidateBusinessPublic(supabase, businessId);
  return { ok: true, images };
}

/** След качване: размерите се правят от сървъра, а в профила влиза големият (1600 px) WebP. */
export async function finalizeProfilePhotoAction(input: { key: string }): Promise<ImagesResult> {
  const { supabase, business } = await requireBusinessOwner();
  const images = await currentImages(supabase, business.businessId);
  if (images.length >= maxImages) return { ok: false, error: `Най-много ${maxImages} снимки.` };

  try {
    const media = await finalizeBusinessImage({ supabase, businessId: business.businessId, key: String(input.key || ""), kind: "gallery", alt: null });
    const urls = businessMediaUrls(media);
    const url = urls.w1600 ?? urls.w960 ?? urls.original;
    if (!url) return { ok: false, error: "Снимката няма публичен адрес." };
    return saveImages(supabase, business.businessId, [...images, url]);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Обработката на снимката не успя." };
  }
}

export async function removeProfilePhotoAction(input: { url: string }): Promise<ImagesResult> {
  const { supabase, business } = await requireBusinessOwner();
  const images = await currentImages(supabase, business.businessId);
  return saveImages(
    supabase,
    business.businessId,
    images.filter((url) => url !== input.url)
  );
}

/** Първата снимка е главната: тя е в картата в каталога и горе в страницата. */
export async function makeMainProfilePhotoAction(input: { url: string }): Promise<ImagesResult> {
  const { supabase, business } = await requireBusinessOwner();
  const images = await currentImages(supabase, business.businessId);
  if (!images.includes(input.url)) return { ok: false, error: "Снимката не е намерена." };
  return saveImages(supabase, business.businessId, [input.url, ...images.filter((url) => url !== input.url)]);
}
