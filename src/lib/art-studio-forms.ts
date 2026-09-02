import type { ArtStudioFormConfig, ArtStudioFormField, ArtStudioFormFieldOption, Json, Locale } from "@/lib/types";

/**
 * Order form configuration stored in art_studio_product_types.form_config.
 * Pure helpers shared by the server action and the client form.
 */

const keyPattern = /^[a-z0-9][a-z0-9_-]{0,49}$/;

function text(value: unknown, maxLength = 200) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeOption(value: unknown): ArtStudioFormFieldOption | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const optionValue = text(raw.value, 80);
  const labelBg = text(raw.label_bg, 120) || optionValue;
  if (!optionValue) return null;
  return { value: optionValue, label_bg: labelBg, label_en: text(raw.label_en, 120) || null };
}

function normalizeField(value: unknown): ArtStudioFormField | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const key = text(raw.key, 50).toLowerCase();
  if (!keyPattern.test(key)) return null;
  const options = Array.isArray(raw.options) ? raw.options.map(normalizeOption).filter((option): option is ArtStudioFormFieldOption => Boolean(option)) : [];
  if (!options.length) return null;
  return {
    key,
    label_bg: text(raw.label_bg, 120) || key,
    label_en: text(raw.label_en, 120) || null,
    required: raw.required === true || raw.required === "true",
    options
  };
}

export function normalizeFormConfig(value: Json | null | undefined): ArtStudioFormConfig {
  const raw = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const fields = Array.isArray(raw.fields) ? raw.fields.map(normalizeField).filter((field): field is ArtStudioFormField => Boolean(field)) : [];
  const photo = text(raw.photo_upload, 20);

  return {
    fields,
    photo_upload: photo === "required" || photo === "none" ? photo : "optional",
    photo_label_bg: text(raw.photo_label_bg, 160) || null,
    photo_label_en: text(raw.photo_label_en, 160) || null,
    quantity: raw.quantity !== false && raw.quantity !== "false"
  };
}

export function fieldLabel(field: ArtStudioFormField, locale: Locale) {
  return locale === "en" ? field.label_en || field.label_bg : field.label_bg;
}

export function optionLabel(option: ArtStudioFormFieldOption, locale: Locale) {
  return locale === "en" ? option.label_en || option.label_bg : option.label_bg;
}

export function photoLabel(config: ArtStudioFormConfig, locale: Locale) {
  const custom = locale === "en" ? config.photo_label_en || config.photo_label_bg : config.photo_label_bg;
  if (custom) return custom;
  return locale === "en" ? "Your photo or design (optional)" : "Твоя снимка или дизайн (по желание)";
}

export const maxAttachmentBytes = 15 * 1024 * 1024;
export const attachmentMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"];
