import "server-only";
import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { businessMediaUrls, type BusinessMediaUrls } from "@/lib/business-platform/media";
import { siteUrl } from "@/lib/env";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BusinessDisplay, BusinessDisplayTemplate, BusinessDisplayTheme, BusinessMediaType, Database, Json } from "@/lib/types";

/**
 * Екраните (телевизорите). Екранът е списък с настройки върху централното
 * меню: кои категории, кой шаблон, коя снимка или видео. Порталът чете и пише
 * таблиците през RLS; телевизорът получава своя екран само по token през
 * функциите display_by_token / display_version, така че анонимен посетител
 * не може да изброи чужди екрани.
 */

type Client = SupabaseClient<Database>;

export const displayTemplates: { value: BusinessDisplayTemplate; label: string; hint: string }[] = [
  { value: "menu_only", label: "Само меню", hint: "Целият екран е менюто." },
  { value: "menu_image", label: "Меню + снимка", hint: "Менюто вляво, снимка вдясно." },
  { value: "menu_video", label: "Меню + видео", hint: "Менюто вляво, видео в цикъл вдясно, без звук." }
];

export const displayThemes: { value: BusinessDisplayTheme; label: string }[] = [
  { value: "dark", label: "Тъмна" },
  { value: "light", label: "Светла" }
];

/** 32 знака от URL-безопасна азбука: достатъчно, за да не се познае, кратко за писане на телевизор. */
export function generateDisplayToken() {
  return randomBytes(24).toString("base64url").slice(0, 32);
}

export function displayUrl(token: string) {
  return `${siteUrl}/display/${token}`;
}

/* 5 знака без объркващи (0/O, 1/l/I): ~28 милиона комбинации, лесни за писане с дистанционно. */
const shortCodeAlphabet = "abcdefghjkmnpqrstuvwxyz23456789";

export function generateShortCode() {
  const bytes = randomBytes(5);
  return Array.from(bytes, (byte) => shortCodeAlphabet[byte % shortCodeAlphabet.length]).join("");
}

/** Късият адрес за телевизора, без https:// - така се показва и така се пише на телевизора. */
export function shortDisplayAddress(code: string) {
  return `${siteUrl.replace(/^https?:\/\//, "")}/tv/${code}`;
}

/** Токенът по къс код (за /tv/<code>). null = няма такъв / спрян / модулът е изключен. */
export async function getDisplayTokenByCode(code: string): Promise<string | null> {
  const supabase = createPublicSupabaseClient();
  if (!supabase || !/^[a-z0-9]{4,12}$/i.test(code)) return null;
  const { data } = await supabase.rpc("display_token_by_code", { p_code: code.toLowerCase() });
  return typeof data === "string" && data ? data : null;
}

/** Екранът е „онлайн“, когато е питал за версията през последните 3 минути. */
export function isDisplayOnline(lastSeenAt: string | null, now = Date.now()) {
  return Boolean(lastSeenAt) && now - new Date(lastSeenAt as string).getTime() < 3 * 60 * 1000;
}

export type DisplayListItem = BusinessDisplay & {
  categoryNames: string[];
  online: boolean;
};

/** Списъкът за портала: екраните с имената на категориите им. */
export async function listDisplays(supabase: Client, businessId: string): Promise<DisplayListItem[]> {
  const [{ data: displays }, { data: links }, { data: names }] = await Promise.all([
    supabase.from("business_displays").select("*").eq("business_id", businessId).order("created_at"),
    supabase.from("business_display_categories").select("display_id, category_id, sort_order").eq("business_id", businessId).order("sort_order"),
    supabase.from("business_menu_category_translations").select("category_id, name").eq("business_id", businessId).eq("locale", "bg")
  ]);

  const nameById = new Map((names ?? []).map((row) => [row.category_id, row.name]));

  return (displays ?? []).map((display) => ({
    ...display,
    categoryNames: (links ?? [])
      .filter((link) => link.display_id === display.id)
      .map((link) => nameById.get(link.category_id))
      .filter((name): name is string => Boolean(name)),
    online: isDisplayOnline(display.last_seen_at)
  }));
}

export type DisplayForEdit = BusinessDisplay & { categoryIds: string[] };

export async function getDisplayForEdit(supabase: Client, businessId: string, id: string): Promise<DisplayForEdit | null> {
  const { data: display } = await supabase.from("business_displays").select("*").eq("business_id", businessId).eq("id", id).maybeSingle();

  if (!display) {
    return null;
  }

  const { data: links } = await supabase
    .from("business_display_categories")
    .select("category_id, sort_order")
    .eq("display_id", display.id)
    .order("sort_order");

  return { ...display, categoryIds: (links ?? []).map((link) => link.category_id) };
}

