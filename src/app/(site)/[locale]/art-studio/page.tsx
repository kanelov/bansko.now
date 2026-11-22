import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { IconGlyph } from "@/components/public/icon-glyph";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getSiteSettings } from "@/lib/content";
import { isLocale, localePath, localeUrl } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

/**
 * Art Studio (22.11.2026, решение на собственика): Арт Студио Канелов приема поръчки
 * на kanelov.com. Тази страница е само входна: продукти и трите начина на поръчка водят
 * направо към kanelov.com, готовите модели за чаши, възглавници и картини – към онлайн
 * галерията тук. Без собствени продукти и форми; старите адреси на видовете продукти
 * пренасочват към kanelov.com (`next.config.ts`). Илюстрациите са от kanelov.com
 * (`public/art-studio/`). Статична страница, без заявки към базата освен настройките.
 */

type Params = Promise<{ locale: string }>;

export const revalidate = 900;

const K = "https://kanelov.com";
const galleryAddress = { bg: "ул. „Никола Й. Вапцаров“ 8, Банско", en: "8 Nikola Y. Vaptsarov St, Bansko" };

type Way = { href: string; image: string; color: string; title: string; text: string };
type Product = { id: string; color: string; title: string; text: string };

const copy: Record<Locale, {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  lead: string;
  ways: Way[];
  productsEyebrow: string;
  productsTitle: string;
  products: Product[];
  order: string;
  allProducts: string;
  waysEyebrow: string;
  waysTitle: string;
  galleryEyebrow: string;
  galleryTitle: string;
  galleryText: string;
  galleryLink: string;
  placeEyebrow: string;
  placeTitle: string;
  placeText: string;
  placeLink: string;
  home: string;
}> = {
  bg: {
    metaTitle: "Арт Студио Канелов – тениски, чаши и картини с Ваш дизайн | Bansko NOW",
    metaDescription: "Тениски, чаши, възглавници и картини с дизайн, нарисуван на момента, с Ваша снимка или с готов модел. Поръчка на kanelov.com, вземане от галерията в Банско.",
    eyebrow: "Арт Студио Канелов · Банско",
    title: "Тениски, чаши и картини с Ваш дизайн",
    lead: "Арт Студио Канелов приема поръчки на kanelov.com. Изберете как искате да поръчате: дизайн, нарисуван на момента, Ваш собствен дизайн или готов модел. Взимате от галерията в Банско или с доставка.",
    ways: [
      { href: `${K}/teniski/sazday/ideya`, image: "/art-studio/ukrasa-ideya.webp", color: "#f2cd6c", title: "Нарисувай на момента", text: "Опишете идеята си с няколко думи и дизайнът се рисува пред очите Ви." },
      { href: `${K}/studio/produkti`, image: "/art-studio/za-sebe.webp", color: "#bfdeea", title: "Поръчай с твой дизайн", text: "Качете своя снимка, рисунка или лого и изберете продукта." },
      { href: `${K}/teniski#dizayni`, image: "/art-studio/stapka-dizain.webp", color: "#b5d1aa", title: "Избери от готовите модели", text: "Готови дизайни с надписи, поводи, животни и Пирин." }
    ],
    productsEyebrow: "Изберете продукт",
    productsTitle: "Какво поръчвате",
    products: [
      { id: "teniska", color: "#f2cd6c", title: "Тениски", text: "С надпис, рисунка или Ваша снимка. Мъжки, дамски, детски и боди." },
      { id: "chasha", color: "#f0b593", title: "Чаши", text: "Керамична чаша с дизайн или снимка." },
      { id: "vazglavnitsa", color: "#d3c4ee", title: "Възглавници", text: "Мека възглавница с акварел, мотив или Ваш кадър." },
      { id: "print-hartia", color: "#b5d1aa", title: "Принт на арт хартия", text: "Акварели и фотографии на музейна хартия, с рамка или без." },
      { id: "kanava", color: "#a6cfe2", title: "Канава в рамка", text: "Снимка или картина като платно в рамка." }
    ],
    order: "Поръчай на kanelov.com",
    allProducts: "Всички продукти на kanelov.com",
    waysEyebrow: "Три начина",
    waysTitle: "Как да поръчате",
    galleryEyebrow: "Готови дизайни",
    galleryTitle: "Стотици мотиви в онлайн галерията",
    galleryText: "Акварели, фотографии от Пирин, моми с носии. Изберете мотив и го поръчайте като тениска, чаша или картина.",
    galleryLink: "Разгледай галерията",
    placeEyebrow: "В Банско",
    placeTitle: "Галерията на ул. „Никола Вапцаров“ 8",
    placeText: "Арт Студио Канелов е в галерия Арт Идея, на крачка от площада. Там виждате продуктите на живо и взимате поръчката си.",
    placeLink: "Към страницата на галерията",
    home: "Начало"
  },
  en: {
    metaTitle: "Kanelov Art Studio – T-shirts, mugs and prints with your design | Bansko NOW",
    metaDescription: "T-shirts, mugs, cushions and prints with a design drawn on the spot, your own photo or a ready-made design. Order on kanelov.com, pick up at the gallery in Bansko.",
    eyebrow: "Kanelov Art Studio · Bansko",
    title: "T-shirts, mugs and prints with your design",
    lead: "Kanelov Art Studio takes orders on kanelov.com. Choose how you want to order: a design drawn on the spot, your own design or a ready-made one. Pick it up at the gallery in Bansko or have it delivered.",
    ways: [
      { href: `${K}/teniski/sazday/ideya`, image: "/art-studio/ukrasa-ideya.webp", color: "#f2cd6c", title: "Draw it on the spot", text: "Describe your idea in a few words and the design is drawn before your eyes." },
      { href: `${K}/studio/produkti`, image: "/art-studio/za-sebe.webp", color: "#bfdeea", title: "Order with your design", text: "Upload your photo, drawing or logo and choose the product." },
      { href: `${K}/teniski#dizayni`, image: "/art-studio/stapka-dizain.webp", color: "#b5d1aa", title: "Pick a ready-made design", text: "Ready designs with lettering, occasions, animals and Pirin." }
    ],
    productsEyebrow: "Choose a product",
    productsTitle: "What you can order",
    products: [
      { id: "teniska", color: "#f2cd6c", title: "T-shirts", text: "With lettering, a drawing or your photo. Men, women, kids and baby." },
      { id: "chasha", color: "#f0b593", title: "Mugs", text: "A ceramic mug with a design or a photo." },
      { id: "vazglavnitsa", color: "#d3c4ee", title: "Cushions", text: "A soft cushion with a watercolour, a motif or your shot." },
      { id: "print-hartia", color: "#b5d1aa", title: "Art paper print", text: "Watercolours and photographs on museum paper, framed or not." },
      { id: "kanava", color: "#a6cfe2", title: "Framed canvas", text: "A photo or a painting as a framed canvas." }
    ],
    order: "Order on kanelov.com",
    allProducts: "All products on kanelov.com",
    waysEyebrow: "Three ways",
    waysTitle: "How to order",
    galleryEyebrow: "Ready designs",
    galleryTitle: "Hundreds of motifs in the online gallery",
    galleryText: "Watercolours, Pirin photography, folk costumes. Pick a motif and order it as a T-shirt, mug or print.",
    galleryLink: "Browse the gallery",
    placeEyebrow: "In Bansko",
    placeTitle: "The gallery at 8 Nikola Vaptsarov St",
    placeText: "Kanelov Art Studio is inside the Art Idea gallery, a few steps from the square. See the products in person and pick up your order there.",
    placeLink: "To the gallery page",
    home: "Home"
  }
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const text = copy[locale];
  return {
    title: { absolute: text.metaTitle },
    description: text.metaDescription,
    alternates: {
      canonical: localeUrl(locale, "/art-studio"),
      languages: { bg: localeUrl("bg", "/art-studio"), en: localeUrl("en", "/art-studio"), "x-default": localeUrl("bg", "/art-studio") }
    },
    openGraph: { title: text.metaTitle, description: text.metaDescription, type: "website", url: localeUrl(locale, "/art-studio") }
  };
}

