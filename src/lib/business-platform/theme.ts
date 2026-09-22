import type { CSSProperties } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BusinessMediaUrls } from "@/lib/business-platform/media";
import type { Database, Json } from "@/lib/types";

/**
 * Темата на бизнеса: цветове, шрифтове, лого и орнамент за собствените му
 * изгледи - QR менюто, телевизора и печата. Профилът в Bansko NOW не я ползва.
 *
 * Пази се в business_platform_settings.branding (jsonb) и се чете само през
 * resolveTheme(): каквото не е от списъка тук, се заменя с подразбиране, така
 * че в inline стиловете и в SVG никога не влиза произволен текст. Модулът е
 * чист (без "server-only", без React код), за да го ползват и клиентските
 * компоненти на портала за преглед на живо.
 */

export type ThemePresetId = "paper" | "forest" | "ink" | "sand" | "olive" | "rose";
export type HeadingFont = "georgia" | "playfair" | "lora" | "inter" | "montserrat";
export type BodyFont = "inter" | "montserrat" | "lora";
export type ThemeOrnament = "leaf" | "logo" | "none";

export type BusinessTheme = {
  preset: ThemePresetId;
  /** Hex #rrggbb вместо акцента на пресета; null = пресетът. */
  accent: string | null;
  /** Hex вместо фона (само за светлия вариант). */
  background: string | null;
  /** Hex вместо цвета на текста (само за светлия вариант). */
  ink: string | null;
  heading_font: HeadingFont;
  body_font: BodyFont;
  /** Зърното на хартията. */
  grain: boolean;
  ornament: ThemeOrnament;
  /** business_media.id от вида 'logo'. */
  logo_media_id: string | null;
  /** Иконката в средата на QR кода (Font Awesome име от qrIconGroups). */
  qr_icon: string;
};

export type ThemeTokens = {
  bg: string;
  ink: string;
  muted: string;
  accent: string;
  line: string;
  hair: string;
  badge: string;
  /** Фонът на залепената лента в QR менюто: близо до фона, никога крещящ. */
  bar: string;
  /** Текст върху акцента (активният език, бутонът „Обади се“): бяло, ако се чете; иначе фонът или текстът на темата. */
  onAccent: string;
};

/** Цветовете на пресета; onAccent се извежда при resolvedTokens(). */
export type PresetTokens = Omit<ThemeTokens, "onAccent">;

export type ThemePreset = {
  id: ThemePresetId;
  label: string;
  description: string;
  light: PresetTokens;
  dark: PresetTokens;
  heading_font: HeadingFont;
  body_font: BodyFont;
  grain: boolean;
  /** Тъмен по природа: и „светлият“ му вариант е тъмен (ink). */
  darkByNature?: boolean;
};

