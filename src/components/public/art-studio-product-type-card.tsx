import Link from "next/link";
import type { Route } from "next";
import { IconGlyph } from "@/components/public/icon-glyph";
import { localePath } from "@/lib/i18n";
import type { Locale, LocalizedArtStudioProductType } from "@/lib/types";

/**
 * Product type card. Uses the type's own image when one is set in the admin;
 * otherwise a calm colour panel with the icon, never a stock photo.
 */
export function ArtStudioProductTypeCard({
  productType,
  locale,
  priority = false
}: {
  productType: LocalizedArtStudioProductType;
  locale: Locale;
  priority?: boolean;
}) {
  const href = localePath(locale, `/art-studio/${productType.slug}`) as Route;

  return (
    <article className="group relative min-h-80 overflow-hidden rounded-2xl bg-forest text-white shadow-soft">
      {productType.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- deliberate: no Vercel image optimization traffic
        <img
          src={productType.image_url}
          alt={productType.image_alt || productType.title}
          width={1200}
          height={800}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover opacity-75 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-65"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(223,232,216,0.35),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(182,101,60,0.35),transparent_50%)]" aria-hidden="true" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/20 to-black/75" />
      <div className="relative flex min-h-80 flex-col justify-end p-6 sm:p-8">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-white/95 text-forest shadow-sm">
          <IconGlyph name={productType.icon_name} className="h-5 w-5" />
        </span>
        <h3 className="mt-5 font-serif text-3xl font-semibold leading-tight sm:text-4xl">{productType.title}</h3>
        {productType.description ? <p className="mt-3 max-w-xl text-sm leading-6 text-stone-100">{productType.description}</p> : null}
        <Link href={href} className="mt-6 inline-flex w-fit rounded-full bg-white px-5 py-3 text-sm font-semibold text-forest transition hover:bg-sage hover:text-forest">
          {locale === "en" ? "View products" : "Виж продуктите"}
        </Link>
      </div>
    </article>
  );
}
