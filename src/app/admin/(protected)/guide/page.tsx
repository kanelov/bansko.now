import Link from "next/link";
import type { ReactNode } from "react";

const markdownHelpRows = [
  {
    title: "Основно подзаглавие (H2)",
    explanation: "Използвай го за всяка голяма секция в статията. Заглавието на самата статия вече е H1.",
    example: "## Какво да видим в Банско"
  },
  {
    title: "По-малко подзаглавие (H3)",
    explanation: "Разделя по-дълга H2 секция на по-малки и лесни за четене части.",
    example: "### Подходящо време за посещение"
  },
  {
    title: "Обикновен абзац",
    explanation: "Напиши текста на собствен ред и остави един празен ред преди следващия абзац.",
    example: "Банско е жив град през всеки сезон."
  },
  {
    title: "Удебелен текст",
    explanation: "Постави две звездички преди и след думите, които искаш да изпъкнат.",
    example: "Това е **важна информация** за посетителите."
  },
  {
    title: "Списък с точки",
    explanation: "Започни всеки ред с тире. Подходящо е за идеи, удобства или кратки съвети.",
    example: `- Първа идея
- Втора идея`
  },
  {
    title: "Номериран списък",
    explanation: "Започни всеки ред с номер, когато последователността е важна.",
    example: `1. Първа стъпка
2. Втора стъпка`
  },
  {
    title: "Линк",
    explanation: "Текстът е в квадратни скоби, а адресът веднага след него е в кръгли скоби.",
    example: "[Виж събитията в Банско](/events)"
  },
  {
    title: "Единична снимка",
    explanation: "Текстът в квадратните скоби е alt описание за Google и за хора, които не виждат изображението.",
    example: "![Пирин над Банско през зимата](https://.../pirin.webp)"
  },
  {
    title: "Цитат",
    explanation: "Започни реда със знак >, за да покажеш цитат или кратък редакторски акцент.",
    example: "> Банско е най-красиво, когато го откриваш бавно."
  },
  {
    title: "Галерия с lightbox",
    explanation: "Добави по една снимка на ред. При отваряне читателят може да преминава между всички снимки.",
    example: `:::gallery
![Смислен alt текст на първата снимка](https://.../image-1.webp)
![Смислен alt текст на втората снимка](https://.../image-2.webp)
:::`
  },
  {
    title: "Бутон с линк",
    explanation: "Промени текста и адреса. Използвай primary за основен и secondary за по-лек бутон.",
    example: `:::button
text: Виж програмата
url: /events
style: primary
:::`
  },
  {
    title: "Информационен акцент",
    explanation: "Използвай го за важна практична информация, която трябва да се забележи лесно.",
    example: `:::callout
color: forest

Важна практична информация за читателя.
:::`
  },
  {
    title: "Текст с избран цвят",
    explanation: "Цветът може да бъде stone, forest, moss, clay, ink или white.",
    example: `:::text
color: clay

Редакторски текст с цветен акцент.
:::`
  },
  {
    title: "Видео",
    explanation: "На първия ред постави публичния адрес на видеото, а на втория - кратко описание.",
    example: `:::video
https://.../short-video.mp4
Кратко описание на видеото.
:::`
  },
  {
    title: "Въпроси и отговори (FAQ)",
    explanation: "Всеки въпрос е H3. Блокът се показва като акордеон и добавя FAQ структурирани данни за SEO.",
    example: `:::faq
color: stone

### Кога е най-подходящо да посетя Банско?
Кратък и полезен отговор.

### Нужно ли е предварително записване?
Втори ясен отговор.
:::`
  }
];

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-4 overflow-x-auto rounded-xl bg-stone-950 p-4 text-sm leading-6 text-stone-100">
      <code>{children}</code>
    </pre>
  );
}

function GuideSection({
  number,
  title,
  children,
  open = false
}: {
  number: string;
  title: string;
  children: ReactNode;
  open?: boolean;
}) {
  return (
    <details open={open} className="group border-t border-stone-200 py-2 first:border-t-0">
      <summary className="flex cursor-pointer list-none items-center gap-4 py-4 text-stone-950">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage text-xs font-semibold text-forest">
          {number}
        </span>
        <h2 className="font-serif text-2xl font-semibold">{title}</h2>
        <span aria-hidden="true" className="ml-auto text-xl text-moss transition group-open:rotate-45">+</span>
      </summary>
      <div className="pb-7 pl-0 text-sm leading-7 text-stone-700 sm:pl-12">{children}</div>
    </details>
  );
}

