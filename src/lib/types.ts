export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Locale = "bg" | "en";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image_url?: string | null;
  robots_index?: boolean;
  robots_follow?: boolean;
  schema_type?: string | null;
  is_visible?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CategoryTranslation = {
  category_id: string;
  locale: Locale;
  name: string;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  robots_index: boolean;
  robots_follow: boolean;
  schema_type: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
  locale: Locale;
  created_at?: string;
};

export type ArticleStatus = "draft" | "published" | "scheduled";

export type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: ArticleStatus;
  category_id: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  seo_title: string | null;
  seo_description: string | null;
  focus_keyword: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  robots_index: boolean;
  robots_follow: boolean;
  reading_time: number | null;
  author_name: string | null;
  source_links: Json;
  internal_link_suggestions: Json;
  schema_type: string | null;
  is_featured: boolean;
  is_homepage_highlight: boolean;
  show_facebook_cta: boolean;
  show_art_studio_block: boolean;
  show_bansko_collection_block: boolean;
  locale: Locale;
  translation_group_id: string;
  source_drive_id?: string | null;
  source_email_id?: string | null;
  automation_source?: string | null;
  article_type?: string | null;
  location?: string | null;
  observed_at?: string | null;
  image_caption?: string | null;
  photo_credit?: string | null;
  automation_last_imported_at?: string | null;
  content_hub_item_id?: string | null;
};

export type ArticleWithCategory = Article & {
  category?: Category | null;
  categories?: Category | null;
  tags?: Tag[];
  /** True when `featured_image_url` was filled from the default image pool at render time. */
  featured_image_is_fallback?: boolean;
};

/** One HTML block under the articles / on the main pages (`article_blocks`). */
export type ArticleBlock = {
  id: string;
  key: string;
  title: string;
  html_bg: string;
  html_en: string;
  is_active: boolean;
  sort_order: number;
  article_toggle: string | null;
  created_at: string;
  updated_at: string;
};