function Blob({ src, color }: { src: string; color: string }) {
  return (
    <span className="grid h-40 w-40 place-items-center rounded-[46%_54%_50%_50%/55%_45%_55%_45%]" style={{ backgroundColor: color }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- малки илюстрации от public, без оптимизатора */}
      <img src={src} alt="" width={140} height={140} loading="lazy" className="h-36 w-36 object-contain" />
    </span>
  );
}

function ArrowLink({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-auto inline-flex items-center gap-2 pt-3 text-sm font-semibold text-forest group-hover:underline">
      {children}
      <IconGlyph name="arrow-right" className="h-3.5 w-3.5" />
    </span>
  );
}

export default async function ArtStudioPage({ params }: { params: Params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const text = copy[locale];
  const settings = await getSiteSettings(locale);
  const pageUrl = localeUrl(locale, "/art-studio");
  const galleryHref = localePath(locale, "/art-studio/gallery") as Route;
  const placeHref = localePath(locale, locale === "en" ? "/places/art-idea" : "/places/art-ideya") as Route;
  const card = "group flex flex-col items-center gap-2 rounded-2xl border border-stone-200 bg-white p-6 text-center transition hover:-translate-y-0.5 hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";

  const storeSchema = {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${pageUrl}#store`,
    name: locale === "en" ? "Kanelov Art Studio" : "Арт Студио Канелов",
    url: pageUrl,
    sameAs: [`${K}/studio`],
    description: text.metaDescription,
    address: { "@type": "PostalAddress", streetAddress: galleryAddress[locale], addressLocality: "Bansko", addressCountry: "BG" }
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: text.home, item: localeUrl(locale) },
      { "@type": "ListItem", position: 2, name: "Art Studio", item: pageUrl }
    ]
  };

  return (
    <div>
      <SiteHeader locale={locale} alternateHref={localePath(locale === "bg" ? "en" : "bg", "/art-studio")} />
      <main className="mx-auto grid max-w-7xl gap-16 px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <section className="border-b border-stone-200 pb-12">
          <nav className="text-sm text-stone-500" aria-label="Breadcrumb">
            <Link href={localePath(locale, "/") as Route} className="hover:text-forest">{text.home}</Link>
            <span className="px-2">/</span>
            <span className="text-stone-700">Art Studio</span>
          </nav>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.14em] text-moss">{text.eyebrow}</p>
          <h1 className="mt-3 max-w-4xl font-serif text-4xl font-semibold leading-tight text-stone-950 sm:text-6xl">{text.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-650">{text.lead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {text.ways.map((way, index) => (
              <a
                key={way.href}
                href={way.href}
                className={`inline-flex flex-1 basis-56 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest ${
                  index === 0 ? "bg-forest text-white hover:bg-moss" : "border border-forest text-forest hover:bg-forest hover:text-white"
                }`}
              >
                {way.title}
                <IconGlyph name="arrow-right" className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </section>

        <section aria-labelledby="art-studio-products">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">{text.productsEyebrow}</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <h2 id="art-studio-products" className="font-serif text-3xl font-semibold text-stone-950 sm:text-4xl">{text.productsTitle}</h2>
            <a href={`${K}/studio/produkti`} className="inline-flex items-center gap-2 text-sm font-semibold text-forest hover:underline">
              {text.allProducts}
              <IconGlyph name="arrow-right" className="h-3.5 w-3.5" />
            </a>
          </div>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {text.products.map((product) => (
              <li key={product.id} className="flex">
                <a href={`${K}/studio/produkti/${product.id}`} className={`${card} w-full`}>
                  <Blob src={`/art-studio/${product.id}.webp`} color={product.color} />
                  <h3 className="mt-2 font-serif text-xl font-semibold text-stone-950">{product.title}</h3>
                  <p className="text-sm leading-6 text-stone-650">{product.text}</p>
                  <ArrowLink>{text.order}</ArrowLink>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="art-studio-ways">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">{text.waysEyebrow}</p>
          <h2 id="art-studio-ways" className="mt-3 font-serif text-3xl font-semibold text-stone-950 sm:text-4xl">{text.waysTitle}</h2>
          <ul className="mt-8 grid gap-5 md:grid-cols-3">
            {text.ways.map((way) => (
              <li key={way.href} className="flex">
                <a href={way.href} className={`${card} w-full`}>
                  <Blob src={way.image} color={way.color} />
                  <h3 className="mt-2 font-serif text-2xl font-semibold text-stone-950">{way.title}</h3>
                  <p className="text-base leading-7 text-stone-650">{way.text}</p>
                  <ArrowLink>{text.order}</ArrowLink>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <Link href={placeHref} className="group flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-7 transition hover:shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-moss">{text.placeEyebrow}</p>
            <h2 className="font-serif text-2xl font-semibold text-stone-950">{text.placeTitle}</h2>
            <p className="text-base leading-7 text-stone-650">{text.placeText}</p>
            <ArrowLink>{text.placeLink}</ArrowLink>
          </Link>
          <Link href={galleryHref} className="group flex flex-col gap-3 rounded-2xl bg-forest p-7 text-white transition hover:bg-moss">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/70">{text.galleryEyebrow}</p>
            <h2 className="font-serif text-2xl font-semibold">{text.galleryTitle}</h2>
            <p className="text-base leading-7 text-white/85">{text.galleryText}</p>
            <span className="mt-auto inline-flex items-center gap-2 pt-3 text-sm font-semibold text-white group-hover:underline">
              {text.galleryLink}
              <IconGlyph name="arrow-right" className="h-3.5 w-3.5" />
            </span>
          </Link>
        </section>
      </main>
      <SiteFooter settings={settings} locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </div>
  );
}
