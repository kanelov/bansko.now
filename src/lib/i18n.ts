import { siteUrl } from "@/lib/env";
import type { Locale } from "@/lib/types";

export const locales: Locale[] = ["bg", "en"];
export const defaultLocale: Locale = "bg";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function localePath(locale: Locale, path = "/") {
  if (/^(https?:|mailto:|tel:|#)/i.test(path)) {
    return path;
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;
  const withoutLocale = normalized === "/en" ? "/" : normalized.replace(/^\/en(?=\/|$)/, "") || "/";

  return locale === "en" ? `/en${withoutLocale === "/" ? "" : withoutLocale}` : withoutLocale;
}

export function localeUrl(locale: Locale, path = "/") {
  return `${siteUrl}${localePath(locale, path)}`;
}

export function localeFromParam(value: string): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export const dictionaries = {
  bg: {
    localeName: "Български",
    otherLocaleName: "English",
    home: "Начало",
    menu: "Меню",
    navigation: "Основна навигация",
    mobileNavigation: "Мобилна навигация",
    search: "Търсене",
    allArticles: "Всички статии",
    articlesMenu: "Статии",
    categoriesLabel: "Категории",
    articlesCountLabel: "статии",
    adminPanel: "Админ панел",
    project: "Проект",
    links: "Връзки",
    about: "За проекта",
    contact: "Контакт",
    localBusinesses: "Местни бизнеси",
    privacy: "Политика за поверителност",
    terms: "Условия за ползване",
    latestArticles: "Последни статии",
    featured: "Препоръчано",
    readMore: "Прочети повече",
    publishedOn: "Публикувано на",
    updatedOn: "Обновено на",
    readingTime: "мин. четене",
    sources: "Източници",
    relatedArticles: "Свързани статии",
    share: "Сподели",
    copyLink: "Копирай линк",
    copied: "Копирано",
    backToTop: "Към началото на статията",
    contents: "В статията",
    previousImage: "Предишна снимка",
    nextImage: "Следваща снимка",
    close: "Затвори",
    directions: "Упътване",
    viewBusiness: "Виж бизнеса",
    free: "Безплатен",
    premium: "Премиум",
    spotlight: "На фокус",
    filters: "Филтри",
    allCategories: "Всички категории",
    noResults: "Няма намерени резултати.",
    businessesTitle: "Местни бизнеси в Банско",
    businessesIntro: "Открий места, услуги и хора от местната общност.",
    submitBusiness: "Добави бизнес",
    map: "Карта",
    support: "Подкрепи ни",
    facebookCtaEyebrow: "Общност",
    facebookCtaTitle: "Присъедини се към общността",
    facebookCtaText: "Имаш събитие, снимка, препоръка или въпрос за Банско? Сподели го в Bansko NOW | Живот в Банско.",
    facebookCtaButton: "Към Facebook групата",
    artStudioEyebrow: "Art Studio към Bansko NOW",
    artStudioTitle: "Визуални услуги с характер",
    artStudioText: "Фотография, арт печат, платна и визуални решения, вдъхновени от Банско и Пирин.",
    artStudioButton: "Виж Art Studio",
    collectionEyebrow: "Вдъхновено от Банско",
    collectionTitle: "Bansko Collection",
    collectionText: "Авторски продукти за хората, които искат да отнесат част от Банско със себе си.",
    collectionButton: "Разгледай колекцията",
    weatherTitle: "Времето в Банско",
    today: "Днес",
    tomorrow: "Утре",
    feelsLike: "Усеща се като",
    wind: "Вятър",
    precipitation: "Валежи",
    min: "Мин",
    max: "Макс",
    heroTitle: "Животът в Банско отблизо",
    heroText: "Събития, култура, природа, хора и истории от Банско и Пирин.",
    heroToday: "Какво се случва днес",
    heroLatest: "Виж последните статии",
    discoverBansko: "Открий Банско",
    placesRoutesSeasons: "Места, маршрути и сезони",
    todayInBansko: "Днес в Банско",
    newsletterTitle: "Получавай най-интересното от Банско всяка седмица.",
    email: "Имейл",
    soon: "Скоро",
    languageUnavailable: "Тази страница все още няма английска версия."
  },
  en: {
    localeName: "English",
    otherLocaleName: "Български",
    home: "Home",
    menu: "Menu",
    navigation: "Main navigation",
    mobileNavigation: "Mobile navigation",
    search: "Search",
    allArticles: "All articles",
    articlesMenu: "Articles",
    categoriesLabel: "Categories",
    articlesCountLabel: "articles",
    adminPanel: "Admin panel",
    project: "Project",
    links: "Links",
    about: "About",
    contact: "Contact",
    localBusinesses: "Local businesses",
    privacy: "Privacy Policy",
    terms: "Terms",
    latestArticles: "Latest articles",
    featured: "Featured",
    readMore: "Read more",
    publishedOn: "Published on",
    updatedOn: "Updated on",
    readingTime: "min read",
    sources: "Sources",
    relatedArticles: "Related articles",
    share: "Share",
    copyLink: "Copy link",
    copied: "Copied",
    backToTop: "Back to the top of the article",
    contents: "In this article",
    previousImage: "Previous image",
    nextImage: "Next image",
    close: "Close",
    directions: "Directions",
    viewBusiness: "View business",
    free: "Free",
    premium: "Premium",
    spotlight: "Spotlight",
    filters: "Filters",
    allCategories: "All categories",
    noResults: "No results found.",
    businessesTitle: "Local businesses in Bansko",
    businessesIntro: "Discover places, services and people from the local community.",
    submitBusiness: "List your business",
    map: "Map",
    support: "Support us",
    facebookCtaEyebrow: "Community",
    facebookCtaTitle: "Join the community",
    facebookCtaText: "Have an event, photo, recommendation or question about Bansko? Share it with the Bansko NOW community.",
    facebookCtaButton: "Open the Facebook group",
    artStudioEyebrow: "Bansko NOW Art Studio",
    artStudioTitle: "Visual services with character",
    artStudioText: "Photography, fine art printing, canvas and visual solutions inspired by Bansko and Pirin.",
    artStudioButton: "View Art Studio",
    collectionEyebrow: "Inspired by Bansko",
    collectionTitle: "Bansko Collection",
    collectionText: "Original products for people who want to take a part of Bansko with them.",
    collectionButton: "Explore the collection",
    weatherTitle: "Weather in Bansko",
    today: "Today",
    tomorrow: "Tomorrow",
    feelsLike: "Feels like",
    wind: "Wind",
    precipitation: "Precipitation",
    min: "Min",
    max: "Max",
    heroTitle: "Life in Bansko, up close",
    heroText: "Events, culture, nature, people and stories from Bansko and Pirin.",
    heroToday: "What is happening today",
    heroLatest: "View the latest articles",
    discoverBansko: "Explore Bansko",
    placesRoutesSeasons: "Places, routes and seasons",
    todayInBansko: "Today in Bansko",
    newsletterTitle: "Get the best of Bansko every week.",
    email: "Email",
    soon: "Coming soon",
    languageUnavailable: "This page is not available in English yet."
  }
} as const;

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}

export function getOpenGraphLocale(locale: Locale) {
  return locale === "en" ? "en_GB" : "bg_BG";
}

export function getSocialLabel(platform: string, label: string, locale: Locale) {
  if (locale !== "en") {
    return label;
  }

  const normalizedPlatform = platform.toLowerCase();

  if (normalizedPlatform === "facebook") {
    return "Facebook group";
  }

  if (normalizedPlatform === "youtube") {
    return "YouTube";
  }

  if (normalizedPlatform === "tiktok") {
    return "TikTok";
  }

  return label;
}