function MarkdownGuideRow({ title, explanation, example }: (typeof markdownHelpRows)[number]) {
  return (
    <div className="grid gap-2 border-t border-stone-200 py-5 first:border-t-0 lg:grid-cols-[0.8fr_1.2fr] lg:gap-8">
      <div>
        <h3 className="font-semibold text-stone-950">{title}</h3>
        <p className="mt-2 leading-6 text-stone-600">{explanation}</p>
      </div>
      <CodeBlock>{example}</CodeBlock>
    </div>
  );
}

export default function AdminGuidePage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-8">
      <header>
        <p className="text-sm font-semibold uppercase text-stone-400">Работен наръчник</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold">Инструкции за Bansko NOW</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-300">
          Практично описание на функциите в сайта. Документът е част от проекта и трябва да се допълва при всяка нова възможност или промяна в работния процес.
        </p>
        <p className="mt-3 text-xs font-semibold uppercase text-stone-500">Актуализирано: 9 август 2026</p>
      </header>

      <nav aria-label="Бързи действия" className="flex flex-wrap gap-3">
        <Link href="/admin/articles/new" className="admin-button admin-button-primary px-5 py-2.5 text-sm font-semibold">Нова статия</Link>
        <Link href="/admin/businesses" className="admin-button admin-button-secondary px-5 py-2.5 text-sm font-semibold">Бизнеси</Link>
        <Link href="/admin/media" className="admin-button admin-button-secondary px-5 py-2.5 text-sm font-semibold">Медия</Link>
      </nav>

      <div className="rounded-2xl bg-white px-5 text-stone-950 shadow-soft sm:px-7">
        <GuideSection number="01" title="Ежедневно публикуване" open>
          <ol className="grid list-decimal gap-2 pl-5">
            <li>Качи подготвените изображения в „Медия“ и добави точен alt текст.</li>
            <li>Отвори „Статии“ → „Нова статия“ и попълни заглавие, slug, категория и кратко описание.</li>
            <li>Постави текста в Content, добави визуалните блокове и източниците.</li>
            <li>Попълни SEO полетата и провери автоматичния SEO резултат.</li>
            <li>Избери основна и OpenGraph снимка, после провери Preview.</li>
            <li>Запази първо като чернова. Публикувай едва след редакторски преглед.</li>
          </ol>
          <p className="mt-4 rounded-xl bg-sage/40 p-4 text-forest">
            Публичният сайт показва само публикувани статии. Черновите и планираните материали остават скрити.
          </p>
        </GuideSection>

        <GuideSection number="02" title="Статии и форматиране">
          <p>
            Редакторът има раздели Content, SEO, Images, Settings и Preview. Основният текст се пази като Markdown, което го прави лек, стабилен и подходящ за SEO.
          </p>
          <p className="mt-4 rounded-xl bg-sage/40 p-4 text-forest">
            Не добавяй H1 в основния текст. Заглавието на статията вече е единственият H1 на страницата.
          </p>
          <div className="mt-5">
            {markdownHelpRows.map((row) => (
              <MarkdownGuideRow key={row.title} {...row} />
            ))}
          </div>
        </GuideSection>

        <GuideSection number="03" title="SEO на статия">
          <p>Преди публикуване провери следното:</p>
          <ul className="mt-3 grid list-disc gap-2 pl-5">
            <li>SEO заглавието е до 60 знака и съдържа основната ключова дума.</li>
            <li>Meta description е до 160 знака и описва конкретната полза за читателя.</li>
            <li>Slug е кратък, на латиница, с малки букви и тирета.</li>
            <li>Основната снимка и OpenGraph снимката имат описателен alt текст.</li>
            <li>Има поне един полезен вътрешен линк и коректно описани външни източници.</li>
            <li>Canonical URL се попълва само когато има конкретна причина да сочи към друг основен адрес.</li>
          </ul>
          <p className="mt-4">Страницата автоматично генерира Article schema, Breadcrumb schema, социални метаданни и дати на публикуване/обновяване.</p>
        </GuideSection>

        <GuideSection number="04" title="Бизнес каталог">
          <p>
            Публичната форма създава бизнес със статус „Чернова“. Контактът на собственика е частен и се вижда само в админа. Нищо не става публично преди одобрение.
          </p>
          <ol className="mt-3 grid list-decimal gap-2 pl-5">
            <li>Прегледай името, категорията, адреса, снимките, видеото, характеристиките и контактните данни.</li>
            <li>Коригирай slug, описанието и SEO полетата.</li>
            <li>Провери GPS координатите и позицията върху илюстрираната карта.</li>
            <li>Избери ниво, статус на плащане и дата „Активен до“.</li>
            <li>Натисни „Одобри“, когато профилът е готов за публикуване.</li>
          </ol>
          <h3 className="mt-6 font-semibold text-stone-950">Годишни нива за видимост</h3>
          <ul className="mt-3 grid list-disc gap-2 pl-5">
            <li><strong>Безплатен:</strong> стандартна карта в каталога; избран е по подразбиране.</li>
            <li><strong>Премиум:</strong> широка карта, приоритетно представяне и по-силен визуален акцент.</li>
            <li><strong>На фокус:</strong> широка карта, най-висока видимост и възможност за блок на началната страница.</li>
          </ul>
          <p className="mt-4 rounded-xl bg-stone-100 p-4">
            Всички платени нива са за 1 година. Stripe линкът и цената се добавят от секцията „Годишни нива и Stripe линкове“. Без статус „Платено“ и бъдеща дата „Активен до“ бизнесът се показва като безплатен.
          </p>
          <p className="mt-4">Бутонът „Упътване“ използва координатите, а при липса на координати търси името и адреса в Google Maps.</p>
        </GuideSection>

        <GuideSection number="05" title="Медия, изображения и видео">
          <ul className="grid list-disc gap-2 pl-5">
            <li>За статии качвай оптимизирани WEBP/JPEG изображения с реален alt текст.</li>
            <li>PNG използвай основно когато е необходима прозрачност.</li>
            <li>Кратките hero видеа е добре да са MP4/WebM, без звук, оптимизирани и достатъчно къси за бързо зареждане.</li>
            <li>Първата бизнес снимка е основна; следващите се използват в галерията.</li>
            <li>Изтриването от „Медия“ премахва файла от Supabase Storage. Преди това провери дали не се използва в публикувана страница.</li>
          </ul>
        </GuideSection>

        <GuideSection number="06" title="Страници, Art Studio и категории">
          <p>
            „Страници“ управлява съдържанието и SEO настройките на „За нас“, „Контакт“ и „Art Studio“. В същия раздел се редактират услугите на Art Studio: снимка, описание, предимства, бутон, цена, ред и премиум акцент.
          </p>
          <p className="mt-4">
            „Категории“ управлява името, slug, описанието, SEO title, meta description, canonical, OpenGraph и robots настройките. Смяната на slug променя публичните URL адреси и трябва да се прави внимателно.
          </p>
        </GuideSection>

        <GuideSection number="07" title="Настройки, меню и контакти">
          <ul className="grid list-disc gap-2 pl-5">
            <li>В „Настройки“ се управляват hero медията, навигацията, Facebook групата и социалните линкове.</li>
            <li>В секцията „Подкрепи Bansko NOW“ се редактират текстът, снимката и Stripe/PayPal линковете на картата за доброволна подкрепа.</li>
            <li>За произволна сума Stripe Payment Link трябва да е създаден с „customer chooses what to pay“, а PayPal/PayPal.Me линкът да няма предварително зададена сума.</li>
            <li>Социална икона се показва само когато има валиден добавен URL.</li>
            <li>Менюто може да съдържа вътрешни и външни линкове и икони от поддържания Font Awesome списък.</li>
            <li>Контактните форми и бизнес заявките изпращат известие към зададения административен имейл.</li>
            <li>Съобщенията от контактната форма се преглеждат и архивират в „Бизнеси“.</li>
          </ul>
        </GuideSection>

        <GuideSection number="08" title="Сигурност и публикуване">
          <ul className="grid list-disc gap-2 pl-5">
            <li>Админът е защитен със Supabase Auth и няма публична регистрация.</li>
            <li>Supabase RLS разрешава публично четене само на одобрени бизнеси и публикувани статии.</li>
            <li>Service role ключът никога не трябва да се поставя в клиентски код или публична environment variable.</li>
            <li>Преди deployment се изпълнява production build и се проверяват ключовите публични и админ маршрути.</li>
          </ul>
        </GuideSection>

        <GuideSection number="09" title="План за български и английски">
          <p>
            Препоръчителният модел е една административна форма с табове „BG“ и „EN“ за статии, страници, категории и бизнеси. Българският остава основен, а английската версия може да се създава автоматично като чернова при публикуване.
          </p>
          <ol className="mt-3 grid list-decimal gap-2 pl-5">
            <li>Добавяме езикови версии към съдържанието, свързани с общ идентификатор.</li>
            <li>Общите UI текстове се пазят в малки локални речници, а URL структурата става <code>/bg/...</code> и <code>/en/...</code>.</li>
            <li>При „Генерирай EN“ AI превежда в английска чернова, без автоматично публично публикуване.</li>
            <li>Администраторът преглежда заглавието, slug, текста, SEO полетата и alt текстовете преди публикуване.</li>
            <li>Добавяме <code>hreflang</code>, отделни canonical адреси и езикови sitemap записи.</li>
          </ol>
          <p className="mt-4 rounded-xl bg-sage/40 p-4 text-forest">
            Това пази редакторския контрол и избягва публични машинни преводи с грешни местни имена, събития или SEO формулировки.
          </p>
        </GuideSection>
      </div>
    </div>
  );
}
