import QRCode from "qrcode";
import { iconSvgMarkup } from "@/components/public/icon-glyph";

/**
 * QR кодът на Bansko NOW: тъмнозелен, с кръгли точки, заоблени „очи“ и листо в
 * средата, вместо черния квадратен код по подразбиране. Корекцията на грешки е
 * H (30 %), затова листото в средата не пречи на четенето. Чист SVG, без
 * клиентски код; порталът го обръща в PNG със sharp, печатът го влага направо.
 */

export type QrStyle = {
  /** Цвят на точките; по подразбиране горското зелено на сайта. */
  dark?: string;
  /** Фон под кода (null = прозрачен). */
  light?: string | null;
  /** Иконка в средата (Font Awesome име, регистрирано в icon-glyph.tsx); листо по подразбиране. */
  logo?: boolean;
  icon?: string;
  /** Тихо поле в модули. */
  margin?: number;
};

const defaults = { dark: "#183b2a", light: "#ffffff", logo: true, margin: 2 };

function isFinder(row: number, col: number, size: number) {
  const inTopLeft = row < 7 && col < 7;
  const inTopRight = row < 7 && col >= size - 7;
  const inBottomLeft = row >= size - 7 && col < 7;
  return inTopLeft || inTopRight || inBottomLeft;
}

function finderEye(x: number, y: number, dark: string, light: string | null) {
  const inner = light ?? "#ffffff";
  return (
    `<rect x="${x + 0.5}" y="${y + 0.5}" width="6" height="6" rx="1.9" fill="none" stroke="${dark}" stroke-width="1"/>` +
    `<rect x="${x + 1}" y="${y + 1}" width="5" height="5" rx="1.4" fill="${inner}"/>` +
    `<rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx="0.9" fill="${dark}"/>`
  );
}

export function qrSvg(text: string, style: QrStyle = {}) {
  const { dark, light, logo, margin } = { ...defaults, ...style };
  /* Непозната иконка не чупи кода: пада на листото. */
  const iconMarkup = (style.icon && iconSvgMarkup(style.icon)) || iconSvgMarkup("leaf");
  const code = QRCode.create(text, { errorCorrectionLevel: logo ? "H" : "M" });
  const size = code.modules.size;
  const total = size + margin * 2;
  /* Листото покрива около 4 % от площта: далеч под 30 %, които H прощава. */
  const logoRadius = logo ? Math.max(3.4, size * 0.115) : 0;
  const center = total / 2;

  const parts: string[] = [];
  if (light) parts.push(`<rect width="${total}" height="${total}" fill="${light}"/>`);

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!code.modules.get(row, col) || isFinder(row, col, size)) continue;
      const x = col + margin;
      const y = row + margin;
      if (logo && Math.hypot(x + 0.5 - center, y + 0.5 - center) < logoRadius + 0.6) continue;
      /* r = 0.5: точките се допират. С по-малки точки (0.44-0.48) строгият декодер jsQR вече не чете кода. */
      parts.push(`<circle cx="${x + 0.5}" cy="${y + 0.5}" r="0.5" fill="${dark}"/>`);
    }
  }

  parts.push(finderEye(margin, margin, dark, light));
  parts.push(finderEye(margin + size - 7, margin, dark, light));
  parts.push(finderEye(margin, margin + size - 7, dark, light));

  if (logo) {
    const leaf = iconMarkup.replace("<svg ", `<svg x="${center - logoRadius * 0.55}" y="${center - logoRadius * 0.55}" width="${logoRadius * 1.1}" height="${logoRadius * 1.1}" color="${dark}" `);
    parts.push(`<circle cx="${center}" cy="${center}" r="${logoRadius}" fill="${light ?? "#ffffff"}"/>`);
    parts.push(`<circle cx="${center}" cy="${center}" r="${logoRadius - 0.35}" fill="none" stroke="${dark}" stroke-width="0.35"/>`);
    parts.push(leaf);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="geometricPrecision" role="img" aria-label="QR код">${parts.join("")}</svg>`;
}

/** PNG (data URL) от същия SVG - за сваляне от портала. */
export async function qrPngDataUrl(text: string, pixels = 1024, style: QrStyle = {}) {
  const { default: sharp } = await import("sharp");
  const svg = qrSvg(text, { light: "#ffffff", ...style });
  const png = await sharp(Buffer.from(svg), { density: 600 }).resize(pixels, pixels, { fit: "contain", background: "#ffffff" }).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}