/* Контрастите са проверени: текст/фон ≥ 11:1, акцент/фон ≥ 4.2:1, приглушен ≥ 4.8:1 (светли варианти). */
export const themePresets: Record<ThemePresetId, ThemePreset> = {
  paper: {
    id: "paper",
    label: "Хартия",
    description: "Кремава хартия и кафяви линии - днешният вид на менюто.",
    light: { bg: "#f4eee2", ink: "#2a2319", muted: "#6f6355", accent: "#8b6b4b", line: "rgba(90, 70, 50, 0.34)", hair: "rgba(90, 70, 50, 0.14)", badge: "#b2543a", bar: "#f8f3ea" },
    dark: { bg: "#221b15", ink: "#f1e9dc", muted: "#b9ab99", accent: "#c9a57f", line: "rgba(235, 215, 185, 0.34)", hair: "rgba(235, 215, 185, 0.14)", badge: "#b2543a", bar: "#2a221b" },
    heading_font: "georgia",
    body_font: "inter",
    grain: true
  },
  forest: {
    id: "forest",
    label: "Гора",
    description: "Кремава хартия с горско зелено, като сайта на Bansko NOW.",
    light: { bg: "#f4efe4", ink: "#1d2a22", muted: "#5b6860", accent: "#183b2a", line: "rgba(24, 59, 42, 0.32)", hair: "rgba(24, 59, 42, 0.13)", badge: "#b2543a", bar: "#f8f4eb" },
    dark: { bg: "#14231b", ink: "#eef1e8", muted: "#a9b5ac", accent: "#9fc4ad", line: "rgba(220, 235, 225, 0.32)", hair: "rgba(220, 235, 225, 0.13)", badge: "#c96a4f", bar: "#1a2c22" },
    heading_font: "georgia",
    body_font: "inter",
    grain: true
  },
  ink: {
    id: "ink",
    label: "Мастило",
    description: "Тъмен графит, кремав текст и топъл кехлибарен акцент.",
    light: { bg: "#1c1c1e", ink: "#f2ebdd", muted: "#b4ab9c", accent: "#d8a86a", line: "rgba(242, 235, 221, 0.3)", hair: "rgba(242, 235, 221, 0.12)", badge: "#b5573c", bar: "#242426" },
    dark: { bg: "#1c1c1e", ink: "#f2ebdd", muted: "#b4ab9c", accent: "#d8a86a", line: "rgba(242, 235, 221, 0.3)", hair: "rgba(242, 235, 221, 0.12)", badge: "#b5573c", bar: "#242426" },
    heading_font: "playfair",
    body_font: "inter",
    grain: false,
    darkByNature: true
  },
  sand: {
    id: "sand",
    label: "Пясък",
    description: "Топъл пясък и теракота - за слънчеви тераси и пекарни.",
    light: { bg: "#f3e6d3", ink: "#3a2a1e", muted: "#75604e", accent: "#a9542f", line: "rgba(120, 80, 55, 0.34)", hair: "rgba(120, 80, 55, 0.14)", badge: "#9c3f2e", bar: "#f7ecdc" },
    dark: { bg: "#2b1f17", ink: "#f5e9d8", muted: "#c0ad98", accent: "#e0885f", line: "rgba(240, 215, 185, 0.32)", hair: "rgba(240, 215, 185, 0.13)", badge: "#d1623f", bar: "#33261d" },
    heading_font: "lora",
    body_font: "montserrat",
    grain: true
  },
  olive: {
    id: "olive",
    label: "Маслина",
    description: "Маслинено и сиво-зелено, меко и спокойно.",
    light: { bg: "#f1f0e6", ink: "#262b22", muted: "#5f665a", accent: "#5a6a40", line: "rgba(70, 85, 55, 0.34)", hair: "rgba(70, 85, 55, 0.13)", badge: "#a8553c", bar: "#f5f4ec" },
    dark: { bg: "#1f231b", ink: "#edeee3", muted: "#aeb4a2", accent: "#b7c48f", line: "rgba(225, 230, 210, 0.32)", hair: "rgba(225, 230, 210, 0.13)", badge: "#c96a4f", bar: "#262b21" },
    heading_font: "lora",
    body_font: "inter",
    grain: false
  },
  rose: {
    id: "rose",
    label: "Роза",
    description: "Прашна роза и слива - за сладкарници и винени барове.",
    light: { bg: "#f6eeee", ink: "#33232a", muted: "#6f5c64", accent: "#8a4457", line: "rgba(110, 60, 80, 0.32)", hair: "rgba(110, 60, 80, 0.13)", badge: "#b0483f", bar: "#f9f3f3" },
    dark: { bg: "#2a1c22", ink: "#f4e9ec", muted: "#c1adb4", accent: "#d99aa8", line: "rgba(240, 215, 225, 0.32)", hair: "rgba(240, 215, 225, 0.13)", badge: "#cf5f52", bar: "#32232a" },
    heading_font: "playfair",
    body_font: "montserrat",
    grain: false
  }
};

export const themePresetList: ThemePreset[] = Object.values(themePresets);

export const headingFonts: { value: HeadingFont; label: string }[] = [
  { value: "georgia", label: "Georgia (сериф, като сайта)" },
  { value: "playfair", label: "Playfair Display (елегантен сериф)" },
  { value: "lora", label: "Lora (мек сериф)" },
  { value: "inter", label: "Inter (чист гротеск)" },
  { value: "montserrat", label: "Montserrat (геометричен гротеск)" }
];

export const bodyFonts: { value: BodyFont; label: string }[] = [
  { value: "inter", label: "Inter" },
  { value: "montserrat", label: "Montserrat" },
  { value: "lora", label: "Lora" }
];

