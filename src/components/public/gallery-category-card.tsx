import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import type { LocalizedGalleryCategory } from "@/lib/gallery-catalog";
import { localePath } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export function GalleryCategoryCard({
  category,
  locale,
  priority = false
}: {
  category: LocalizedGalleryCategory;
  locale: Locale;
  priority?: boolean;
}) {
  const href = localePath(locale, `/art-studio/gallery/category/${category.slug}`) as Route;
  const productLabel = locale === "en"
    ? `${category.product_count} products`
    : `${category.product_count} продукта`;

  return (
    <article className="group overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-soft">
      <Link href={href} prefetch={false} className="block">
        <div className="relative aspect-square overflow-hidden bg-stone-100">
          {category.image_url ? (
            <Image
              src={category.image_url}
              alt={category.image_alt || category.name}
              fill
              unoptimized
              priority={priority}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition duration-300 group-hover:scale-[1.015]"
            />
          ) : (
            <div className="h-full w-full bg-sage" aria-hidden="true" />
          )}
        </div>
        <div className="p-5">
          <p className="text-xs font-semibold uppercase text-moss">{productLabel}</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-stone-950 transition group-hover:text-forest">
            {category.name}
          </h2>
          {category.description ? (
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-650">
              {category.description}
            </p>
          ) : null}
          <span className="mt-5 inline-flex text-sm font-semibold text-forest">
            {locale === "en" ? "Explore category" : "Разгледай категорията"}
          </span>
        </div>
      </Link>
    </article>
  );
}
