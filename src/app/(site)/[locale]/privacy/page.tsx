import type { Metadata } from "next";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getSiteSettings } from "@/lib/content";
import { getDictionary, isLocale, localePath, localeUrl } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { notFound } from "next/navigation";

type Params = Promise<{ locale: string }>;

/** Who answers for the data. Keep in sync with the terms page and the contact page. */
const controller = {
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
    title: dictionary.privacy,
    description:
      locale === "en"
        ? "What personal data Bansko NOW collects, why, for how long and what your rights are."
        : "Какви лични данни събира Bansko NOW, защо, за колко време и какви са правата ви.",
    alternates: { canonical: localeUrl(locale, "/privacy"), languages: { bg: localeUrl("bg", "/privacy"), en: localeUrl("en", "/privacy"), "x-default": localeUrl("bg", "/privacy") } }
  };
}

type Section = { title: string; paragraphs?: string[]; items?: string[] };

function sections(locale: Locale): Section[] {
  if (locale === "en") {
    return [
      {
        title: "Who is responsible",
        paragraphs: [
          `Bansko NOW (bansko.now) is published by ${controller.nameEn}, Bansko, Bulgaria. For anything about your data write to ${controller.email}.`,
          "This page explains what we collect, why, for how long and what you can ask for. We keep it short and we collect as little as possible."
        ]
      },
      {
        title: "Reading the site",
        paragraphs: [
          "You can read every public page without an account and without giving us any data. The site is hosted on Vercel and the images are served through Cloudflare; both receive the technical data every website receives (IP address, browser, requested page) and keep it only in short-lived operational logs.",
          "We do not run advertising trackers or analytics cookies. The only cookies are technical: the one that remembers the preview code while the site is locked, and the sign-in cookies of the admin and business areas, which exist only for people who sign in."
        ]
      },
      {
        title: "When you write to us",
        paragraphs: [
          "The contact form sends your name, e-mail, phone (optional), subject and message to our mailbox by e-mail. We use them only to answer you and keep the message as long as the conversation needs it."
        ]
      },
      {
        title: "Art Studio enquiries and gallery reservations",
        paragraphs: [
          "When you ask for a custom print, T-shirt or mug, or reserve a product from the gallery, we record your name, phone and/or e-mail, the product and your note, and the photo you upload if you send one. The order is passed to our production system (app.kanelov.com), where it is handled by the gallery in Bansko; you receive a confirmation e-mail with a reference number.",
          "These records are kept for as long as the order and the legal retention of accounting documents require. Uploaded photos are stored in a private bucket that nobody else can open and are used only to make your product."
        ]
      },
      {
        title: "Photo licences",
        paragraphs: [
          "Buying a licence for a photograph goes through Stripe. Stripe collects your card details directly; we never see them. We keep the order (photo, licence type, your e-mail, amount, date) because the licence is tied to it, and we e-mail you the download link.",
          "Stripe is an independent controller of the payment data; its policy is at stripe.com/privacy."
        ]
      },
      {
        title: "Local businesses",
        paragraphs: [
          "If you submit a business, we store the public profile you fill in and the owner's name and phone, which stay private and are used only to contact you about the listing. Owners of listed businesses get a sign-in to manage their menu and screens; failed sign-in attempts are counted for 15 minutes by a hashed fingerprint only, to stop password guessing."
        ]
      },
      {
        title: "Where the data lives",
        paragraphs: [
          "The database is hosted by Supabase in the European Union. E-mails are sent through Resend. Photos and uploads are stored on Cloudflare R2. Payments go through Stripe. We do not sell or pass on your data to anyone else."
        ]
      },
      {
        title: "Your rights",
        items: [
          "to see what we hold about you and to get a copy;",
          "to have it corrected or deleted;",
          "to object to a use you did not expect;",
          "to complain to the Bulgarian Commission for Personal Data Protection (cpdp.bg) if you think we got it wrong."
        ],
        paragraphs: [`Write to ${controller.email}; we answer within a month.`]
      },
      {
        title: "Changes",
        paragraphs: [`This page was last updated on ${controller.updated}. When something changes, the new date appears here.`]
      }
    ];
  }

  return [
    {
      title: "Кой отговаря за данните",
      paragraphs: [
        `Bansko NOW (bansko.now) се издава от ${controller.name}, Банско. За всичко, свързано с вашите данни, пишете на ${controller.email}.`,
        "Тази страница обяснява какво събираме, защо, за колко време и какво можете да поискате. Държим я кратка и събираме възможно най-малко."
      ]
    },
    {
      title: "Четене на сайта",
      paragraphs: [
        "Всички публични страници се четат без профил и без да ни давате каквито и да е данни. Сайтът се хоства във Vercel, а снимките се подават през Cloudflare; и двете получават техническите данни, които получава всеки сайт (IP адрес, браузър, поискана страница), и ги пазят само в краткотрайни технически журнали.",
        "Не ползваме рекламни проследявания и аналитични бисквитки. Единствените бисквитки са технически: тази, която помни кода за преглед, докато сайтът е заключен, и бисквитките за вход в администрацията и в бизнес портала, които се появяват само при хората, които влизат там."
      ]
    },
    {
      title: "Когато ни пишете",
      paragraphs: [
        "Формата за контакт изпраща името, имейла, телефона (по желание), темата и съобщението ви на нашата поща. Ползваме ги само за да ви отговорим и ги пазим, докато трае разговорът."
      ]
    },
    {
      title: "Запитвания към Art Studio и резервации от галерията",
      paragraphs: [
        "Когато поръчате принт, тениска или чаша по ваша снимка или резервирате продукт от галерията, записваме името, телефона и/или имейла ви, продукта и бележката ви, както и снимката, ако качите такава. Поръчката се предава в системата ни за производство (app.kanelov.com), където се обработва от галерията в Банско; получавате имейл с номер на поръчката.",
        "Тези записи се пазят, докато го изисква поръчката и законовият срок за счетоводни документи. Качените снимки стоят в затворено хранилище, до което никой друг няма достъп, и се ползват само за изработката на вашия продукт."
      ]
    },
    {
      title: "Лицензи за фотографии",
      paragraphs: [
        "Покупката на лиценз за фотография минава през Stripe. Stripe събира данните на картата ви директно; ние никога не ги виждаме. Пазим поръчката (снимка, вид лиценз, вашият имейл, сума, дата), защото лицензът е обвързан с нея, и ви изпращаме линк за сваляне по имейл.",
        "Stripe е самостоятелен администратор на данните за плащането; политиката му е на stripe.com/privacy."
      ]
    },
    {
      title: "Местни бизнеси",
      paragraphs: [
        "Ако добавите бизнес, пазим публичния профил, който попълвате, и името и телефона на собственика, които остават скрити и служат само за връзка с вас по повод обявата. Собствениците на включени бизнеси получават вход за управление на менюто и екраните си; неуспешните опити за вход се броят 15 минути само по хеширан отпечатък, за да спираме отгатването на пароли."
      ]
    },
    {
      title: "Къде стоят данните",
      paragraphs: [
        "Базата данни се хоства от Supabase в Европейския съюз. Имейлите се изпращат през Resend. Снимките и качените файлове стоят в Cloudflare R2. Плащанията минават през Stripe. Не продаваме и не предаваме данните ви на никого другиго."
      ]
    },
    {
      title: "Вашите права",
      items: [
        "да видите какво пазим за вас и да получите копие;",
        "да поискате поправка или изтриване;",
        "да възразите срещу употреба, която не сте очаквали;",
        "да се оплачете пред Комисията за защита на личните данни (cpdp.bg), ако смятате, че сме сгрешили."
      ],
      paragraphs: [`Пишете на ${controller.email}; отговаряме до един месец.`]
    },
    {
      title: "Промени",
      paragraphs: [`Страницата е обновена на ${controller.updated}. При промяна тук се появява новата дата.`]
    }
  ];
}

export default async function PrivacyPage({ params }: { params: Params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const settings = await getSiteSettings(locale);

  return (
    <div>
      <SiteHeader locale={locale} alternateHref={localePath(locale === "bg" ? "en" : "bg", "/privacy")} />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="font-serif text-5xl font-semibold text-stone-950">{dictionary.privacy}</h1>
        <p className="mt-4 text-sm text-stone-500">{locale === "en" ? "Last updated" : "Обновено на"} {controller.updated}</p>
        <div className="mt-10 grid gap-10">
          {sections(locale).map((section) => (
            <section key={section.title}>
              <h2 className="font-serif text-2xl font-semibold text-stone-950">{section.title}</h2>
              {section.items ? (
                <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-7 text-stone-650">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
              {section.paragraphs?.map((paragraph) => (
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
