import type { Category, NavigationItem, SiteSettings, SocialLink } from "@/lib/types";

export const fallbackHeroImage =
  "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=1800&q=80";

export const categoryDefinitions: Category[] = [
  {
    id: "now",
    name: "Сега",
    slug: "now",
    description: "Какво се случва днес, тази седмица и този сезон в Банско.",
    seo_title: "Сега в Банско | Bansko NOW",
    seo_description: "Актуални идеи, събития и полезни новини за Банско."
  },
  {
    id: "events",
    name: "Събития",
    slug: "events",
    description: "Културни прояви, фестивали, концерти, изложби и инициативи в Банско и региона.",
    seo_title: "Събития в Банско | Bansko NOW",
    seo_description: "Фестивали, концерти, изложби и интересни събития в Банско."
  },
  {
    id: "explore",
    name: "Открий Банско",
    slug: "explore",
    description: "Места, разходки, гледки и маршрути за по-близко преживяване на града.",
    seo_title: "Открий Банско | Bansko NOW",
    seo_description: "Пътеводител за места, квартали, маршрути и идеи в Банско."
  },
  {
    id: "nature",
    name: "Природа",
    slug: "nature",
    description: "Пирин, пътеки, сезони, гледки и отговорно преживяване на планината.",
    seo_title: "Природа и Пирин | Bansko NOW",
    seo_description: "Маршрути, сезонни идеи и природни истории от Пирин."
  },
  {
    id: "culture",
    name: "Култура",
    slug: "culture",
    description: "Музика, традиции, изложби, занаяти и хората зад културния живот на Банско.",
    seo_title: "Култура в Банско | Bansko NOW",
    seo_description: "Културни истории, фестивали и традиции от Банско."
  },
  {
    id: "living",
    name: "Живот в Банско",
    slug: "living",
    description: "Практична и човешка гледна точка към ежедневието в планинския град.",
    seo_title: "Живот в Банско | Bansko NOW",
    seo_description: "Ежедневие, общност и полезна информация за живота в Банско."
  },
  {
    id: "food",
    name: "Храна и места",
    slug: "food",
    description: "Вкусове, уютни места, сезонни препоръки и локални преживявания.",
    seo_title: "Храна и места в Банско | Bansko NOW",
    seo_description: "Ресторанти, кафета, местни вкусове и препоръки в Банско."
  },
  {
    id: "art-studio",
    name: "Art Studio",
    slug: "art-studio",
    description: "Фотография, арт печат, платна и визуални решения, вдъхновени от Банско.",
    seo_title: "Art Studio към Bansko NOW",
    seo_description: "Fine art печат, фотографии, платна и визуални решения в Банско."
  },
  {
    id: "bansko-collection",
    name: "Bansko Collection",
    slug: "bansko-collection",
    description: "Авторски продукти и сезонни колекции, вдъхновени от Банско и Пирин.",
    seo_title: "Bansko Collection | Bansko NOW",
    seo_description: "Тениски, чаши, постери, принтове и продукти с характер от Банско."
  },
  {
    id: "stories",
    name: "Истории",
    slug: "stories",
    description: "Хора, спомени, лични гледни точки и малки истории от Банско.",
    seo_title: "Истории от Банско | Bansko NOW",
    seo_description: "Местни истории, хора и гледни точки от Банско."
  }
];

export const fallbackSettings: SiteSettings = {
  id: "fallback",
  site_name: "Bansko NOW",
  site_description: "Събития, култура, природа, хора и истории от Банско и Пирин.",
  facebook_group_url: "https://www.facebook.com/groups/banskonow",
  instagram_url: null,
  youtube_url: null,
  default_og_image: fallbackHeroImage,
  hero_media_type: "image",
  hero_image_url: fallbackHeroImage,
  hero_image_alt: "Банско и Пирин",
  hero_video_url: null,
  hero_video_poster_url: fallbackHeroImage,
  hero_embed_url: null,
  default_author_name: "Любо Канелов"
};

export const fallbackNavigationItems: NavigationItem[] = [
  { id: "now", label: "Сега", href: "/now", icon_name: "clock", sort_order: 10, is_external: false, open_in_new_tab: false, is_active: true, aria_label: null },
  { id: "events", label: "Събития", href: "/events", icon_name: "calendar-days", sort_order: 20, is_external: false, open_in_new_tab: false, is_active: true, aria_label: null },
  { id: "explore", label: "Открий Банско", href: "/explore", icon_name: "compass", sort_order: 30, is_external: false, open_in_new_tab: false, is_active: true, aria_label: null },
  { id: "nature", label: "Природа", href: "/nature", icon_name: "mountain", sort_order: 40, is_external: false, open_in_new_tab: false, is_active: true, aria_label: null },
  { id: "culture", label: "Култура", href: "/culture", icon_name: "masks-theater", sort_order: 50, is_external: false, open_in_new_tab: false, is_active: true, aria_label: null },
  { id: "living", label: "Живот", href: "/living", icon_name: "users", sort_order: 60, is_external: false, open_in_new_tab: false, is_active: true, aria_label: null },
  { id: "food", label: "Храна", href: "/food", icon_name: "utensils", sort_order: 70, is_external: false, open_in_new_tab: false, is_active: true, aria_label: null },
  { id: "art-studio", label: "Art Studio", href: "/art-studio", icon_name: "palette", sort_order: 80, is_external: false, open_in_new_tab: false, is_active: true, aria_label: null },
  { id: "bansko-collection", label: "Bansko Collection", href: "/bansko-collection", icon_name: "bag-shopping", sort_order: 90, is_external: false, open_in_new_tab: false, is_active: true, aria_label: null },
  { id: "community", label: "Общност", href: "/#community", icon_name: "users", sort_order: 100, is_external: false, open_in_new_tab: false, is_active: true, aria_label: null }
];

export function fallbackSocialLinks(settings: SiteSettings): SocialLink[] {
  return [
    settings.facebook_group_url
      ? {
          id: "facebook",
          platform: "facebook",
          label: "Facebook група",
          url: settings.facebook_group_url,
          icon_name: "facebook",
          sort_order: 10,
          is_active: true
        }
      : null,
    settings.instagram_url
      ? {
          id: "instagram",
          platform: "instagram",
          label: "Instagram",
          url: settings.instagram_url,
          icon_name: "instagram",
          sort_order: 20,
          is_active: true
        }
      : null,
    settings.youtube_url
      ? {
          id: "youtube",
          platform: "youtube",
          label: "YouTube",
          url: settings.youtube_url,
          icon_name: "youtube",
          sort_order: 30,
          is_active: true
        }
      : null
  ].filter(Boolean) as SocialLink[];
}
