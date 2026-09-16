import "server-only";
import QRCode from "qrcode";

/**
 * QR кодът се рисува на сървъра като SVG: векторен, значи еднакво остър на
 * стикер за маса и на лист А4, и не тежи на телефона на госта.
 */
export async function createQrSvg(url: string, size = 320) {
  return QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    width: size,
    color: { dark: "#101010", light: "#ffffff" }
  });
}

/** Адресът в QR кода носи ?src=qr, за да се различава по-късно в статистиката. */
export function qrMenuUrl(siteUrl: string, slug: string, locale: "bg" | "en" = "bg") {
  const path = locale === "en" ? `/en/places/${slug}/menu` : `/places/${slug}/menu`;
  return `${siteUrl}${path}?src=qr`;
}