export const themeOrnaments: { value: ThemeOrnament; label: string }[] = [
  { value: "leaf", label: "Листо" },
  { value: "logo", label: "Логото на бизнеса" },
  { value: "none", label: "Без орнамент" }
];

/* Иконката в средата на QR кода: по типа на бизнеса. Групите са за списъка в портала. */
export const qrIconGroups: { label: string; icons: { value: string; label: string }[] }[] = [
  { label: "Общи", icons: [{ value: "leaf", label: "Листо (по подразбиране)" }, { value: "star", label: "Звезда" }, { value: "heart", label: "Сърце" }, { value: "store", label: "Магазин" }] },
  { label: "Храна и напитки", icons: [{ value: "mug-saucer", label: "Кафе" }, { value: "utensils", label: "Ресторант" }, { value: "kitchen-set", label: "Кухня / готвене" }, { value: "pizza-slice", label: "Пица" }, { value: "burger", label: "Бургери" }, { value: "bread-slice", label: "Пекарна" }, { value: "cake-candles", label: "Сладкарница" }, { value: "ice-cream", label: "Сладолед" }, { value: "beer-mug-empty", label: "Бар / бира" }, { value: "wine-glass", label: "Вино" }, { value: "martini-glass-citrus", label: "Коктейл бар" }, { value: "champagne-glasses", label: "Клуб / събития" }, { value: "fire", label: "Скара / камина" }] },
  { label: "Зима и планина", icons: [{ value: "person-skiing", label: "Ски" }, { value: "person-snowboarding", label: "Сноуборд" }, { value: "person-skiing-nordic", label: "Ски бягане" }, { value: "cable-car", label: "Лифт / кабинка" }, { value: "sleigh", label: "Шейни" }, { value: "snowflake", label: "Зима" }, { value: "mountain-sun", label: "Планина" }, { value: "mountain", label: "Връх" }, { value: "person-hiking", label: "Преходи" }, { value: "tree", label: "Гора / природа" }] },
  { label: "Спорт и уелнес", icons: [{ value: "person-biking", label: "Колоездене" }, { value: "bicycle", label: "Велосипеди под наем" }, { value: "horse", label: "Езда" }, { value: "person-swimming", label: "Басейн" }, { value: "hot-tub-person", label: "Спа / джакузи" }, { value: "spa", label: "Масаж / уелнес" }, { value: "dumbbell", label: "Фитнес" }, { value: "umbrella-beach", label: "Почивка" }] },
  { label: "Настаняване", icons: [{ value: "hotel", label: "Хотел" }, { value: "bed", label: "Стаи / нощувки" }, { value: "house", label: "Къща за гости" }, { value: "key", label: "Имоти / наеми" }] },
  { label: "Красота и здраве", icons: [{ value: "scissors", label: "Фризьорски салон" }, { value: "hand-sparkles", label: "Маникюр / козметика" }, { value: "tooth", label: "Зъболекар" }, { value: "user-doctor", label: "Лекар" }, { value: "pills", label: "Аптека" }, { value: "paw", label: "Ветеринар / зоомагазин" }] },
  { label: "Магазини", icons: [{ value: "bag-shopping", label: "Бутик" }, { value: "shirt", label: "Дрехи" }, { value: "gem", label: "Бижута" }, { value: "gift", label: "Подаръци / сувенири" }, { value: "seedling", label: "Био / зеленчуци" }, { value: "book-open", label: "Книжарница" }] },
  { label: "Култура и забавления", icons: [{ value: "palette", label: "Арт / галерия" }, { value: "camera", label: "Фотограф" }, { value: "masks-theater", label: "Театър / култура" }, { value: "music", label: "Музика" }, { value: "gamepad", label: "Игри / забавления" }, { value: "child", label: "За деца" }, { value: "ticket", label: "Билети / атракции" }, { value: "graduation-cap", label: "Обучение" }] },
  { label: "Транспорт и услуги", icons: [{ value: "car", label: "Рент-а-кар" }, { value: "taxi", label: "Такси" }, { value: "van-shuttle", label: "Трансфер" }, { value: "bus", label: "Автобус / екскурзии" }, { value: "motorcycle", label: "Мото / ATV" }, { value: "suitcase-rolling", label: "Туристическа агенция" }, { value: "wrench", label: "Сервиз" }, { value: "truck-fast", label: "Доставки" }, { value: "spray-can-sparkles", label: "Почистване" }] }
];
const qrIconIds = qrIconGroups.flatMap((group) => group.icons.map((icon) => icon.value));

