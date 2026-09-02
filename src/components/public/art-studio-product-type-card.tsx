import Link from "next/link";
import type { Route } from "next";
import { IconGlyph } from "@/components/public/icon-glyph";
import { localePath } from "@/lib/i18n";
import type { Locale, LocalizedArtStudioProductType } from "@/lib/types";

/**
 * Product type card: photo on top, calm sage panel with the icon, the title and an
 * aligned "order" button. The photo gently zooms on hover; no stock images.
 */
export function ArtStudioProductTypeCard({
  productType,
  locale,
  priority = false,
  imageUrl
}: {
  productType: LocalizedArtStudioProductType;
  locale: Locale;
  priority?: boolean;
  imageUrl?: string | null;
}) {
  const href = localePath(locale, `/art-studio/${productType.slug}`) as Route;
  const image = productType.image_url || imageUrl || null;
  const label = locale === "en" ? "Order" : "Поръчай";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden bg-sage" aria-label={productType.title} tabIndex={-1}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- deliberate: no Vercel image optimization traffic
          <img
            src={image}
            alt={productType.image_alt || productType.title}
            width={900}
            height={675}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div
            className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(24,59,42,0.16),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(182,101,60,0.18),transparent_50%)] transition duration-700 group-hover:scale-110"
            aria-hidden="true"
          />
        )}
      </Link>
      <div className="flex flex-1 flex-col items-center bg-sage px-5 pb-6 pt-7 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-forest shadow-sm transition duration-300 group-hover:-translate-y-0.5">
          <IconGlyph name={productType.icon_name} className="h-5 w-5" />
        </span>
        <h3 className="mt-4 min-h-[3.75rem] font-serif text-2xl font-semibold leading-tight text-forest">{productType.title}</h3>
        <Link href={href} className="mt-auto inline-flex rounded-full bg-forest px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-moss focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest">
          {label}
        </Link>
      </div>
    </article>
  );
}
