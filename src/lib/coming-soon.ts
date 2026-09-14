/**
 * Заключване на публичния сайт, докато съдържанието още е с пълнежи.
 *
 * Пази две неща едновременно: Google да не види нито една страница освен
 * поканата, и случаен посетител да не обикаля незавършен сайт. Затова не е
 * наслагване върху сайта — при заключване сървърът изобщо не изчертава
 * истинските страници.
 *
 * Пази се включено по подразбиране: забравена променлива държи сайта затворен,
 * вместо да го отвори. За отваряне се пише изрично COMING_SOON=off.
 */

export const previewCookieName = "bn_preview";

/** Колко дълго кодът помни един браузър: тридесет дни. */
export const previewCookieMaxAge = 60 * 60 * 24 * 30;

export function isComingSoonEnabled() {
  const value = String(process.env.COMING_SOON || "").trim().toLowerCase();
  return !["off", "0", "false", "no"].includes(value);
}

export function getPreviewCode() {
  return String(process.env.SITE_PREVIEW_CODE || "1984").trim();
}

/**
 * В браузъра не пътува самият код, а отпечатък от него. Смени ли се кодът,
 * старите отпечатъци спират да важат от само себе си.
 */
export async function previewToken(code = getPreviewCode()) {
  const data = new TextEncoder().encode(`bansko-now:${code}`);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