const presetIds = Object.keys(themePresets) as ThemePresetId[];
const headingFontIds: HeadingFont[] = ["georgia", "playfair", "lora", "inter", "montserrat"];
const bodyFontIds: BodyFont[] = ["inter", "montserrat", "lora"];
const ornamentIds: ThemeOrnament[] = ["leaf", "logo", "none"];
const hexPattern = /^#[0-9a-f]{6}$/i;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* Зърното на хартията (SVG шум), същото като досега в menu-paper.css. */
export const paperGrain =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.36 0 0 0 0 0.27 0 0 0 0 0.18 0 0 0 0.09 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")";

export const defaultTheme: BusinessTheme = {
  preset: "paper",
  accent: null,
  background: null,
  ink: null,
  heading_font: "georgia",
  body_font: "inter",
  grain: true,
  ornament: "leaf",
  logo_media_id: null,
  qr_icon: "leaf"
};

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function hexOrNull(value: unknown): string | null {
  return typeof value === "string" && hexPattern.test(value) ? value.toLowerCase() : null;
}

/**
 * Прави валидна тема от каквото има в базата. Невалидно или липсващо поле
 * взима подразбирането на избрания пресет (шрифтове, зърно), а невалиден
 * пресет - „Хартия“. Цветовете минават само като #rrggbb.
 */
export function resolveTheme(raw: unknown): BusinessTheme {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const preset = themePresets[oneOf(source.preset, presetIds, defaultTheme.preset)];

  return {
    preset: preset.id,
    accent: hexOrNull(source.accent),
    background: hexOrNull(source.background),
    ink: hexOrNull(source.ink),
    heading_font: oneOf(source.heading_font, headingFontIds, preset.heading_font),
    body_font: oneOf(source.body_font, bodyFontIds, preset.body_font),
    grain: typeof source.grain === "boolean" ? source.grain : preset.grain,
    ornament: oneOf(source.ornament, ornamentIds, defaultTheme.ornament),
    logo_media_id: typeof source.logo_media_id === "string" && uuidPattern.test(source.logo_media_id) ? source.logo_media_id.toLowerCase() : null,
    qr_icon: oneOf(source.qr_icon, qrIconIds, defaultTheme.qr_icon)
  };
}

/** Каквото се записва в jsonb колоната. Винаги пълен обект, без непознати ключове. */
export function serializeTheme(theme: BusinessTheme): Record<string, unknown> {
  const clean = resolveTheme(theme);
  return {
    preset: clean.preset,
    accent: clean.accent,
    background: clean.background,
    ink: clean.ink,
    heading_font: clean.heading_font,
    body_font: clean.body_font,
    grain: clean.grain,
    ornament: clean.ornament,
    logo_media_id: clean.logo_media_id,
    qr_icon: clean.qr_icon
  };
}

/* ------------------------------------------------------------ шрифтове */

const fontStacks: Record<HeadingFont | BodyFont, string> = {
  georgia: 'Georgia, "Playfair Display Variable", "Playfair Display", "Times New Roman", serif',
  playfair: '"Playfair Display Variable", "Playfair Display", Georgia, "Times New Roman", serif',
  lora: '"Lora Variable", Lora, Georgia, "Times New Roman", serif',
  inter: '"Inter Variable", Inter, "Segoe UI", system-ui, sans-serif',
  montserrat: '"Montserrat Variable", Montserrat, "Segoe UI", system-ui, sans-serif'
};

/** CSS font-family за шрифта. На телевизора няма Georgia, затова там тя става вграденият Playfair. */
export function fontStack(font: HeadingFont | BodyFont, opts?: { tv?: boolean }): string {
  if (font === "georgia" && opts?.tv) {
    return fontStacks.playfair;
  }
  return fontStacks[font];
}

/* -------------------------------------------------------------- цветове */

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)];
}

