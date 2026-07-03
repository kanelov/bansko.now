export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
  created_at?: string;
  updated_at?: string;
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
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
};

export type ArticleWithCategory = Article & {
  category?: Category | null;
  categories?: Category | null;
  tags?: Tag[];
};

export type SiteSettings = {
  id: string;
  site_name: string | null;
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
  default_author_name: string | null;
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

export type BusinessStatus = "draft" | "approved" | "rejected";
export type BusinessTier = "free" | "featured" | "premium" | "homepage";
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
      navigation_items: {
        Row: NavigationItem;
        Insert: Partial<NavigationItem> & Pick<NavigationItem, "label" | "href">;
        Update: Partial<NavigationItem>;
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
