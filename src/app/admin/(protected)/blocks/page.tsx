import Link from "next/link";
import { deleteArticleBlockAction, saveArticleBlockAction } from "@/app/admin/block-actions";
import { articleToggleKeys, defaultArticleBlocks, manualBlockPlacement, mergeWithDefaultBlocks, renderArticleBlock } from "@/lib/article-blocks";
import { getSiteSettings } from "@/lib/content";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ArticleBlock } from "@/lib/types";

type SearchParams = Promise<{ saved?: string; error?: string }>;

const fieldClass = "w-full rounded-xl border border-[var(--admin-line)] bg-white px-3 py-2 text-sm text-stone-950";
const codeClass = "w-full rounded-xl border border-[var(--admin-line)] bg-white px-3 py-2 font-mono text-xs leading-5 text-stone-950";
const labelClass = "grid gap-1 text-xs font-semibold text-stone-700";

const toggleLabels: Record<(typeof articleToggleKeys)[number], string> = {
  show_art_studio_block: "Под статията, когато е отметнат „Art Studio“",
  show_bansko_collection_block: "Под статията, когато е отметнат „Bansko Collection“",
  show_facebook_cta: "Под статията, когато е отметнат „Facebook общност“"
};

/** The "where does it appear" select, shared by the edit forms and the new block form. */
function PlacementSelect({ value }: { value: string | null }) {
  return (
    <select name="article_toggle" defaultValue={value || ""} className={fieldClass}>
      <option value={manualBlockPlacement}>Само където е сложен в текста с :::block</option>
      <option value="">Под всяка статия</option>
      {articleToggleKeys.map((key) => (
        <option key={key} value={key}>{toggleLabels[key]}</option>
      ))}
    </select>
  );
}

const classHelp: [string, string][] = [
  ["article-block", "рамката на блока: заоблена, с отстъп и сянка; добави --cream (светъл), --forest (зелен, бял текст), --dark (тъмен, бял текст) или --sage"],
  ["article-block__eyebrow", "малкият надпис над заглавието"],
  ["article-block__title", "заглавието (serif)"],
  ["article-block__text", "абзац под заглавието"],
  ["article-block__split", "две колони: текст вляво, бутон или списък вдясно (на телефон една под друга)"],
  ["article-block__tiles + article-block__tile", "решетка от плочки с икона и надпис, всяка е линк; при посочване става зелена с бял текст"],
  ["article-block__actions + article-block__button", "ред с бутони; бутонът е --primary (зелен), --light (бял) или --ghost (само рамка)"],
  ["article-block__chips + article-block__chip", "малки етикети в решетка"]
];

const tokenHelp: [string, string][] = [
  ["{{path:/art-studio}}", "адрес в сайта; на английската страница сам става /en/art-studio"],
  ["{{icon:shirt}}", "икона от Font Awesome: shirt, image, mug-hot, church, palette, bag-shopping, facebook, mountain, heart, users, newspaper, store…"],
  ["{{facebook_group_url}}", "адресът на Facebook групата от „Меню и хедър“"]
];

function savedMessage(value?: string) {
  if (value === "reset") return "Блокът е върнат към стандартния вид.";
  if (value === "deleted") return "Блокът е изтрит.";
  return `Блокът „${value}“ е запазен. Страниците се обновяват до няколко секунди.`;
}

