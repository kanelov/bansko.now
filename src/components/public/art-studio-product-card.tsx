import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { localePath } from "@/lib/i18n";
import type { Locale, LocalizedArtStudioProduct } from "@/lib/types";

const fallbackImage = "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80";

function startingPrice(product: LocalizedArtStudioProduct, locale: Locale) {
  const prices = product.offers.filter((offer) => offer.is_active).map((offer) => Number(offer.price));
  if (!prices.length) return locale === "en" ? "Enquiry" : "По заявка";
  const minimum = Math.min(...prices);
  const currency = product.offers[0]?.currency || "EUR";
  const price = new Intl.NumberFormat(locale === "en" ? "en-GB" : "bg-BG", { style: "currency", currency }).format(minimum);
  return prices.length > 1 ? `${locale === "en" ? "from" : "от"} ${price}` : price;
}

export function ArtStudioProductCard({ product, locale }: { product: LocalizedArtStudioProduct; locale: Locale }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(38,31,22,0.13)]">
      <Link href={localePath(locale, `/art-studio/${product.product_type.slug}/${product.slug}`) as Route} className="relative block aspect-[4/3] overflow-hidden bg-sage">
        <Image src={product.image_url || fallbackImage} alt={product.image_alt || product.title} fill sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-[1.04]" />
      </Link>
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase text-moss">{product.category?.title || product.product_type.title}</span>
          <strong className="text-sm text-forest">{startingPrice(product, locale)}</strong>
        </div>
        <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight text-stone-950">{product.title}</h2>
        {product.short_description ? <p className="mt-3 text-sm leading-6 text-stone-650">{product.short_description}</p> : null}
        <Link href={localePath(locale, `/art-studio/${product.product_type.slug}/${product.slug}`) as Route} className="mt-5 inline-flex rounded-full bg-forest px-5 py-3 text-sm font-semibold text-white transition hover:bg-moss hover:text-white">
          {locale === "en" ? "View and order" : "Виж и поръчай"}
        </Link>
      </div>
    </article>
  );
}
