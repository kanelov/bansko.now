import Link from "next/link";
import type { Route } from "next";
import { getDictionary, localePath } from "@/lib/i18n";
import type { Locale, SiteSettings } from "@/lib/types";

export function BanskoCollectionBlock({ locale = "bg", settings }: { locale?: Locale; settings: SiteSettings }) {
  const dictionary = getDictionary(locale);
  const defaultItems = locale === "en" ? ["T-shirts", "Mugs", "Posters", "Photo prints"] : ["Тениски", "Чаши", "Постери", "Фото принтове"];
  const items = settings.collection_items?.filter(Boolean).slice(0, 8) || defaultItems;

  return (
    <section className="rounded-3xl bg-stone-950 p-8 text-white sm:p-10">
      <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-stone-300">{settings.collection_block_eyebrow || dictionary.collectionEyebrow}</p>
          <h2 className="mt-4 font-serif text-4xl font-semibold">{settings.collection_block_title || dictionary.collectionTitle}</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-200">
            {settings.collection_block_text || dictionary.collectionText}
          </p>
        </div>
        <div className="grid gap-3 text-sm text-stone-100">
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <span key={item} className="rounded-2xl bg-white/10 p-4">{item}</span>
            ))}
          </div>
          <Link
            href={localePath(locale, "/bansko-collection") as Route}
            className="inline-flex justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-stone-950 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-stone-100 hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            {settings.collection_block_button_label || dictionary.collectionButton}
          </Link>
        </div>
      </div>
    </section>
  );
}
