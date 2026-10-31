import type { Metadata } from "next";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getSiteSettings } from "@/lib/content";
import { getDictionary, isLocale, localePath, localeUrl } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { notFound } from "next/navigation";

type Params = Promise<{ locale: string }>;

/** Keep in sync with the privacy page. */
const publisher = {
  name: "Любо Канелов",
  nameEn: "Lubo Kanelov",
  email: "mail@kanelov.com",
  updated: "2026-10-31"
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dictionary = getDictionary(locale);
  return {
    title: dictionary.terms,
    description:
      locale === "en"
        ? "The rules for using Bansko NOW: content, photographs, Art Studio orders, photo licences and business listings."
        : "Правилата за ползване на Bansko NOW: съдържание, фотографии, поръчки в Art Studio, лицензи за снимки и обяви на бизнеси.",
    alternates: { canonical: localeUrl(locale, "/terms"), languages: { bg: localeUrl("bg", "/terms"), en: localeUrl("en", "/terms"), "x-default": localeUrl("bg", "/terms") } }
  };
}

type Section = { title: string; paragraphs: string[] };

function sections(locale: Locale): Section[] {
  if (locale === "en") {
    return [
      {
        title: "What Bansko NOW is",
        paragraphs: [
          `Bansko NOW (bansko.now) is an independent online magazine about Bansko and the Pirin mountains, published by ${publisher.nameEn}, Bansko, Bulgaria. By using the site you accept these terms. Contact: ${publisher.email}.`
        ]
      },
      {
        title: "Content and accuracy",
        paragraphs: [
          "Articles, event notes, weather and opening hours are published in good faith and can go out of date: check with the venue, the lift operator or the mountain rescue service before you rely on them. Mountain conditions in Pirin change quickly; you are responsible for your own safety.",
          "Some articles are prepared with the help of AI tools and reviewed by the editor before publication."
        ]
      },
      {
        title: "Photographs and texts",
        paragraphs: [
          "Every photograph and text on the site is protected by copyright and belongs to the author or to the people who gave us the right to show it. You may share a link to a page and quote a short passage with a link back. Copying photographs or whole articles, including for social media, AI training or print, is not allowed without a written licence.",
          "A licence for a photograph can be bought on its page in the photo archive. The licence text you accept at checkout defines what you may do with the file; the price depends on the use. The photographer keeps the copyright."
        ]
      },
      {
        title: "Art Studio orders",
        paragraphs: [
          "Requests for custom prints, T-shirts, mugs and other products are enquiries, not instant purchases: we confirm each one personally by phone or e-mail, agree the details and the price, and only then start production. Payment is made at pickup in the gallery in Bansko or as agreed in the confirmation. Products made to your photo or design are personalised and cannot be returned unless they are faulty; faulty items are remade or refunded.",
          "By sending a photo for a product you confirm that you have the right to use it and that it shows nothing that would break the law or someone else's rights."
        ]
      },
      {
        title: "Gallery reservations",
        paragraphs: [
          "A reservation from the online gallery keeps the product for you at the gallery in Bansko and gives you a reference number. It is not a payment; you pay at pickup. Reservations that are not collected within the time stated in the confirmation can be cancelled."
        ]
      },
      {
        title: "Local businesses",
        paragraphs: [
          "Listings are provided by the businesses themselves or compiled from public information; we are not a party to anything you buy from them. A listed business is responsible for its own menu, prices, hours and the content it publishes through the business portal, and it must have the right to any photo or logo it uploads. We may edit or remove a listing that is misleading, offensive or inactive."
        ]
      },
      {
        title: "Liability",
        paragraphs: [
          "We do our best to keep the site accurate and available, but we cannot promise that it is free of errors or interruptions, and we are not liable for loss that follows from relying on it, except where Bulgarian law does not allow such a limitation."
        ]
      },
      {
        title: "Law and changes",
        paragraphs: [
          `Bulgarian law applies. Disputes that cannot be settled by agreement go to the competent court in Bulgaria. We may update these terms; the current version with its date (${publisher.updated}) is always on this page.`
        ]
      }
    ];
  }

  return [
    {
      title: "Какво е Bansko NOW",
      paragraphs: [
        `Bansko NOW (bansko.now) е независимо онлайн списание за Банско и Пирин, издавано от ${publisher.name}, Банско. С ползването на сайта приемате тези условия. Връзка: ${publisher.email}.`
      ]
    },
    {
      title: "Съдържание и точност",
      paragraphs: [
        "Статиите, бележките за събития, времето и работното време се публикуват добросъвестно и могат да остареят: преди да разчитате на тях, проверете при заведението, лифта или Планинската спасителна служба. Условията в Пирин се менят бързо; за безопасността си отговаряте вие.",
        "Част от статиите се подготвят с помощта на инструменти с изкуствен интелект и се преглеждат от редактора преди публикуване."
      ]
    },
    {
      title: "Фотографии и текстове",
      paragraphs: [
        "Всяка фотография и всеки текст в сайта са защитени с авторско право и принадлежат на автора или на хората, които са ни дали право да ги показваме. Може да споделяте линк към страница и да цитирате кратък откъс с линк към нас. Копирането на фотографии или цели статии, включително за социални мрежи, обучение на изкуствен интелект или печат, не е позволено без писмен лиценз.",
        "Лиценз за фотография се купува от страницата ѝ във фотоархива. Текстът на лиценза, който приемате при плащане, определя какво може да правите с файла; цената зависи от употребата. Авторското право остава на фотографа."
      ]
    },
    {
      title: "Поръчки в Art Studio",
      paragraphs: [
        "Запитванията за принтове, тениски, чаши и други продукти по поръчка не са моментална покупка: потвърждаваме всяко лично по телефон или имейл, уточняваме детайлите и цената и едва тогава започваме изработката. Плащането е при получаване в галерията в Банско или както е уговорено в потвърждението. Продуктите по ваша снимка или дизайн са персонализирани и не подлежат на връщане, освен при дефект; дефектните се изработват наново или се възстановява сумата.",
        "С изпращането на снимка за продукт потвърждавате, че имате право да я ползвате и че тя не нарушава закона или чужди права."
      ]
    },
    {
      title: "Резервации от галерията",
      paragraphs: [
        "Резервацията от онлайн галерията запазва продукта за вас в галерията в Банско и ви дава номер. Тя не е плащане; плащате при получаване. Непотърсени в срока от потвърждението резервации могат да бъдат отменени."
      ]
    },
    {
      title: "Местни бизнеси",
      paragraphs: [
        "Обявите се подават от самите бизнеси или се съставят от публична информация; ние не сме страна по това, което купувате от тях. Включеният бизнес отговаря за менюто, цените, работното време и съдържанието, което публикува през бизнес портала, и трябва да има право върху всяка снимка или лого, които качва. Може да редактираме или премахнем обява, която е подвеждаща, обидна или неактивна."
      ]
    },
    {
      title: "Отговорност",
      paragraphs: [
        "Стараем се сайтът да е точен и достъпен, но не можем да обещаем, че е без грешки и прекъсвания, и не носим отговорност за вреди от разчитане на него, освен когато българският закон не допуска такова ограничение."
      ]
    },
    {
      title: "Право и промени",
      paragraphs: [
        `Прилага се българското право. Спорове, които не се решават по споразумение, се отнасят до компетентния съд в България. Може да обновяваме условията; актуалната версия с датата ѝ (${publisher.updated}) е винаги на тази страница.`
      ]
    }
  ];
}

export default async function TermsPage({ params }: { params: Params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const settings = await getSiteSettings(locale);

  return (
    <div>
      <SiteHeader locale={locale} alternateHref={localePath(locale === "bg" ? "en" : "bg", "/terms")} />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="font-serif text-5xl font-semibold text-stone-950">{dictionary.terms}</h1>
        <p className="mt-4 text-sm text-stone-500">{locale === "en" ? "Last updated" : "Обновено на"} {publisher.updated}</p>
        <div className="mt-10 grid gap-10">
          {sections(locale).map((section) => (
            <section key={section.title}>
              <h2 className="font-serif text-2xl font-semibold text-stone-950">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-4 text-base leading-7 text-stone-650">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </main>
      <SiteFooter settings={settings} locale={locale} />
    </div>
  );
}
