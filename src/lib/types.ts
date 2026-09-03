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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