/** Admin "Блокове": the HTML blocks under the articles and on the main pages, BG and EN, with a live preview. */
export default async function ArticleBlocksAdminPage({ searchParams }: { searchParams: SearchParams }) {
  const { saved, error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [rows, settings] = await Promise.all([
    supabase ? supabase.from("article_blocks").select("*").order("sort_order", { ascending: true }) : Promise.resolve({ data: [] as ArticleBlock[] }),
    getSiteSettings("bg")
  ]);
  const blocks = mergeWithDefaultBlocks((rows.data ?? []) as ArticleBlock[]);
  const defaultKeys = new Set(defaultArticleBlocks.map((block) => block.key));

  return (
    <div className="grid gap-8">
      <div className="grid gap-4">
        <p className="text-sm font-semibold uppercase text-[var(--admin-muted)]">Статии и страници</p>
        <h1 className="font-serif text-4xl font-semibold">Блокове под статията</h1>
        <p className="max-w-3xl text-sm leading-6 text-[var(--admin-muted)]">
          Всеки блок е парче HTML на български и английски. Влиза в статия по два начина: под статията (според „Къде излиза“ – с отметка в
          настройките на статията или под всяка статия) или на избрано място в текста с трите реда <code>:::block</code>,{" "}
          <code>key: име_на_блока</code>, <code>:::</code>. Стандартните са и на главните страници. Пишеш HTML с готовите класове отдолу, за да
          изглежда като останалата част от сайта; кажи ми какво искаш и ще ти дам кода. Стъпките са в{" "}
          <Link href="/admin/guide" className="font-semibold text-forest underline underline-offset-4">Инструкции</Link>, раздел 15.
        </p>
      </div>

      {saved ? <div className="max-w-3xl rounded-2xl border border-sage/40 bg-sage/15 p-4 text-sm font-semibold text-stone-950">{savedMessage(saved)}</div> : null}
      {error ? <div className="max-w-3xl rounded-2xl border border-red-300 bg-red-100 p-4 text-sm font-semibold text-red-900">{error}</div> : null}

      {blocks.map((block) => {
        const stored = Boolean(block.id);
        const preview = renderArticleBlock(block, "bg", { facebook_group_url: settings.facebook_group_url });
        return (
          <section key={block.key} className="grid gap-5 rounded-2xl border border-[var(--admin-line)] bg-[var(--admin-panel)] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl font-semibold">{block.title}</h2>
                <p className="mt-1 text-xs text-[var(--admin-muted)]">
                  ключ <code>{block.key}</code>
                  {stored ? "" : " · стандартен блок от кода, още не е променян"}
                  {block.is_active ? "" : " · изключен"}
                </p>
                <p className="mt-1 text-xs text-[var(--admin-muted)]">
                  В текста на статия: <code>{`:::block`}</code> <code>{`key: ${block.key}`}</code> <code>{`:::`}</code> (три реда)
                </p>
              </div>
              {stored ? (
                <form action={deleteArticleBlockAction}>
                  <input type="hidden" name="key" value={block.key} />
                  <button type="submit" className="admin-button admin-button-danger px-3 py-1.5 text-xs font-semibold">
                    {defaultKeys.has(block.key) ? "Върни стандартния" : "Изтрий"}
                  </button>
                </form>
              ) : null}
            </div>

            <form action={saveArticleBlockAction} className="grid gap-4">
              <input type="hidden" name="key" value={block.key} />
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_120px_auto]">
                <label className={labelClass}>
                  Име (само за админа)
                  <input name="title" defaultValue={block.title} className={fieldClass} required />
                </label>
                <label className={labelClass}>
                  Къде излиза
                  <PlacementSelect value={block.article_toggle} />
                </label>
                <label className={labelClass}>
                  Ред
                  <input name="sort_order" type="number" defaultValue={block.sort_order} className={fieldClass} />
                </label>
                <label className="flex items-center gap-2 pt-5 text-sm font-semibold text-stone-700">
                  <input name="is_active" type="checkbox" defaultChecked={block.is_active} className="h-4 w-4" />
                  Активен
                </label>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                <label className={labelClass}>
                  HTML на български
                  <textarea name="html_bg" defaultValue={block.html_bg} rows={16} className={codeClass} spellCheck={false} />
                </label>
                <label className={labelClass}>
                  HTML на английски
                  <textarea name="html_en" defaultValue={block.html_en} rows={16} className={codeClass} spellCheck={false} />
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button type="submit" className="admin-button admin-button-primary px-5 py-2.5 text-sm font-semibold">
                  Запази блока
                </button>
                <span className="text-xs text-[var(--admin-muted)]">Прегледът отдолу е българската версия така, както се вижда в сайта.</span>
              </div>
            </form>

            {preview ? (
              <div className="rounded-2xl bg-[var(--paper)] p-4 sm:p-6">
                <div className="site-block" dangerouslySetInnerHTML={{ __html: preview }} />
              </div>
            ) : (
              <p className="text-sm text-[var(--admin-muted)]">Празен блок – не се показва.</p>
            )}
          </section>
        );
      })}

      <section className="grid gap-4 rounded-2xl border border-[var(--admin-line)] bg-[var(--admin-panel)] p-6">
        <h2 className="font-serif text-2xl font-semibold">Нов блок</h2>
        <p className="text-sm leading-6 text-[var(--admin-muted)]">
          Ключът се прави сам от името (латиница, долни черти). Нов блок по подразбиране излиза само където го сложиш в текста на статия с
          трите реда <code>:::block</code> / <code>key: …</code> / <code>:::</code>; от „Къде излиза“ може да стане общ за всички статии.
        </p>
        <form action={saveArticleBlockAction} className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_120px]">
            <label className={labelClass}>
              Име
              <input name="title" className={fieldClass} placeholder="Например: Абонамент за бюлетина" required />
            </label>
            <label className={labelClass}>
              Ключ (по желание)
              <input name="key" className={fieldClass} placeholder="newsletter" />
            </label>
            <label className={labelClass}>
              Къде излиза
              <PlacementSelect value={manualBlockPlacement} />
            </label>
            <label className={labelClass}>
              Ред
              <input name="sort_order" type="number" defaultValue={40} className={fieldClass} />
            </label>
          </div>
          <input type="hidden" name="is_active" value="on" />
          <div className="grid gap-3 lg:grid-cols-2">
            <label className={labelClass}>
              HTML на български
              <textarea name="html_bg" rows={10} className={codeClass} spellCheck={false} placeholder={`<section class="article-block article-block--sage">\n  <p class="article-block__eyebrow">Малък надпис</p>\n  <h2 class="article-block__title">Заглавие</h2>\n  <p class="article-block__text">Текст.</p>\n  <div class="article-block__actions">\n    <a class="article-block__button article-block__button--primary" href="{{path:/articles}}">Бутон</a>\n  </div>\n</section>`} />
            </label>
            <label className={labelClass}>
              HTML на английски
              <textarea name="html_en" rows={10} className={codeClass} spellCheck={false} />
            </label>
          </div>
          <button type="submit" className="admin-button admin-button-primary w-fit px-5 py-2.5 text-sm font-semibold">
            Добави блока
          </button>
        </form>
      </section>

      <section className="grid gap-4 rounded-2xl border border-[var(--admin-line)] bg-[var(--admin-panel)] p-6">
        <h2 className="font-serif text-2xl font-semibold">Как се пише блок</h2>
        <p className="text-sm leading-6 text-[var(--admin-muted)]">
          Използвай тези класове, за да е блокът в стила на сайта; скриптове и формуляри се премахват при запис. Пълното описание е в{" "}
          <Link href="/admin/guide" className="font-semibold text-forest underline underline-offset-4">Инструкции</Link>.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-[var(--admin-muted)]"><th className="pb-2">Клас</th><th className="pb-2">Какво прави</th></tr></thead>
            <tbody>
              {classHelp.map(([name, text]) => (
                <tr key={name} className="border-t border-[var(--admin-line)] align-top"><td className="py-2 pr-3"><code>{name}</code></td><td className="py-2">{text}</td></tr>
              ))}
            </tbody>
          </table>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-[var(--admin-muted)]"><th className="pb-2">Маркер</th><th className="pb-2">Какво става с него</th></tr></thead>
            <tbody>
              {tokenHelp.map(([name, text]) => (
                <tr key={name} className="border-t border-[var(--admin-line)] align-top"><td className="py-2 pr-3"><code>{name}</code></td><td className="py-2">{text}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
