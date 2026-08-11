import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { IconGlyph } from "@/components/public/icon-glyph";
import { localePath } from "@/lib/i18n";
import type { Locale, LocalizedArtStudioProductType } from "@/lib/types";

const fallbackImages: Record<string, string> = {
  "custom-tshirts": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
  "fine-art-prints": "https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=1200&q=80",
  "mugs-drinkware": "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=1200&q=80"
};
const fallbackImage = "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80";

export function ArtStudioProductTypeCard({ productType, locale }: { productType: LocalizedArtStudioProductType; locale: Locale }) {
  return (
    <article className="group relative min-h-96 overflow-hidden rounded-2xl bg-forest text-white shadow-soft">
      <Image
        src={productType.image_url || fallbackImages[productType.internal_name] || fallbackImage}
        alt={productType.image_alt || productType.title}
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover opacity-75 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-65"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/20 to-black/80" />
      <div className="relative flex min-h-96 flex-col justify-end p-6 sm:p-8">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-white/95 text-forest shadow-sm">
          <IconGlyph name={productType.icon_name} className="h-5 w-5" />
        </span>
        <h2 className="mt-5 font-serif text-4xl font-semibold leading-tight">{productType.title}</h2>
        {productType.description ? <p className="mt-3 max-w-xl text-sm leading-6 text-stone-100">{productType.description}</p> : null}
        <Link href={localePath(locale, `/art-studio/${productType.slug}`) as Route} className="mt-6 inline-flex w-fit rounded-full bg-white px-5 py-3 text-sm font-semibold text-forest transition hover:bg-sage hover:text-forest">
          {locale === "en" ? "View products" : "Виж продуктите"}
        </Link>
      </div>
    </article>
  );
}
