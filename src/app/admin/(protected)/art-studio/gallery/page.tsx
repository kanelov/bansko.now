import Link from "next/link";
import { ArtStudioAdminNav } from "@/components/admin/art-studio-admin-nav";
import { getLocalizedGalleryCategories } from "@/lib/gallery-catalog";

const sourceAppUrl = "https://app.kanelov.com";

export default async function AdminOnlineGalleryPage() {
  const categories = await getLocalizedGalleryCategories("bg");
  const roots = categories.filter((category) => !category.parent_id);
  const productCount = roots.reduce((total, category) => total + category.product_count, 0);
  const connected = categories.length > 0;

  return (
    <div className="grid gap-8">
      <header className="grid gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-stone-400">Art Studio</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold">Онлайн галерия</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-300">
            Статус и инструкции за каталога, който Bansko NOW синхронизира от системата за заявки и киоска.
          </p>
        </div>
        <ArtStudioAdminNav />
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-stone-400">Връзка</p>
          <p className={`mt-2 text-lg font-semibold ${connected ? "text-emerald-300" : "text-amber-300"}`}>
            {connected ? "Работи" : "Няма данни"}
          </p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-stone-400">Категории</p>
          <p className="mt-2 font-serif text-4xl font-semibold">{categories.length}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-stone-400">Публични продукти</p>
          <p className="mt-2 font-serif text-4xl font-semibold">{productCount}</p>
        </article>
      </section>

      <section className="rounded-2xl bg-white p-6 text-stone-950 sm:p-8">
        <p className="text-sm font-semibold uppercase text-moss">Една база на истината</p>
        <h2 className="mt-2 font-serif text-3xl font-semibold">Редактирай продуктите в source системата</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-650">
          Имена, категории, снимки, наличност, варианти, BG/EN SEO текстове и WooCommerce линкове се управляват само в приложението за заявки. Bansko NOW чете публикуваните данни през защитен кеширан API и не пази второ копие за редактиране.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={sourceAppUrl} target="_blank" rel="noopener noreferrer" className="admin-button admin-button-forest px-5 py-3 text-sm font-semibold">
            Отвори системата за заявки
          </a>
          <Link href="/art-studio/gallery" target="_blank" className="admin-button admin-button-secondary px-5 py-3 text-sm font-semibold">
            Виж публичната галерия
          </Link>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 text-stone-950 sm:p-8">
        <h2 className="font-serif text-3xl font-semibold">Работен процес</h2>
        <ol className="mt-5 grid list-decimal gap-3 pl-5 text-sm leading-7 text-stone-700">
          <li>Създай или редактирай продукта и неговата категория в source системата.</li>
          <li>Включи продукта в киоск категория и го публикувай за Bansko NOW.</li>
          <li>Попълни отделните BG и EN заглавия, slug, описания, alt текст и SEO полета.</li>
          <li>Добави WooCommerce линк, когато продуктът вече се предлага онлайн.</li>
          <li>Промяната се появява автоматично в Bansko NOW след обновяване на кеша, обичайно до 15 минути.</li>
          <li>Потвърдена заявка от Bansko NOW влиза в общата работна опашка и остава видима и в отделния таб Bansko NOW.</li>
        </ol>
        <p className="mt-6 rounded-xl bg-sage/50 p-4 text-sm leading-6 text-forest">
          Не качвай същата снимка повторно в Bansko NOW. Сайтът използва оригиналния URL и кешира оптимизираните размери през Vercel, което пази Supabase egress нисък.
        </p>
      </section>
    </div>
  );
}