/** One default article image with the keywords that select it (`article_fallback_images`). */
export type ArticleFallbackImage = {
  id: string;
  image_url: string;
  title: string;
  title_en: string | null;
  keywords: string[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SiteSettings = {
  id: string;
  site_name: string | null;
  logo_image_url: string | null;
  logo_image_alt: string | null;
  site_description: string | null;
  facebook_group_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  default_og_image: string | null;
  hero_media_type: "image" | "video" | "embed" | null;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  hero_video_url: string | null;
  hero_video_poster_url: string | null;
  hero_embed_url: string | null;
  support_enabled: boolean;
  support_button_label: string | null;
  support_title: string | null;
  support_description: string | null;
  support_image_url: string | null;
  support_image_alt: string | null;
  support_stripe_url: string | null;
  support_paypal_url: string | null;
  facebook_cta_eyebrow: string | null;
  facebook_cta_title: string | null;
  facebook_cta_text: string | null;
  facebook_cta_button_label: string | null;
  art_studio_block_eyebrow: string | null;
  art_studio_block_title: string | null;
  art_studio_block_text: string | null;
  art_studio_block_button_label: string | null;
  collection_block_eyebrow: string | null;
  collection_block_title: string | null;
  collection_block_text: string | null;
  collection_block_button_label: string | null;
  collection_items: string[] | null;
  default_author_name: string | null;
  created_at?: string;
  updated_at?: string;
};

export type SiteSettingsTranslation = {
  site_settings_id: string;
  locale: Locale;
  site_description: string | null;
  hero_image_alt: string | null;
  support_button_label: string | null;
  support_title: string | null;
  support_description: string | null;
  support_image_alt: string | null;
  facebook_cta_eyebrow: string | null;
  facebook_cta_title: string | null;
  facebook_cta_text: string | null;
  facebook_cta_button_label: string | null;
  art_studio_block_eyebrow: string | null;
  art_studio_block_title: string | null;
  art_studio_block_text: string | null;
  art_studio_block_button_label: string | null;
  collection_block_eyebrow: string | null;
  collection_block_title: string | null;
  collection_block_text: string | null;
  collection_block_button_label: string | null;
  collection_items: string[] | null;
  created_at?: string;
  updated_at?: string;
};

export type NavigationItem = {
  id: string;
  label: string;
  href: string;
  icon_name: string | null;
  sort_order: number;
  is_external: boolean;
  open_in_new_tab: boolean;
  is_active: boolean;
  aria_label: string | null;
  created_at?: string;
  updated_at?: string;
};

export type NavigationItemTranslation = {
  navigation_item_id: string;
  locale: Locale;
  label: string;
  aria_label: string | null;
  created_at?: string;
  updated_at?: string;
};

export type SocialLink = {
  id: string;
  platform: string;
  label: string;
  url: string;
  icon_name: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type MediaItem = {
  id: string;
  file_url: string;
  file_name: string | null;
  alt_text: string | null;
  caption: string | null;
  created_at: string;
};

export type MediaTranslation = {
  media_id: string;
  locale: Locale;
  alt_text: string | null;
  caption: string | null;
  created_at?: string;
  updated_at?: string;
};

export type EditablePage = {
  id: string;
  title: string;
  slug: string;
  eyebrow: string | null;
  excerpt: string | null;
  content: string | null;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  cta_label: string | null;
  cta_url: string | null;
  status: "draft" | "published";
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  robots_index: boolean;
  robots_follow: boolean;
  schema_type: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  locale: Locale;
  translation_group_id: string;
};

export type ArtStudioService = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  image_alt: string | null;
  button_label: string | null;
  button_url: string | null;
  price_label: string | null;
  features: string[] | null;
  is_premium: boolean;
  is_active: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
};

export type ArtStudioServiceTranslation = {
  service_id: string;
  locale: Locale;
  title: string;
  description: string | null;
  image_alt: string | null;
  button_label: string | null;
  price_label: string | null;
  features: string[];
  seo_title: string | null;
  seo_description: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ArtStudioProductType = {
  id: string;
  internal_name: string;
  icon_name: string | null;
  image_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  form_config: Json;
  gallery_urls: string[];
  /** Show ready designs from the synced gallery above the order form. */
  gallery_picker_enabled: boolean;
  /** Root gallery category id (stable id from the request app), never a name or slug. */
  gallery_category_id: string | null;
};

export type ArtStudioProductTypeTranslation = {
  product_type_id: string;
  locale: Locale;
  title: string;
  slug: string;
  description: string | null;
  image_alt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  robots_index: boolean;
  robots_follow: boolean;
  created_at: string;
  updated_at: string;
  content: string | null;
};

export type LocalizedArtStudioProductType = ArtStudioProductType & ArtStudioProductTypeTranslation & {
  alternate_slug: string | null;
};

export type ArtStudioCategory = {
  id: string;
  product_type_id: string;
  internal_name: string;
  icon_name: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ArtStudioCategoryTranslation = {
  category_id: string;
  locale: Locale;
  title: string;
  slug: string;
  description: string | null;
  image_alt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  robots_index: boolean;
  robots_follow: boolean;
  created_at: string;
  updated_at: string;
};

export type LocalizedArtStudioCategory = ArtStudioCategory & ArtStudioCategoryTranslation;

export type ArtStudioProduct = {
  id: string;
  product_type_id: string;
  category_id: string | null;
  sku: string | null;
  image_url: string | null;
  gallery_urls: string[];
  personalization_text_enabled: boolean;
  idea_note_enabled: boolean;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ArtStudioProductTranslation = {
  product_id: string;
  locale: Locale;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  image_alt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  robots_index: boolean;
  robots_follow: boolean;
  created_at: string;
  updated_at: string;
};

export type ArtStudioOptionValue = {
  value: string;
  label_bg: string;
  label_en: string | null;
  hex_color: string | null;
};

export type ArtStudioFormFieldOption = {
  value: string;
  label_bg: string;
  label_en?: string | null;
  /** Group tags used by filter_by on another field (for example "adult", "kids", "baby"). */
  tags?: string[];
  /** Colour swatch (CSS colour) shown inside the pill, for colour choices. */
  swatch?: string | null;
};

export type ArtStudioFormField = {
  key: string;
  label_bg: string;
  label_en?: string | null;
  required?: boolean;
  /** "chips" renders pill buttons (default), "select" a dropdown. */
  display?: "chips" | "select";
  /** Show only options whose tags include map[selected value of another field]. */
  filter_by?: { field: string; map: Record<string, string> } | null;
  /** Show the whole field only when another field has one of these values. */
  show_when?: { field: string; values: string[] } | null;
  options: ArtStudioFormFieldOption[];
};

/**
 * Sizes taken live from the request app catalog (app.kanelov.com) instead of static options.
 * `types` lists the source product type names to offer (for example "Унисекс тениски").
 */
export type ArtStudioSourceSizeGroup = {
  key: string;
  label_bg: string;
  label_en: string | null;
  /** Source product type names merged into this choice (for example kids + baby T-shirts). */
  types: string[];
};

export type ArtStudioSourceSizes = {
  groups: ArtStudioSourceSizeGroup[];
  variants_include: string[];
  labels_en: Record<string, string>;
  model_label_bg: string | null;
  model_label_en: string | null;
  size_label_bg: string | null;
  size_label_en: string | null;
  /** Static field keys hidden while the source sizes are available (default model, size). */
  replaces: string[];
  required: boolean;
};

export type ArtStudioFormConfig = {
  fields: ArtStudioFormField[];
  photo_upload: "none" | "optional" | "required";
  photo_label_bg?: string | null;
  photo_label_en?: string | null;
  quantity: boolean;
  /** Placeholder SKU in the request app used for the automatic work-queue request. */
  source_sku: string | null;
  source_sizes: ArtStudioSourceSizes | null;
};

/** Product type with its size variants as published by the request app catalog API. */
export type SourceVariantGroup = {
  id: string;
  name: string;
  label_en?: string | null;
  variants: Array<{ id: string; label: string }>;
};

export type ArtStudioProductOption = {
  id: string;
  product_id: string;
  option_key: string;
  label_bg: string;
  label_en: string | null;
  input_type: "select" | "radio" | "swatch";
  is_required: boolean;
  values: ArtStudioOptionValue[];
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ArtStudioProductOffer = {
  id: string;
  product_id: string;
  label_bg: string;
  label_en: string | null;
  price: number;
  currency: string;
  payment_link_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type LocalizedArtStudioProduct = ArtStudioProduct & ArtStudioProductTranslation & {
  alternate_slug: string | null;
  product_type: LocalizedArtStudioProductType;
  category: LocalizedArtStudioCategory | null;
  options: ArtStudioProductOption[];
  offers: ArtStudioProductOffer[];
};

export type ArtStudioPublicSettings = {
  id: string;
  pickup_name_bg: string | null;
  pickup_name_en: string | null;
  pickup_address_bg: string | null;
  pickup_address_en: string | null;
  pickup_phone: string | null;
  pickup_instructions_bg: string | null;
  pickup_instructions_en: string | null;
  econt_instructions_bg: string | null;
  econt_instructions_en: string | null;
  orders_enabled: boolean;
  /** Editable texts for the Art Studio landing and product type pages (see art-studio-copy.ts). */
  page_copy: Json;
  created_at: string;
  updated_at: string;
};

export type ArtStudioPaymentStatus = "pending" | "paid" | "failed" | "expired" | "refunded";
export type ArtStudioProductionStatus = "new" | "in_production" | "ready_for_pickup" | "shipped" | "completed" | "cancelled";

export type ArtStudioOrder = {
  id: string;
  order_number: string;
  product_id: string | null;
  offer_id: string | null;
  product_snapshot: Json;
  locale: Locale;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_phone: string;
  personalization_text: string | null;
  idea_note: string | null;
  quantity: number;
  selected_options: Json;
  delivery_method: "econt_office" | "gallery_pickup";
  delivery_city: string | null;
  delivery_office: string | null;
  delivery_notes: string | null;
  unit_price: number;
  delivery_price: number;
  total: number;
  currency: string;
  payment_status: ArtStudioPaymentStatus;
  production_status: ArtStudioProductionStatus;
  payment_link_url: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_link_id: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  request_type: "payment" | "enquiry";
  attachment_path: string | null;
  source_request_id: string | null;
  source_synced_at: string | null;
  /** Set when the order is in the history tab; null while active. */
  archived_at: string | null;
  archive_reason: string | null;
  /** Last status event received from the request app. */
  source_status: string | null;
};

export type BusinessStatus = "draft" | "approved" | "rejected";
export type BusinessTier = "free" | "premium" | "homepage";
export type BusinessPaymentStatus = "unpaid" | "pending" | "paid" | "expired";

export type BusinessFaq = {
  question: string;
  answer: string;
};

export type BusinessListingPlan = {
  id: string;
  name: string;
  slug: string;
  tier: BusinessTier;
  period_months: number;
  price: number | null;
  currency: string;
  stripe_payment_link: string | null;
  description: string | null;
  benefits: string[] | null;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export type Business = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  video_link: string | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  images: string[] | null;
  faqs: Json;
  features: string[] | null;
  status: BusinessStatus;
  listing_tier: BusinessTier;
  requested_plan_id: string | null;
  active_plan_id: string | null;
  payment_status: BusinessPaymentStatus;
  paid_until: string | null;
  is_homepage_spotlight: boolean;
  homepage_spotlight_until: string | null;
  priority: number;
  map_pin_x: number | null;
  map_pin_y: number | null;
  show_on_illustrated_map: boolean;
  requested_services: string[] | null;
  admin_notes: string | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  robots_index: boolean;
  robots_follow: boolean;
  schema_type: string | null;
  category_id?: string | null;
  phone?: string | null;
  email_public?: string | null;
  created_at: string;
  updated_at: string;
};

export type BusinessTranslation = {
  business_id: string;
  locale: Locale;
  slug: string;
  name: string;
  category: string;
  description: string | null;
  address: string;
  image_alt: string | null;
  faqs: Json;
  features: string[];
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  robots_index: boolean;
  robots_follow: boolean;
  schema_type: string | null;
  created_at?: string;
  updated_at?: string;
};

export type BusinessContact = {
  id: string;
  business_id: string;
  owner_name: string;
  owner_phone: string | null;
  owner_email: string;
  created_at: string;
};

export type BusinessWithRelations = Business & {
  contact?: BusinessContact | null;
  business_contacts?: BusinessContact[] | null;
  requested_plan?: BusinessListingPlan | null;
  active_plan?: BusinessListingPlan | null;
};

/* Business Platform (docs/business-platform.md, CLAUDE.md раздел 28) */

export type BusinessMemberRole = "owner" | "staff";

export type BusinessMember = {
  id: string;
  business_id: string;
  user_id: string | null;
  role: BusinessMemberRole;
  invited_email: string | null;
  invited_by: string | null;
  invited_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BusinessPlatformStatus = "listing" | "active" | "suspended";
export type BusinessOpenOverride = "auto" | "open" | "closed";

export type BusinessPlatformSettings = {
  business_id: string;
  platform_status: BusinessPlatformStatus;
  plan: string;
  open_override: BusinessOpenOverride;
  content_version: number;
  created_at: string;
  updated_at: string;
};

export type BusinessModuleKey = "menu" | "hours" | "displays" | "print" | "promotions" | "analytics" | "custom_domain";

export type BusinessModule = {
  business_id: string;
  module: BusinessModuleKey;
  enabled: boolean;
  settings: Json;
  created_at: string;
  updated_at: string;
};

export type BusinessCategory = {
  id: string;
  slug: string;
  icon_name: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type BusinessCategoryTranslation = {
  id: string;
  category_id: string;
  locale: Locale;
  name: string;
};

export type BusinessMediaType = "image" | "video";
export type BusinessMediaKind = "cover" | "gallery" | "item" | "display" | "print_background" | "logo";

export type BusinessMedia = {
  id: string;
  business_id: string;
  media_type: BusinessMediaType;
  kind: BusinessMediaKind;
  original_key: string;
  variant_keys: Json;
  mime_type: string;
  bytes: number | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  alt: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type BusinessMenuCategory = {
  id: string;
  business_id: string;
  sort_order: number;
  is_active: boolean;
  icon_name: string | null;
  created_at: string;
  updated_at: string;
};

export type BusinessMenuCategoryTranslation = {
  id: string;
  category_id: string;
  business_id: string;
  locale: Locale;
  name: string;
  description: string | null;
};

export type BusinessMenuAvailability = "available" | "sold_out";

export type BusinessMenuItem = {
  id: string;
  business_id: string;
  category_id: string;
  price_cents: number | null;
  availability: BusinessMenuAvailability;
  is_active: boolean;
  sort_order: number;
  media_id: string | null;
  tags: string[];
  allergens: string[];
  created_at: string;
  updated_at: string;
};

export type BusinessMenuItemTranslation = {
  id: string;
  item_id: string;
  business_id: string;
  locale: Locale;
  name: string;
  description: string | null;
};

export type BusinessMenuItemVariant = {
  id: string;
  item_id: string;
  business_id: string;
  price_cents: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type BusinessMenuItemVariantTranslation = {
  id: string;
  variant_id: string;
  business_id: string;
  locale: Locale;
  name: string;
};

export type BusinessHour = {
  id: string;
  business_id: string;
  weekday: number;
  opens: string;
  closes: string;
  created_at: string;
  updated_at: string;
};

export type BusinessHourException = {
  id: string;
  business_id: string;
  date: string;
  opens: string | null;
  closes: string | null;
  is_closed: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type BusinessDisplayTemplate = "menu_only" | "menu_image" | "menu_video";
export type BusinessDisplayTheme = "dark" | "light";

export type BusinessDisplay = {
  id: string;
  business_id: string;
  name: string;
  token: string;
  template: BusinessDisplayTemplate;
  theme: BusinessDisplayTheme;
  media_id: string | null;
  show_descriptions: boolean;
  is_active: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BusinessDisplayCategory = {
  display_id: string;
  category_id: string;
  business_id: string;
  sort_order: number;
};

export type BusinessDirectorySettings = {
  id: string;
  intro_title: string | null;
  intro_description: string | null;
  premium_offer_title: string | null;
  premium_offer_description: string | null;
  map_image_url: string | null;
  map_image_alt: string | null;
  notification_email: string | null;
  about_title: string | null;
  about_eyebrow: string | null;
  about_description: string | null;
  about_body: string | null;
  about_image_url: string | null;
  contact_title: string | null;
  contact_description: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: "new" | "read" | "archived";
  created_at: string;
};

/** Photo library: the archive, its licenses and the link to articles. */
export type PhotoPriceTier = "standard" | "premium";
export type PhotoMonitoringStatus = "not_submitted" | "submitted" | "monitoring" | "disabled";

export type Photo = {
  id: string;
  photo_code: string;
  slug: string;
  price_tier: PhotoPriceTier;
  price_override_web: number | null;
  price_override_print: number | null;
  title_bg: string;
  title_en: string | null;
  description_bg: string | null;
  description_en: string | null;
  alt_bg: string | null;
  alt_en: string | null;
  caption_bg: string | null;
  caption_en: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  date_taken: string | null;
  year_taken: number | null;
  season: "winter" | "spring" | "summer" | "autumn" | null;
  orientation: "landscape" | "portrait" | "square" | null;
  width: number | null;
  height: number | null;
  camera_model: string | null;
  lens: string | null;
  category: string | null;
  tags: string[];
  master_source: string;
  google_drive_file_id: string | null;
  thumb_key: string | null;
  article_key: string | null;
  preview_key: string | null;
  web_license_key: string | null;
  full_resolution_key: string | null;
  dominant_color: string | null;
  is_published: boolean;
  is_featured: boolean;
  licensing_enabled: boolean;
  print_enabled: boolean;
  /** SKU of the matching product in the request app catalog; null = the photo code is used there. */
  catalog_sku: string | null;
  monitoring_status: PhotoMonitoringStatus;
  monitoring_reference: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type PhotoLicenseType = {
  id: string;
  code: string;
  name_bg: string;
  name_en: string;
  summary_bg: string | null;
  summary_en: string | null;
  download_variant: "web_license" | "full_resolution";
  price_standard_eur: number;
  price_premium_eur: number;
  print_run_limit: number | null;
  terms_bg: string;
  terms_en: string;
  terms_version: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ArticlePhoto = {
  id: string;
  article_id: string;
  photo_id: string;
  usage_type: "featured" | "inline" | "gallery";
  sort_order: number;
  created_at: string;
};

export type PhotoImportJob = {
  id: string;
  source: string;
  source_file_id: string;
  source_filename: string;
  status: "queued" | "processing" | "completed" | "failed";
  photo_id: string | null;
  error_message: string | null;
  attempts: number;
  created_at: string;
  processed_at: string | null;
};

export type PhotoLicenseOrder = {
  id: string;
  order_code: string;
  photo_id: string;
  license_type_id: string;
  license_code: string;
  license_version: number;
  license_terms_snapshot: string;
  locale: Locale;
  customer_email: string;
  customer_name: string | null;
  company_name: string | null;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded";
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_event_id: string | null;
  download_token: string;
  download_count: number;
  last_download_at: string | null;
  created_at: string;
  paid_at: string | null;
};

/** Public summary of one archive photo for the Art Studio print form (`GET /api/photos/[slug]`). */
export type PhotoPrintSummary = {
  photo_code: string;
  slug: string;
  title: string;
  alt: string;
  thumb_url: string | null;
  print_enabled: boolean;
};

export type PhotoPublicSettings = {
  id: string;
  /** Editable texts of the photo archive pages: { bg: {...}, en: {...} } (see photo-copy.ts). */
  page_copy: Json;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      articles: {
        Row: Article;
        Insert: Partial<Article> & Pick<Article, "title" | "slug" | "content">;
        Update: Partial<Article>;
        Relationships: [];
      };
      categories: {
        Row: Category;
        Insert: Partial<Category> & Pick<Category, "name" | "slug">;
        Update: Partial<Category>;
        Relationships: [];
      };
      category_translations: {
        Row: CategoryTranslation;
        Insert: Partial<CategoryTranslation> & Pick<CategoryTranslation, "category_id" | "locale" | "name">;
        Update: Partial<CategoryTranslation>;
        Relationships: [];
      };
      tags: {
        Row: Tag;
        Insert: Partial<Tag> & Pick<Tag, "name" | "slug">;
        Update: Partial<Tag>;
        Relationships: [];
      };
      article_tags: {
        Row: { article_id: string; tag_id: string };
        Insert: { article_id: string; tag_id: string };
        Update: never;
        Relationships: [];
      };
      site_settings: {
        Row: SiteSettings;
        Insert: Partial<SiteSettings>;
        Update: Partial<SiteSettings>;
        Relationships: [];
      };
      site_settings_translations: {
        Row: SiteSettingsTranslation;
        Insert: Partial<SiteSettingsTranslation> & Pick<SiteSettingsTranslation, "site_settings_id" | "locale">;
        Update: Partial<SiteSettingsTranslation>;
        Relationships: [];
      };
      navigation_items: {
        Row: NavigationItem;
        Insert: Partial<NavigationItem> & Pick<NavigationItem, "label" | "href">;
        Update: Partial<NavigationItem>;
        Relationships: [];
      };
      navigation_item_translations: {
        Row: NavigationItemTranslation;
        Insert: Partial<NavigationItemTranslation> & Pick<NavigationItemTranslation, "navigation_item_id" | "locale" | "label">;
        Update: Partial<NavigationItemTranslation>;
        Relationships: [];
      };
      social_links: {
        Row: SocialLink;
        Insert: Partial<SocialLink> & Pick<SocialLink, "platform" | "label" | "url">;
        Update: Partial<SocialLink>;
        Relationships: [];
      };
      media: {
        Row: MediaItem;
        Insert: {
          file_url: string;
          file_name?: string | null;
          alt_text?: string | null;
          caption?: string | null;
        };
        Update: Partial<{
          file_url: string;
          file_name: string | null;
          alt_text: string | null;
          caption: string | null;
        }>;
        Relationships: [];
      };
      media_translations: {
        Row: MediaTranslation;
        Insert: Partial<MediaTranslation> & Pick<MediaTranslation, "media_id" | "locale">;
        Update: Partial<MediaTranslation>;
        Relationships: [];
      };
      editable_pages: {
        Row: EditablePage;
        Insert: Partial<EditablePage> & Pick<EditablePage, "title" | "slug">;
        Update: Partial<EditablePage>;
        Relationships: [];
      };
      art_studio_services: {
        Row: ArtStudioService;
        Insert: Partial<ArtStudioService> & Pick<ArtStudioService, "title" | "slug">;
        Update: Partial<ArtStudioService>;
        Relationships: [];
      };
      art_studio_service_translations: {
        Row: ArtStudioServiceTranslation;
        Insert: Partial<ArtStudioServiceTranslation> & Pick<ArtStudioServiceTranslation, "service_id" | "locale" | "title">;
        Update: Partial<ArtStudioServiceTranslation>;
        Relationships: [];
      };
      photos: {
        Row: Photo;
        Insert: Partial<Photo> & Pick<Photo, "slug" | "title_bg">;
        Update: Partial<Photo>;
        Relationships: [];
      };
      photo_license_types: {
        Row: PhotoLicenseType;
        Insert: Partial<PhotoLicenseType> & Pick<PhotoLicenseType, "code" | "name_bg" | "name_en" | "download_variant" | "price_standard_eur" | "price_premium_eur">;
        Update: Partial<PhotoLicenseType>;
        Relationships: [];
      };
      article_photos: {
        Row: ArticlePhoto;
        Insert: Partial<ArticlePhoto> & Pick<ArticlePhoto, "article_id" | "photo_id">;
        Update: Partial<ArticlePhoto>;
        Relationships: [];
      };
      photo_import_jobs: {
        Row: PhotoImportJob;
        Insert: Partial<PhotoImportJob> & Pick<PhotoImportJob, "source_file_id">;
        Update: Partial<PhotoImportJob>;
        Relationships: [];
      };
      photo_license_orders: {
        Row: PhotoLicenseOrder;
        Insert: Partial<PhotoLicenseOrder> & Pick<PhotoLicenseOrder, "photo_id" | "license_type_id" | "license_code" | "license_version" | "license_terms_snapshot" | "customer_email" | "amount">;
        Update: Partial<PhotoLicenseOrder>;
        Relationships: [];
      };
      photo_public_settings: {
        Row: PhotoPublicSettings;
        Insert: Partial<PhotoPublicSettings>;
        Update: Partial<PhotoPublicSettings>;
        Relationships: [];
      };
      article_fallback_images: {
        Row: ArticleFallbackImage;
        Insert: Partial<ArticleFallbackImage> & Pick<ArticleFallbackImage, "image_url" | "title">;
        Update: Partial<ArticleFallbackImage>;
        Relationships: [];
      };
      article_blocks: {
        Row: ArticleBlock;
        Insert: Partial<ArticleBlock> & Pick<ArticleBlock, "key" | "title">;
        Update: Partial<ArticleBlock>;
        Relationships: [];
      };
      art_studio_product_types: {
        Row: ArtStudioProductType;
        Insert: Partial<ArtStudioProductType> & Pick<ArtStudioProductType, "internal_name">;
        Update: Partial<ArtStudioProductType>;
        Relationships: [];
      };
      art_studio_product_type_translations: {
        Row: ArtStudioProductTypeTranslation;
        Insert: Partial<ArtStudioProductTypeTranslation> & Pick<ArtStudioProductTypeTranslation, "product_type_id" | "locale" | "title" | "slug">;
        Update: Partial<ArtStudioProductTypeTranslation>;
        Relationships: [];
      };
      art_studio_categories: {
        Row: ArtStudioCategory;
        Insert: Partial<ArtStudioCategory> & Pick<ArtStudioCategory, "product_type_id" | "internal_name">;
        Update: Partial<ArtStudioCategory>;
        Relationships: [];
      };
      art_studio_category_translations: {
        Row: ArtStudioCategoryTranslation;
        Insert: Partial<ArtStudioCategoryTranslation> & Pick<ArtStudioCategoryTranslation, "category_id" | "locale" | "title" | "slug">;
        Update: Partial<ArtStudioCategoryTranslation>;
        Relationships: [];
      };
      art_studio_products: {
        Row: ArtStudioProduct;
        Insert: Partial<ArtStudioProduct> & Pick<ArtStudioProduct, "product_type_id">;
        Update: Partial<ArtStudioProduct>;
        Relationships: [];
      };
      art_studio_product_translations: {
        Row: ArtStudioProductTranslation;
        Insert: Partial<ArtStudioProductTranslation> & Pick<ArtStudioProductTranslation, "product_id" | "locale" | "title" | "slug">;
        Update: Partial<ArtStudioProductTranslation>;
        Relationships: [];
      };
      art_studio_product_options: {
        Row: ArtStudioProductOption;
        Insert: Partial<ArtStudioProductOption> & Pick<ArtStudioProductOption, "product_id" | "option_key" | "label_bg">;
        Update: Partial<ArtStudioProductOption>;
        Relationships: [];
      };
      art_studio_product_offers: {
        Row: ArtStudioProductOffer;
        Insert: Partial<ArtStudioProductOffer> & Pick<ArtStudioProductOffer, "product_id" | "label_bg" | "price">;
        Update: Partial<ArtStudioProductOffer>;
        Relationships: [];
      };
      art_studio_public_settings: {
        Row: ArtStudioPublicSettings;
        Insert: Partial<ArtStudioPublicSettings>;
        Update: Partial<ArtStudioPublicSettings>;
        Relationships: [];
      };
      art_studio_orders: {
        Row: ArtStudioOrder;
        Insert: Partial<ArtStudioOrder> & Pick<ArtStudioOrder, "order_number" | "product_snapshot" | "customer_first_name" | "customer_last_name" | "customer_email" | "customer_phone" | "delivery_method" | "unit_price" | "total">;
        Update: Partial<ArtStudioOrder>;
        Relationships: [];
      };
      business_listing_plans: {
        Row: BusinessListingPlan;
        Insert: Partial<BusinessListingPlan> & Pick<BusinessListingPlan, "name" | "slug">;
        Update: Partial<BusinessListingPlan>;
        Relationships: [];
      };
      businesses: {
        Row: Business;
        Insert: Partial<Business> & Pick<Business, "name" | "slug" | "category" | "address">;
        Update: Partial<Business>;
        Relationships: [];
      };
      business_translations: {
        Row: BusinessTranslation;
        Insert: Partial<BusinessTranslation> & Pick<BusinessTranslation, "business_id" | "locale" | "slug" | "name" | "category" | "address">;
        Update: Partial<BusinessTranslation>;
        Relationships: [];
      };
      business_contacts: {
        Row: BusinessContact;
        Insert: Partial<BusinessContact> & Pick<BusinessContact, "business_id" | "owner_name" | "owner_email">;
        Update: Partial<BusinessContact>;
        Relationships: [];
      };
      business_directory_settings: {
        Row: BusinessDirectorySettings;
        Insert: Partial<BusinessDirectorySettings>;
        Update: Partial<BusinessDirectorySettings>;
        Relationships: [];
      };
      contact_messages: {
        Row: ContactMessage;
        Insert: Partial<ContactMessage> & Pick<ContactMessage, "name" | "email" | "message">;
        Update: Partial<ContactMessage>;
        Relationships: [];
      };
      business_members: {
        Row: BusinessMember;
        Insert: Partial<BusinessMember> & Pick<BusinessMember, "business_id">;
        Update: Partial<BusinessMember>;
        Relationships: [];
      };
      business_platform_settings: {
        Row: BusinessPlatformSettings;
        Insert: Partial<BusinessPlatformSettings> & Pick<BusinessPlatformSettings, "business_id">;
        Update: Partial<BusinessPlatformSettings>;
        Relationships: [];
      };
      business_modules: {
        Row: BusinessModule;
        Insert: Partial<BusinessModule> & Pick<BusinessModule, "business_id" | "module">;
        Update: Partial<BusinessModule>;
        Relationships: [];
      };
      business_categories: {
        Row: BusinessCategory;
        Insert: Partial<BusinessCategory> & Pick<BusinessCategory, "slug">;
        Update: Partial<BusinessCategory>;
        Relationships: [];
      };
      business_category_translations: {
        Row: BusinessCategoryTranslation;
        Insert: Partial<BusinessCategoryTranslation> & Pick<BusinessCategoryTranslation, "category_id" | "locale" | "name">;
        Update: Partial<BusinessCategoryTranslation>;
        Relationships: [];
      };
      business_media: {
        Row: BusinessMedia;
        Insert: Partial<BusinessMedia> & Pick<BusinessMedia, "business_id" | "media_type" | "kind" | "original_key" | "mime_type">;
        Update: Partial<BusinessMedia>;
        Relationships: [];
      };
      business_menu_categories: {
        Row: BusinessMenuCategory;
        Insert: Partial<BusinessMenuCategory> & Pick<BusinessMenuCategory, "business_id">;
        Update: Partial<BusinessMenuCategory>;
        Relationships: [];
      };
      business_menu_category_translations: {
        Row: BusinessMenuCategoryTranslation;
        Insert: Partial<BusinessMenuCategoryTranslation> & Pick<BusinessMenuCategoryTranslation, "category_id" | "business_id" | "locale" | "name">;
        Update: Partial<BusinessMenuCategoryTranslation>;
        Relationships: [];
      };
      business_menu_items: {
        Row: BusinessMenuItem;
        Insert: Partial<BusinessMenuItem> & Pick<BusinessMenuItem, "business_id" | "category_id">;
        Update: Partial<BusinessMenuItem>;
        Relationships: [];
      };
      business_menu_item_translations: {
        Row: BusinessMenuItemTranslation;
        Insert: Partial<BusinessMenuItemTranslation> & Pick<BusinessMenuItemTranslation, "item_id" | "business_id" | "locale" | "name">;
        Update: Partial<BusinessMenuItemTranslation>;
        Relationships: [];
      };
      business_menu_item_variants: {
        Row: BusinessMenuItemVariant;
        Insert: Partial<BusinessMenuItemVariant> & Pick<BusinessMenuItemVariant, "item_id" | "business_id" | "price_cents">;
        Update: Partial<BusinessMenuItemVariant>;
        Relationships: [];
      };
      business_menu_item_variant_translations: {
        Row: BusinessMenuItemVariantTranslation;
        Insert: Partial<BusinessMenuItemVariantTranslation> & Pick<BusinessMenuItemVariantTranslation, "variant_id" | "business_id" | "locale" | "name">;
        Update: Partial<BusinessMenuItemVariantTranslation>;
        Relationships: [];
      };
      business_hours: {
        Row: BusinessHour;
        Insert: Partial<BusinessHour> & Pick<BusinessHour, "business_id" | "weekday" | "opens" | "closes">;
        Update: Partial<BusinessHour>;
        Relationships: [];
      };
      business_hour_exceptions: {
        Row: BusinessHourException;
        Insert: Partial<BusinessHourException> & Pick<BusinessHourException, "business_id" | "date">;
        Update: Partial<BusinessHourException>;
        Relationships: [];
      };
      business_displays: {
        Row: BusinessDisplay;
        Insert: Partial<BusinessDisplay> & Pick<BusinessDisplay, "business_id" | "name" | "token">;
        Update: Partial<BusinessDisplay>;
        Relationships: [];
      };
      business_display_categories: {
        Row: BusinessDisplayCategory;
        Insert: BusinessDisplayCategory;
        Update: Partial<BusinessDisplayCategory>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      display_by_token: { Args: { p_token: string }; Returns: Json };
      display_version: { Args: { p_token: string }; Returns: string | null };
      register_login_attempt: { Args: { p_email_hash: string; p_ip_hash: string }; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
