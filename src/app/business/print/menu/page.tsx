import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/menu-paper.css";
import "@/styles/print-menu.css";
import { PrintButton } from "@/components/business/print-button";
import { PaperCategoryHead, PaperMenuHead } from "@/components/public/paper-menu";
import { portalUi } from "@/components/business/ui";
import { requireBusinessOwner } from "@/lib/business-platform/auth";
import { getPortalBusiness } from "@/lib/business-platform/business";
import { qrSvg } from "@/lib/business-platform/qr";
import { variantColumnsFor } from "@/lib/business-platform/display-layout";
import { businessMediaUrls } from "@/lib/business-platform/media";
import { getBusinessMenu, type MenuCategory, type MenuItem } from "@/lib/business-platform/menu";
import { formatPrice } from "@/lib/business-platform/money";
import { parsePrintOptions, printColumnCount, sheetDimensions, type PrintLanguage } from "@/lib/business-platform/print";
import { getBusinessTheme, qrColorFor, themeClassName, themeStyle } from "@/lib/business-platform/theme";
import { siteUrl } from "@/lib/env";

/**
 * Менюто за печат: същото меню от портала, подредено с HTML/CSS върху
 * фон-снимка. Файлът е PDF от тази страница („Запази като PDF“ в диалога за
 * печат). Страницата е извън рамката на портала, но зад същия пазач; цените се
 * четат в момента на отваряне, затова са винаги верни. „Свърши“ не се печата
 * като зачертано - хартиеното меню живее седмици, а изчерпаното е за деня.
 */

export const metadata: Metadata = {
  title: "Меню за печат"
};

type Search = Promise<Record<string, string | string[] | undefined>>;

function texts(language: PrintLanguage, names: { bg?: string | null; en?: string | null }) {
  const bg = (names.bg ?? "").trim();
  const en = (names.en ?? "").trim();

  if (language === "en") return { main: en || bg, alt: "" };
  if (language === "both") return { main: bg || en, alt: en && en !== bg ? en : "" };
  return { main: bg || en, alt: "" };
}

function description(language: PrintLanguage, item: MenuItem) {
  const bg = (item.descriptions.bg ?? "").trim();
  const en = (item.descriptions.en ?? "").trim();
  return language === "en" ? en || bg : bg || en;
}

function PrintItem({ item, language, descriptions }: { item: MenuItem; language: PrintLanguage; descriptions: boolean }) {
  const name = texts(language, item.names);
  const priceLocale = language === "en" ? "en" : "bg";
  const note = descriptions ? description(language, item) : "";

  return (
    <div className="paper-item">
      <span className="paper-item__text">
        <span className="paper-item__name">{name.main}</span>
        {name.alt ? <span className="print-item__alt">{name.alt}</span> : null}
        {note ? <span className="paper-item__desc">{note}</span> : null}
      </span>
      <span className="paper-item__dots" aria-hidden />
      <span className="paper-item__price">
        {item.variants.length > 0
          ? item.variants.map((variant, index) => (
              <span key={variant.id}>
                {index > 0 ? " · " : ""}
                {texts(language, variant.names).main ? <span className="paper-item__variant">{texts(language, variant.names).main}</span> : null}
                {formatPrice(variant.priceCents, priceLocale)}
              </span>
            ))
          : item.priceCents !== null
            ? formatPrice(item.priceCents, priceLocale)
            : ""}
      </span>
    </div>
  );
}

