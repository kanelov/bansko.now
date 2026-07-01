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
  created_at?: string;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