function rgbToHex([r, g, b]: [number, number, number]) {
  return `#${[r, g, b].map((channel) => Math.round(Math.max(0, Math.min(255, channel))).toString(16).padStart(2, "0")).join("")}`;
}

/** Смес от два цвята: weight = дял на първия (0..1). Chromium 85 няма color-mix(), затова е тук. */
function mix(hexA: string, hexB: string, weight: number) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return rgbToHex([a[0] * weight + b[0] * (1 - weight), a[1] * weight + b[1] * (1 - weight), a[2] * weight + b[2] * (1 - weight)]);
}

function rgba(hex: string, alpha: number) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function relativeLuminance(hex: string) {
  const channels = hexToRgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** Контраст по WCAG между два hex цвята (1..21). */
export function contrastRatio(hexA: string, hexB: string) {
  const a = relativeLuminance(hexA);
  const b = relativeLuminance(hexB);
  const [light, dark] = a > b ? [a, b] : [b, a];
  return (light + 0.05) / (dark + 0.05);
}

function isDark(theme: BusinessTheme, opts?: { dark?: boolean }) {
  return Boolean(opts?.dark) || Boolean(themePresets[theme.preset].darkByNature);
}

/** Минималният контраст за обикновен текст по WCAG AA. */
export const minTextContrast = 4.5;
/** Минималният контраст за акцента спрямо фона (линии, иконки, езиковата лента). */
export const minAccentContrast = 3;

/**
 * Цветът на текста върху акцента. Бяло, ако се чете (акцентът на „Мастило“ е
 * светъл кехлибар и бялото не става); иначе онзи от фона и текста на темата,
 * който контрастира повече - при тъмните варианти това е тъмният фон.
 */
function onAccentFor(tokens: PresetTokens): string {
  if (contrastRatio(tokens.accent, "#ffffff") >= minTextContrast) {
    return "#ffffff";
  }
  return contrastRatio(tokens.accent, tokens.ink) >= contrastRatio(tokens.accent, tokens.bg) ? tokens.ink : tokens.bg;
}

/**
 * Готовите цветове на темата. Ръчните цветове важат само за светлия вариант;
 * когато фонът или текстът е сменен, приглушеният цвят и линиите се извеждат
 * от тях, за да остане цялото четимо и в един тон.
 */
export function resolvedTokens(theme: BusinessTheme, opts?: { dark?: boolean }): ThemeTokens {
  const preset = themePresets[theme.preset];

  if (isDark(theme, opts)) {
    return { ...preset.dark, onAccent: onAccentFor(preset.dark) };
  }

  const base = preset.light;
  const bg = theme.background ?? base.bg;
  const ink = theme.ink ?? base.ink;
  const accent = theme.accent ?? base.accent;
  const derived = theme.background !== null || theme.ink !== null;

  const tokens: PresetTokens = {
    bg,
    ink,
    accent,
    badge: base.badge,
    muted: derived ? mix(ink, bg, 0.68) : base.muted,
    line: derived ? rgba(ink, 0.34) : base.line,
    hair: derived ? rgba(ink, 0.14) : base.hair,
    bar: theme.background !== null ? mix(bg, relativeLuminance(bg) > 0.5 ? "#ffffff" : "#000000", 0.75) : base.bar
  };

  return { ...tokens, onAccent: onAccentFor(tokens) };
}

/**
 * Проверка дали ръчните цветове се четат: текст/фон ≥ 4.5:1 и акцент/фон ≥ 3:1
 * (светлият вариант - само той приема ръчни цветове). Връща null, когато всичко
 * е наред, иначе кое не става; записът в портала отказва такава тема.
 */
export function themeReadabilityIssue(theme: BusinessTheme): "contrast" | "accent" | null {
  const tokens = resolvedTokens(theme);
  if (contrastRatio(tokens.ink, tokens.bg) < minTextContrast) {
    return "contrast";
  }
  if (contrastRatio(tokens.accent, tokens.bg) < minAccentContrast) {
    return "accent";
  }
  return null;
}

/**
 * CSS променливите, които menu-paper.css чете. Слагат се като inline style на
 * елемента с клас .paper (inline побеждава класа, а телевизорът е Chromium 85:
 * само custom properties, нищо друго). tv: true сменя Georgia с Playfair.
 */
export function themeTokens(theme: BusinessTheme, opts?: { dark?: boolean; tv?: boolean }): Record<string, string> {
  const tokens = resolvedTokens(theme, opts);
  const heading = fontStack(theme.heading_font, { tv: opts?.tv });

  return {
    "--paper-bg": tokens.bg,
    "--paper-ink": tokens.ink,
    "--paper-muted": tokens.muted,
    "--paper-accent": tokens.accent,
    "--paper-line": tokens.line,
    "--paper-hair": tokens.hair,
    "--paper-badge": tokens.badge,
    "--paper-bar": tokens.bar,
    "--paper-on-accent": tokens.onAccent,
    "--paper-heading-font": heading,
    /* Голямото заглавие с разредени главни букви: при Georgia остава Playfair (днешният вид), иначе следва заглавния шрифт. */
    "--paper-title-font": theme.heading_font === "georgia" ? fontStacks.playfair : heading,
    "--paper-body-font": fontStack(theme.body_font, { tv: opts?.tv }),
    "--paper-grain": theme.grain ? paperGrain : "none"
  };
}

/** Класовете на корена: 'paper' или 'paper paper--dark' (тъмно по избор или по природа на пресета). */
export function themeClassName(theme: BusinessTheme, opts?: { dark?: boolean }): string {
  return isDark(theme, opts) ? "paper paper--dark" : "paper";
}

/** themeTokens() като React style обект. */
export function themeStyle(theme: BusinessTheme, opts?: { dark?: boolean; tv?: boolean }): CSSProperties {
  return themeTokens(theme, opts) as CSSProperties;
}

/**
 * Цветът на QR кода: достатъчно тъмен, за да се чете на бяло (контраст ≥ 4.5:1).
 * Акцентът, ако става; иначе текстът; иначе горското зелено на сайта.
 */
export function qrColorFor(theme: BusinessTheme): string {
  const tokens = resolvedTokens(theme);
  for (const candidate of [tokens.accent, tokens.ink]) {
    if (hexPattern.test(candidate) && contrastRatio(candidate, "#ffffff") >= 4.5) {
      return candidate;
    }
  }
  return "#183b2a";
}

/* ------------------------------------------------------------- четене */

type Client = SupabaseClient<Database>;

/** Публичните адреси на медия в R2 - копие на businessMediaUrls(), без да дърпа "server-only" модула тук. */
function publicMediaUrls(media: { original_key: string; variant_keys: Json }): BusinessMediaUrls {
  const base = (process.env.PHOTO_PUBLIC_BASE_URL || "").replace(/\/$/, "");
  const url = (key: string | null | undefined) => (key && base && !key.startsWith("photos/private/") ? `${base}/${key.replace(/^\//, "")}` : null);
  const variants = (media.variant_keys ?? {}) as Record<string, string>;
  return { original: url(media.original_key), w480: url(variants["480"]), w960: url(variants["960"]), w1600: url(variants["1600"]) };
}

/**
 * Темата и логото на бизнеса. Работи с публичния клиент (anon чете настройките
 * на активните бизнеси) и с клиента на портала (собственикът чете своите).
 * Липсва ли ред или логото не е от вида 'logo' на същия бизнес - подразбиране / null.
 */
export async function getBusinessTheme(
  supabase: Client,
  businessId: string
): Promise<{ theme: BusinessTheme; logo: BusinessMediaUrls | null; logoAlt: string | null }> {
  const { data: settings } = await supabase.from("business_platform_settings").select("business_id, branding").eq("business_id", businessId).maybeSingle();
  const theme = resolveTheme(settings?.branding);

  if (!theme.logo_media_id) {
    return { theme, logo: null, logoAlt: null };
  }

  const { data: media } = await supabase
    .from("business_media")
    .select("id, original_key, variant_keys, alt")
    .eq("business_id", businessId)
    .eq("id", theme.logo_media_id)
    .eq("kind", "logo")
    .eq("media_type", "image")
    .maybeSingle();

  if (!media) {
    return { theme: { ...theme, logo_media_id: null }, logo: null, logoAlt: null };
  }

  return { theme, logo: publicMediaUrls(media), logoAlt: media.alt };
}