function PrintCategory({ category, language, descriptions }: { category: MenuCategory; language: PrintLanguage; descriptions: boolean }) {
  const name = texts(language, category.names);
  const columns = variantColumnsFor(category.items);
  const priceLocale = language === "en" ? "en" : "bg";
  const note = descriptions ? (language === "en" ? category.descriptions.en || category.descriptions.bg : category.descriptions.bg || category.descriptions.en) : null;

  return (
    <section className="print-category">
      <PaperCategoryHead icon={category.icon} name={name.main} alt={name.alt} />
      {note ? <p className="paper-category__note">{note}</p> : null}

      {columns ? (
        <table className="paper-table">
          <thead>
            <tr>
              <th> </th>
              {category.items[0].variants.map((variant) => (
                <th key={variant.id}>{texts(language, variant.names).main}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {category.items.map((item) => {
              const itemName = texts(language, item.names);
              const itemNote = descriptions ? description(language, item) : "";
              return (
                <tr key={item.id}>
                  <td>
                    <span className="paper-item__name">{itemName.main}</span>
                    {itemName.alt ? <span className="print-item__alt">{itemName.alt}</span> : null}
                    {itemNote ? <span className="paper-item__desc">{itemNote}</span> : null}
                  </td>
                  {item.variants.map((variant) => (
                    <td key={variant.id}>{formatPrice(variant.priceCents, priceLocale)}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        category.items.map((item) => <PrintItem key={item.id} item={item} language={language} descriptions={descriptions} />)
      )}
    </section>
  );
}

export default async function PrintMenuPage({ searchParams }: { searchParams: Search }) {
  const options = parsePrintOptions(await searchParams);
  const { supabase, business } = await requireBusinessOwner();

  const [portal, menu, translations, background, branding] = await Promise.all([
    getPortalBusiness(supabase, business.businessId),
    getBusinessMenu(supabase, business.businessId, {
      locale: options.language === "en" ? "en" : "bg",
      categoryIds: options.categoryIds.length ? options.categoryIds : undefined
    }),
    supabase.from("business_translations").select("locale, slug").eq("business_id", business.businessId),
    options.backgroundId
      ? supabase
          .from("business_media")
          .select("id, original_key, variant_keys")
          .eq("business_id", business.businessId)
          .eq("id", options.backgroundId)
          .eq("media_type", "image")
          .maybeSingle()
      : Promise.resolve({ data: null }),
    getBusinessTheme(supabase, business.businessId)
  ]);

  const categories = menu.categories.filter((category) => category.items.length > 0);
  const sheet = sheetDimensions(options);
  const columns = printColumnCount(sheet.width);
  /* За печат се ползва оригиналът: WebP 1600 не стига за A3 при 300 dpi. */
  const backgroundUrl = background.data ? businessMediaUrls(background.data).original : null;

  const bgSlug = translations.data?.find((row) => row.locale === "bg")?.slug ?? business.slug;
  const enSlug = translations.data?.find((row) => row.locale === "en")?.slug ?? null;
  const menuPath = options.language === "en" && enSlug ? `/en/places/${enSlug}/menu` : `/places/${bgSlug}/menu`;
  /* QR кодът в цвета на темата (акцент или текст), винаги достатъчно тъмен на бяло. */
  const qrMarkup = options.qr ? qrSvg(`${siteUrl}${menuPath}?src=print`, { margin: 0, light: null, dark: qrColorFor(branding.theme), icon: branding.theme.qr_icon }) : null;
  const logoSrc = branding.logo?.w960 ?? branding.logo?.original ?? null;

  const labels =
    options.language === "en"
      ? { menu: "Menu", prices: "Prices in euro, VAT included.", scan: "Current menu", empty: "The menu is empty." }
      : options.language === "both"
        ? { menu: "Меню · Menu", prices: "Цените са в евро с ДДС · Prices in euro, VAT included.", scan: "Актуално меню · Current menu", empty: "Менюто е празно." }
        : { menu: "Меню", prices: "Цените са в евро с включен ДДС.", scan: "Актуално меню", empty: "Менюто е празно." };

  /* Темата на бизнеса дава цветовете и шрифтовете; „тъмен стил“ взима тъмния ѝ вариант. */
  const dark = options.style === "dark";
  const sheetClass = [
    "print-sheet",
    themeClassName(branding.theme, { dark }),
    sheet.width < 130 ? "print-sheet--narrow" : "",
    sheet.width >= 290 ? "print-sheet--large" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="print-stage">
      <style>{`@page { size: ${sheet.width}mm ${sheet.height}mm; margin: 0; }`}</style>

      <div className="print-toolbar">
        <p>
          В диалога за печат избери „Запази като PDF“ или принтера. Полета: „Няма“; мащаб: 100 %. Размерът на листа идва от страницата:{" "}
          <strong>
            {sheet.width} × {sheet.height} mm
          </strong>
          {sheet.bleed ? " (с 3 mm за рязане от всяка страна)" : ""}.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/business/print" className={portalUi.secondaryButton}>
            Назад към настройките
          </Link>
          <PrintButton className={portalUi.primaryButton}>Печат / Запази като PDF</PrintButton>
        </div>
      </div>

      <article
        className={sheetClass}
        style={
          {
            ...themeStyle(branding.theme, { dark }),
            "--sheet-width": `${sheet.width}mm`,
            "--sheet-height": `${sheet.height}mm`,
            "--sheet-bleed": `${sheet.bleed}mm`,
            "--sheet-columns": columns
          } as React.CSSProperties
        }
      >
        {backgroundUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={backgroundUrl} alt="" className="print-background" />
            <div className="print-veil" />
          </>
        ) : null}

        <div className="print-content">
          <PaperMenuHead
            className="print-head"
            title={portal?.name ?? business.name}
            subtitle={labels.menu}
            ornament={branding.theme.ornament}
            logo={logoSrc ? { src: logoSrc, alt: branding.logoAlt ?? portal?.name ?? business.name } : null}
          />

          {categories.length === 0 ? (
            <p style={{ textAlign: "center" }}>{labels.empty}</p>
          ) : (
            <div className="print-columns">
              {categories.map((category) => (
                <PrintCategory key={category.id} category={category} language={options.language} descriptions={options.descriptions} />
              ))}
            </div>
          )}

          <footer className="print-foot">
            <div>
              <p className="print-foot__name">{portal?.name ?? business.name}</p>
              {portal?.address ? <p>{portal.address}</p> : null}
              {portal?.phone ? <p>{portal.phone}</p> : null}
              <p className="print-foot__muted">{labels.prices}</p>
            </div>
            {qrMarkup ? (
              <div className="print-qr">
                <span className="print-foot__muted">{labels.scan}</span>
                <span className="print-qr__code" dangerouslySetInnerHTML={{ __html: qrMarkup }} />
              </div>
            ) : null}
          </footer>
        </div>
      </article>
    </div>
  );
}