/** Снимките и видеата на бизнеса, между които екранът избира. */
export type DisplayMediaOption = {
  id: string;
  mediaType: BusinessMediaType;
  alt: string | null;
  urls: BusinessMediaUrls;
  createdAt: string;
};

export async function listDisplayMedia(supabase: Client, businessId: string): Promise<DisplayMediaOption[]> {
  const { data } = await supabase
    .from("business_media")
    .select("id, media_type, alt, original_key, variant_keys, created_at")
    .eq("business_id", businessId)
    .eq("kind", "display")
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    mediaType: row.media_type,
    alt: row.alt,
    urls: businessMediaUrls(row),
    createdAt: row.created_at
  }));
}

export type AdminBusinessVideo = { id: string; url: string | null; alt: string | null; createdAt: string };

/** Видеата за екрани на всички бизнеси - за админа, който ги качва (RLS пуска админа навсякъде). */
export async function listBusinessVideosForAdmin(): Promise<Map<string, AdminBusinessVideo[]>> {
  const supabase = await createSupabaseServerClient();
  const result = new Map<string, AdminBusinessVideo[]>();

  if (!supabase) {
    return result;
  }

  const { data } = await supabase
    .from("business_media")
    .select("id, business_id, original_key, variant_keys, alt, created_at")
    .eq("media_type", "video")
    .eq("kind", "display")
    .order("created_at", { ascending: false });

  for (const row of data ?? []) {
    const list = result.get(row.business_id) ?? [];
    list.push({ id: row.id, url: businessMediaUrls(row).original, alt: row.alt, createdAt: row.created_at });
    result.set(row.business_id, list);
  }

  return result;
}

/* ----------------------------------------------------------- телевизорът */

export type PublicDisplay = {
  id: string;
  businessId: string;
  businessName: string;
  name: string;
  template: BusinessDisplayTemplate;
  theme: BusinessDisplayTheme;
  showDescriptions: boolean;
  /** „content_version-updated_at“, същото, което връща /api/display/<token>/version. */
  version: string;
  categoryIds: string[];
  media: { mediaType: BusinessMediaType; alt: string | null; urls: BusinessMediaUrls } | null;
};

type DisplayPayload = {
  id: string;
  business_id: string;
  business_name: string;
  name: string;
  template: BusinessDisplayTemplate;
  theme: BusinessDisplayTheme;
  show_descriptions: boolean;
  updated_at: string;
  content_version: number;
  category_ids: string[];
  media: { media_type: BusinessMediaType; original_key: string; variant_keys: Json; alt: string | null } | null;
};

export function displayVersionString(contentVersion: number, updatedAt: string) {
  return `${contentVersion}-${Math.floor(new Date(updatedAt).getTime() / 1000)}`;
}

/** Екранът по token, както го вижда телевизорът. null = няма такъв / спрян / модулът е изключен. */
export async function getDisplayByToken(token: string): Promise<PublicDisplay | null> {
  const supabase = createPublicSupabaseClient();

  if (!supabase || !/^[A-Za-z0-9_-]{16,64}$/.test(token)) {
    return null;
  }

  const { data } = await supabase.rpc("display_by_token", { p_token: token });
  const payload = data as DisplayPayload | null;

  if (!payload || typeof payload !== "object" || !payload.id) {
    return null;
  }

  return {
    id: payload.id,
    businessId: payload.business_id,
    businessName: payload.business_name,
    name: payload.name,
    template: payload.template,
    theme: payload.theme,
    showDescriptions: payload.show_descriptions,
    version: displayVersionString(payload.content_version, payload.updated_at),
    categoryIds: Array.isArray(payload.category_ids) ? payload.category_ids : [],
    media: payload.media
      ? { mediaType: payload.media.media_type, alt: payload.media.alt, urls: businessMediaUrls({ original_key: payload.media.original_key, variant_keys: payload.media.variant_keys }) }
      : null
  };
}

/** Само версията - за проверката на 60 s. Записва и „видях те“. */
export async function getDisplayVersion(token: string): Promise<string | null> {
  const supabase = createPublicSupabaseClient();

  if (!supabase || !/^[A-Za-z0-9_-]{16,64}$/.test(token)) {
    return null;
  }

  const { data } = await supabase.rpc("display_version", { p_token: token });
  return typeof data === "string" && data ? data : null;
}
