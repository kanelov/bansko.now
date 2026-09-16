import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { portalUi } from "@/components/business/ui";
import { requireBusinessOwner } from "@/lib/business-platform/auth";

/**
 * Помощта за собственика: стъпки, които се изпълняват, а не справочник. Всяка
 * секция има „Накратко“ (какво е и какво правиш) и сгънато „Подробно“ (къде
 * живее това и какво се случва отдолу) - същият образец като /admin/guide.
 * Правило: промени ли се процес, се обновява и тази страница.
 */

export const metadata: Metadata = {
  title: "Помощ"
};

const updatedAt = "16 септември 2026";

export default async function BusinessGuidePage() {
  const { business } = await requireBusinessOwner();

  return (
    <div className="grid gap-6">
      <header>
        <p className={portalUi.eyebrow}>Помощ</p>
        <h1 className={portalUi.h1}>Как се работи с портала</h1>
        <p className="mt-2 max-w-xl text-sm text-stone-650">
          Кратко ръководство за {business.name}. Актуализирано: {updatedAt}.
        </p>
      </header>

      <section className={portalUi.card}>
        <GuideSection number="1" title="Меню: категории и артикули" open>
          <GuideSummary>
            <p>Менюто е едно и се пише само тук. Каквото промениш, се вижда на QR менюто веднага.</p>
            <p>
              Първо създаваш категория („Топли напитки“), после добавяш артикули в нея. Артикул с една цена си я носи;
              артикул с размери („Малко“, „Голямо“) взема цените от вариантите.
            </p>
            <p>„Свърши“ показва артикула зачертан с етикет „Изчерпано“. „Скрий“ го маха от менюто, без да го изтрива.</p>
          </GuideSummary>
          <p>
            <Link href="/business/menu" className="font-semibold text-forest underline underline-offset-4">
              Отвори „Меню“
            </Link>
          </p>
          <GuideDetails>
            <p>
              Редовете са в <code>business_menu_categories</code>, <code>business_menu_items</code> и{" "}
              <code>business_menu_item_variants</code>, а имената и описанията на двата езика - в таблиците{" "}
              <code>*_translations</code>. Липсва ли английско име, гостът на английски вижда българското.
            </p>
            <p>
              Цената е в евроцентове: „3,90“ и „3.90“ се приемат еднакво. Артикул с варианти няма собствена цена -
              базата сама я изчиства, за да няма две истини.
            </p>
            <p>
              Снимката отива направо в Cloudflare R2 под <code>business/&lt;бизнес&gt;/image/</code> в три размера
              (480/960/1600) и се пази в <code>business_media</code>.
            </p>
          </GuideDetails>
        </GuideSection>

        <GuideSection number="2" title="Работно време">
          <GuideSummary>
            <p>Попълваш часовете за всеки ден. Ден без часове значи почивен ден.</p>
            <p>Втората двойка часове е за почивка по обяд. Работа след полунощ се пише както си е: 18:00 – 02:00.</p>
            <p>За празник или инвентаризация добавяш промяна по дата - тя бие седмичното време.</p>
          </GuideSummary>
          <p>
            <Link href="/business/hours" className="font-semibold text-forest underline underline-offset-4">
              Отвори „Часове“
            </Link>
          </p>
          <GuideDetails>
            <p>
              Седмицата е в <code>business_hours</code> (по един ред на интервал, ISO дни 1–7), а изключенията - в{" "}
              <code>business_hour_exceptions</code>. „Отворено сега“ се смята на сървъра в часовата зона Europe/Sofia,
              затова е вярно и когато гостът е в друга държава.
            </p>
            <p>
              Ръчният превключвател на таблото („Отворено сега“ / „Затворено сега“) бие часовете. Върни го на „По
              работно време“, когато денят свърши.
            </p>
          </GuideDetails>
        </GuideSection>

        <GuideSection number="3" title="QR код за масите">
          <GuideSummary>
            <p>Един код води към цялото меню. Кодът не се сменя при промяна на цена или при изчерпан артикул.</p>
            <p>Натискаш „Отпечатай“, изрязваш и слагаш на масите.</p>
          </GuideSummary>
          <p>
            <Link href="/business/menu/qr" className="font-semibold text-forest underline underline-offset-4">
              Отвори „QR код за менюто“
            </Link>
          </p>
          <GuideDetails>
            <p>
              Кодът сочи към <code>/places/&lt;адрес&gt;/menu?src=qr</code> и се рисува като вектор на сървъра, затова е
              остър и на стикер, и на лист А4. Английската версия е същата страница под <code>/en/…</code>.
            </p>
          </GuideDetails>
        </GuideSection>

        <GuideSection number="4" title="Какво вижда гостът">
          <GuideSummary>
            <p>Профилът на бизнеса в Bansko NOW показва откъс от менюто, работното време и „Отворено / Затворено“.</p>
            <p>QR менюто е отделна лека страница само с менюто - отваря се бързо и на слаб интернет.</p>
            <p>И двете се обновяват сами до минута след запис в портала.</p>
          </GuideSummary>
          <GuideDetails>
            <p>
              Страниците са статични с 15-минутно опресняване, но всеки запис в портала ги презарежда веднага. Скритите
              артикули и неактивните категории не стигат до публичната страница изобщо - спира ги самата база.
            </p>
            <p>
              Менюто влиза и в данните за Google (schema.org <code>Menu</code> с цени в евро), затова е добре имената да
              са както ги казвате на гостите.
            </p>
          </GuideDetails>
        </GuideSection>

        <GuideSection number="5" title="Какво предстои">
          <GuideSummary>
            <p>Екрани (телевизорите в заведението) и меню за печат идват следващи.</p>
            <p>Те ще ползват същото меню - няма да се въвежда втори път.</p>
          </GuideSummary>
        </GuideSection>
      </section>

      <p className="text-sm text-stone-650">
        Нещо не работи или липсва? Пиши на Bansko NOW:{" "}
        <a href="mailto:mail@kanelov.com" className="font-semibold text-forest underline underline-offset-4">
          mail@kanelov.com
        </a>
        .
      </p>
    </div>
  );
}

function GuideSummary({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 rounded-2xl border border-sage bg-sage/30 p-4">
      <p className="text-xs font-semibold uppercase text-forest">Накратко</p>
      <div className="mt-2 grid gap-1.5">{children}</div>
    </div>
  );
}

function GuideDetails({ title = "Подробно: къде живее това", children }: { title?: string; children: ReactNode }) {
  return (
    <details className="group/details mt-5 rounded-2xl border border-[var(--stone)] bg-paper p-4">
      <summary className="cursor-pointer list-none text-sm font-semibold text-stone-950">
        <span aria-hidden="true" className="mr-2 inline-block text-moss transition group-open/details:rotate-90">
          ▸
        </span>
        {title}
      </summary>
      <div className="mt-3 grid gap-3 text-sm leading-6 text-stone-650">{children}</div>
    </details>
  );
}

function GuideSection({ number, title, children, open = false }: { number: string; title: string; children: ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-t border-[var(--stone)] py-2 first:border-t-0">
      <summary className="flex cursor-pointer list-none items-center gap-4 py-4">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage text-xs font-semibold text-forest">
          {number}
        </span>
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        <span aria-hidden="true" className="ml-auto text-xl text-moss transition group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="pb-7 text-sm leading-7 text-stone-650 sm:pl-12">{children}</div>
    </details>
  );
}
