import type { ArtStudioFormConfig, ArtStudioFormField, ArtStudioFormFieldOption, ArtStudioSourceSizes, Json, Locale, SourceVariantGroup } from "@/lib/types";

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
  const tags = Array.isArray(raw.tags) ? raw.tags.map((tag) => text(tag, 40).toLowerCase()).filter(Boolean).slice(0, 10) : [];
  return { value: optionValue, label_bg: labelBg, label_en: text(raw.label_en, 120) || null, ...(tags.length ? { tags } : {}) };
}

function normalizeFilter(value: unknown): ArtStudioFormField["filter_by"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const field = text(raw.field, 50).toLowerCase();
  const mapRaw = raw.map && typeof raw.map === "object" && !Array.isArray(raw.map) ? (raw.map as Record<string, unknown>) : {};
  const map: Record<string, string> = {};
  for (const [key, tag] of Object.entries(mapRaw)) {
    const cleanKey = text(key, 80);
    const cleanTag = text(tag, 40).toLowerCase();
    if (cleanKey && cleanTag) map[cleanKey] = cleanTag;
  }
  return field && Object.keys(map).length ? { field, map } : null;
}

function normalizeField(value: unknown): ArtStudioFormField | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const key = text(raw.key, 50).toLowerCase();
  if (!keyPattern.test(key)) return null;
  const options = Array.isArray(raw.options) ? raw.options.map(normalizeOption).filter((option): option is ArtStudioFormFieldOption => Boolean(option)) : [];
  if (!options.length) return null;
  const display = text(raw.display, 10) === "select" ? "select" : "chips";
  return {
    key,
    label_bg: text(raw.label_bg, 120) || key,
    label_en: text(raw.label_en, 120) || null,
    required: raw.required === true || raw.required === "true",
    display,
    filter_by: normalizeFilter(raw.filter_by),
    options
  };
}

/** Options visible for a field given the currently selected values of the other fields. */
export function visibleOptions(field: ArtStudioFormField, selected: Record<string, string>) {
  if (!field.filter_by) return field.options;
  const source = selected[field.filter_by.field];
  const tag = source ? field.filter_by.map[source] : undefined;
  if (!tag) return field.options;
  const filtered = field.options.filter((option) => option.tags?.includes(tag));
  return filtered.length ? filtered : field.options;
}

const sourceSkuPattern = /^ART-STUDIO-[A-Z0-9-]{1,20}$/;

function textList(value: unknown, maxItems = 20, maxLength = 80) {
  return Array.isArray(value) ? value.map((item) => text(item, maxLength)).filter(Boolean).slice(0, maxItems) : [];
}

function normalizeSourceSizes(value: unknown): ArtStudioSourceSizes | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const types = textList(raw.types);
  if (!types.length) return null;
  const labelsRaw = raw.labels_en && typeof raw.labels_en === "object" && !Array.isArray(raw.labels_en) ? (raw.labels_en as Record<string, unknown>) : {};
  const labels_en: Record<string, string> = {};
  for (const [key, label] of Object.entries(labelsRaw)) {
    const cleanKey = text(key, 80);
    const cleanLabel = text(label, 80);
    if (cleanKey && cleanLabel) labels_en[cleanKey] = cleanLabel;
  }
  return {
    types,
    variants_include: textList(raw.variants_include),
    labels_en,
    model_label_bg: text(raw.model_label_bg, 120) || null,
    model_label_en: text(raw.model_label_en, 120) || null,
    size_label_bg: text(raw.size_label_bg, 120) || null,
    size_label_en: text(raw.size_label_en, 120) || null,
    replaces: Array.isArray(raw.replaces) ? textList(raw.replaces, 10, 50).map((key) => key.toLowerCase()) : ["model", "size"],
    required: raw.required !== false && raw.required !== "false"
  };
}

export function normalizeFormConfig(value: Json | null | undefined): ArtStudioFormConfig {
  const raw = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const fields = Array.isArray(raw.fields) ? raw.fields.map(normalizeField).filter((field): field is ArtStudioFormField => Boolean(field)) : [];
  const photo = text(raw.photo_upload, 20);
  const sourceSku = text(raw.source_sku, 40).toUpperCase();

  return {
    fields,
    photo_upload: photo === "required" || photo === "none" ? photo : "optional",
    photo_label_bg: text(raw.photo_label_bg, 160) || null,
    photo_label_en: text(raw.photo_label_en, 160) || null,
    quantity: raw.quantity !== false && raw.quantity !== "false",
    source_sku: sourceSkuPattern.test(sourceSku) ? sourceSku : null,
    source_sizes: normalizeSourceSizes(raw.source_sizes)
  };
}

/** Placeholder SKU in the request app when the product type does not set one. */
export function defaultSourceSku(internalName: string) {
  switch (internalName) {
    case "custom-tshirts":
      return "ART-STUDIO-TSHIRT";
    case "fine-art-prints":
      return "ART-STUDIO-PRINT";
    case "mugs-drinkware":
      return "ART-STUDIO-MUG";
    case "icons":
      return "ART-STUDIO-ICON";
    default:
      return "ART-STUDIO-CUSTOM";
  }
}

/** Source product types (with sizes) that this form offers, in the configured order. */
export function sourceGroupsForConfig(config: ArtStudioFormConfig, groups: SourceVariantGroup[]): SourceVariantGroup[] {
  const sizes = config.source_sizes;
  if (!sizes) return [];
  const include = sizes.variants_include.map((part) => part.toLowerCase());
  return sizes.types
    .map((name) => groups.find((group) => group.name.toLowerCase() === name.toLowerCase()))
    .filter((group): group is SourceVariantGroup => Boolean(group))
    .map((group) => ({
      ...group,
      variants: include.length ? group.variants.filter((variant) => include.some((part) => variant.label.toLowerCase().includes(part))) : group.variants
    }))
    .filter((group) => group.variants.length > 0);
}

export function sourceGroupLabel(group: SourceVariantGroup, sizes: ArtStudioSourceSizes, locale: Locale) {
  return locale === "en" ? sizes.labels_en[group.name] || group.name : group.name;
}

export function sourceModelLabel(sizes: ArtStudioSourceSizes, locale: Locale) {
  return locale === "en" ? sizes.model_label_en || sizes.model_label_bg || "Model" : sizes.model_label_bg || "Модел";
}

export function sourceSizeLabel(sizes: ArtStudioSourceSizes, locale: Locale) {
  return locale === "en" ? sizes.size_label_en || sizes.size_label_bg || "Size" : sizes.size_label_bg || "Размер";
}

/** Static fields still shown when the live source sizes are (or are not) available. */
export function visibleFields(config: ArtStudioFormConfig, sourceActive: boolean) {
  if (!sourceActive || !config.source_sizes) return config.fields;
  const hidden = config.source_sizes.replaces;
  return config.fields.filter((field) => !hidden.includes(field.key));
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
