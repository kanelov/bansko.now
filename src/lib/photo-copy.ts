import type { Json, Locale } from "@/lib/types";

/**
 * Texts of the photo archive: the /photos landing, the photo pages, the license form and the
 * Stripe line item. The defaults live here; the admin page "Фотоархив → Текстове и лицензи"
 * stores overrides in photo_public_settings.page_copy as { bg: {...}, en: {...} }.
 * An empty field means "use the default".
 */
export type PhotoArchiveCopy = {
  eyebrow: string;
  title: string;
  lead: string;
  metaDescription: string;
  categoriesLabel: string;
  photographerName: string;
  creditLine: string;
  copyrightNote: string;
  photographLabel: string;
  licenseHeading: string;
  licenseButton: string;
  printButton: string;
  relatedHeading: string;
  licensePageTitle: string;
  chooseLicense: string;
  readTerms: string;
  acceptTerms: string;
  continueButton: string;
  paymentNote: string;
  checkoutDescription: string;
};

export const photoTextKeys = [
  "eyebrow",
  "title",
  "lead",
  "metaDescription",
  "categoriesLabel",
  "photographerName",
  "creditLine",
  "copyrightNote",
  "photographLabel",
  "licenseHeading",
  "licenseButton",
  "printButton",
  "relatedHeading",
  "licensePageTitle",
  "chooseLicense",
  "readTerms",
  "acceptTerms",
  "continueButton",
  "paymentNote",
  "checkoutDescription"
] as const;
export type PhotoTextKey = (typeof photoTextKeys)[number];

/** Admin labels, in the order of the form. */
export const photoTextLabels: Record<PhotoTextKey, string> = {
  eyebrow: "Име на архива (надпис над заглавието и в пътеката)",
  title: "Заглавие на архива (H1)",
  lead: "Водещ текст под заглавието",
  metaDescription: "SEO описание на архива (за Google)",
  categoriesLabel: "Надпис на списъка с категории",
  photographerName: "Име на фотографа",
  creditLine: "Авторски надпис (за Google и под снимките в статиите)",
  copyrightNote: "Бележка за авторското право под бутоните",
  photographLabel: "Надпис преди кода на снимката",
  licenseHeading: "Заглавие на кутията за лицензиране",
  licenseButton: "Бутон за лицензиране",
  printButton: "Бутон за принт",
  relatedHeading: "Заглавие „Подобни фотографии“",
  licensePageTitle: "Заглавие на страницата за лиценз",
  chooseLicense: "Надпис „Избери лиценз“",
  readTerms: "Надпис „Прочети условията“",
  acceptTerms: "Текст на отметката за съгласие",
  continueButton: "Бутон към плащането",
  paymentNote: "Бележка под бутона за плащане",
  checkoutDescription: "Описание на реда в Stripe при плащане"
};
export const longPhotoTextKeys: PhotoTextKey[] = ["lead", "metaDescription", "copyrightNote", "acceptTerms", "paymentNote"];

const defaultPhotographer: Record<Locale, string> = { bg: "Любо Канелов", en: "Lubo Kanelov" };

/** Texts that quote the photographer, so a new name in the admin flows into them automatically. */
function nameBasedDefaults(name: string, locale: Locale): Pick<PhotoArchiveCopy, "creditLine" | "copyrightNote" | "checkoutDescription"> {
  return locale === "en"
    ? {
        creditLine: `© ${name} / bansko.now`,
        copyrightNote: `© ${name}. The copyright stays with the photographer.`,
        checkoutDescription: `Photograph by ${name}`
      }
    : {
        creditLine: `© ${name} / bansko.now`,
        copyrightNote: `© ${name}. Авторското право остава у автора.`,
        checkoutDescription: `Фотография от ${name}`
      };
}

export const photoCopyDefaults: Record<Locale, PhotoArchiveCopy> = {
  bg: {
    eyebrow: "Фотоархив",
    title: "Фотоархив Банско и Пирин",
    lead: "Авторски фотографии от Банско, Пирин и региона. Всяка фотография може да се лицензира за уеб или печат, или да се поръча като принт от Art Studio.",
    metaDescription:
      "Фотоархив на Банско и Пирин: авторски снимки от планината, града, ските, природата и събитията. Лицензиране за уеб и печат, принтове по поръчка.",
    categoriesLabel: "Категории",
    photographerName: defaultPhotographer.bg,
    ...nameBasedDefaults(defaultPhotographer.bg, "bg"),
    photographLabel: "Фотография",
    licenseHeading: "Лицензирай тази фотография",
    licenseButton: "Лицензирай",
    printButton: "Поръчай като принт",
    relatedHeading: "Подобни фотографии",
    licensePageTitle: "Лицензирай тази фотография",
    chooseLicense: "Избери лиценз",
    readTerms: "Прочети условията на лиценза",
    acceptTerms: "Приемам условията на лиценза и се съгласявам да получа файла веднага, с което се отказвам от правото на отказ.",
    continueButton: "Продължи към плащане",
    paymentNote: "Плащането минава през Stripe. Линкът за сваляне идва по имейл."
  },
  en: {
    eyebrow: "Photo Library",
    title: "Bansko and Pirin Photo Library",
    lead: "Original photographs of Bansko, Pirin and the region. Every photograph can be licensed for web or print, or ordered as a print from Art Studio.",
    metaDescription:
      "Photo library of Bansko and Pirin: original images of the mountain, the town, skiing, nature and events. Web and print licensing, made to order prints.",
    categoriesLabel: "Categories",
    photographerName: defaultPhotographer.en,
    ...nameBasedDefaults(defaultPhotographer.en, "en"),
    photographLabel: "Photograph",
    licenseHeading: "License this photograph",
    licenseButton: "License this photograph",
    printButton: "Order as a print",
    relatedHeading: "Related photographs",
    licensePageTitle: "License this photograph",
    chooseLicense: "Choose a license",
    readTerms: "Read the license terms",
    acceptTerms: "I accept the license terms and agree to receive the file immediately, waiving the right of withdrawal.",
    continueButton: "Continue to payment",
    paymentNote: "Payment is processed by Stripe. The download link arrives by email."
  }
};

type PhotoCopyOverrides = Partial<Record<Locale, Record<string, unknown>>>;

function readOverrides(pageCopy: Json | null | undefined): PhotoCopyOverrides {
  return pageCopy && typeof pageCopy === "object" && !Array.isArray(pageCopy) ? (pageCopy as PhotoCopyOverrides) : {};
}

function overrideText(value: unknown, maxLength = 1000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

/** Archive texts for one locale: admin overrides from photo_public_settings.page_copy over the defaults. */
export function resolvePhotoArchiveCopy(pageCopy: Json | null | undefined, locale: Locale): PhotoArchiveCopy {
  const raw = readOverrides(pageCopy)[locale] ?? {};
  const result: PhotoArchiveCopy = { ...photoCopyDefaults[locale] };
  const photographerName = overrideText(raw.photographerName, 120);
  if (photographerName) {
    result.photographerName = photographerName;
    Object.assign(result, nameBasedDefaults(photographerName, locale));
  }
  for (const key of photoTextKeys) {
    if (key === "photographerName") continue;
    const value = overrideText(raw[key]);
    if (value) result[key] = value;
  }
  return result;
}
