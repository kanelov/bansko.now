import { cache } from "react";
import { iconSvgMarkup } from "@/components/public/icon-glyph";
import { localePath } from "@/lib/i18n";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import type { ArticleBlock, Locale } from "@/lib/types";

/**
 * HTML blocks under the articles and on the main pages: Art Studio, Bansko Collection, the Facebook
 * community and any custom block the owner adds. Each block is plain HTML per language, written with
 * the `.article-block*` classes from `globals.css` and three small tokens that are resolved here:
 *
 *   {{path:/art-studio}}      -> the localized path (/en/art-studio on the English page)
 *   {{icon:shirt}}            -> an inline Font Awesome icon (same names as the site menu icons)
 *   {{facebook_group_url}}    -> the group address from the site settings
 *
 * The three built in blocks exist as defaults in code, so the site renders even with an empty table;
 * a saved row with the same key replaces the default, deleting the row brings the default back.
 */

export const articleToggleKeys = ["show_art_studio_block", "show_bansko_collection_block", "show_facebook_cta"] as const;
export type ArticleToggleKey = (typeof articleToggleKeys)[number];

/** `article_toggle` value for a block that appears only where `:::block` places it in the text. */
export const manualBlockPlacement = "manual";

export function isArticleToggleKey(value: unknown): value is ArticleToggleKey {
  return typeof value === "string" && (articleToggleKeys as readonly string[]).includes(value);
}

export type ArticleBlockPreview = { key: string; toggle: ArticleToggleKey | null; html: Record<Locale, string> };

const artStudioBg = `<section class="article-block article-block--cream">
  <p class="article-block__eyebrow">Art Studio Банско</p>
  <h2 class="article-block__title">Направи си нещо свое от Банско</h2>
  <p class="article-block__text">Тениски, fine art принтове, чаши и икони по поръчка – със собствен дизайн, с твоя снимка или с кадър от Пирин. Печатаме в Банско и потвърждаваме всяка поръчка лично.</p>
  <div class="article-block__tiles">
    <a class="article-block__tile" href="{{path:/art-studio/teniski-po-porachka}}">{{icon:shirt}}<span>Тениски по поръчка</span></a>
    <a class="article-block__tile" href="{{path:/art-studio/fine-art-printove}}">{{icon:image}}<span>Fine Art принтове</span></a>
    <a class="article-block__tile" href="{{path:/art-studio/chashi-i-termosi}}">{{icon:mug-hot}}<span>Чаши и термоси</span></a>
    <a class="article-block__tile" href="{{path:/art-studio/ikoni}}">{{icon:church}}<span>Икони</span></a>
  </div>
  <div class="article-block__actions">
    <a class="article-block__button article-block__button--primary" href="{{path:/art-studio}}">{{icon:palette}}Виж Art Studio</a>
    <a class="article-block__button article-block__button--ghost" href="{{path:/art-studio/gallery}}">{{icon:bag-shopping}}Готовите продукти в галерията</a>
  </div>
</section>`;

const artStudioEn = `<section class="article-block article-block--cream">
  <p class="article-block__eyebrow">Art Studio Bansko</p>
  <h2 class="article-block__title">Make something of your own from Bansko</h2>
  <p class="article-block__text">Custom t-shirts, fine art prints, mugs and icons – with your own design, your photo or a shot of Pirin. Printed in Bansko, every order confirmed personally.</p>
  <div class="article-block__tiles">
    <a class="article-block__tile" href="{{path:/art-studio/custom-tshirts}}">{{icon:shirt}}<span>Custom T-shirts</span></a>
    <a class="article-block__tile" href="{{path:/art-studio/fine-art-prints}}">{{icon:image}}<span>Fine Art Prints</span></a>
    <a class="article-block__tile" href="{{path:/art-studio/mugs-and-drinkware}}">{{icon:mug-hot}}<span>Mugs and Drinkware</span></a>
    <a class="article-block__tile" href="{{path:/art-studio/icons}}">{{icon:church}}<span>Icons</span></a>
  </div>
  <div class="article-block__actions">
    <a class="article-block__button article-block__button--primary" href="{{path:/art-studio}}">{{icon:palette}}View Art Studio</a>
    <a class="article-block__button article-block__button--ghost" href="{{path:/art-studio/gallery}}">{{icon:bag-shopping}}Ready products in the gallery</a>
  </div>
</section>`;

const collectionBg = `<section class="article-block article-block--dark">
  <div class="article-block__split">
    <div>
      <p class="article-block__eyebrow">Вдъхновено от Банско</p>
      <h2 class="article-block__title">Bansko Collection</h2>
      <p class="article-block__text">Авторски продукти за хората, които искат да отнесат част от Банско със себе си.</p>
    </div>
    <div>
      <div class="article-block__chips">
        <span class="article-block__chip">Тениски</span>
        <span class="article-block__chip">Чаши</span>
        <span class="article-block__chip">Постери</span>
        <span class="article-block__chip">Фото принтове</span>
      </div>
      <div class="article-block__actions">
        <a class="article-block__button article-block__button--light" href="{{path:/bansko-collection}}">Разгледай колекцията</a>
      </div>
    </div>
  </div>
</section>`;

const collectionEn = `<section class="article-block article-block--dark">
  <div class="article-block__split">
    <div>
      <p class="article-block__eyebrow">Inspired by Bansko</p>
      <h2 class="article-block__title">Bansko Collection</h2>
      <p class="article-block__text">Original products for people who want to take a part of Bansko with them.</p>
    </div>
    <div>
      <div class="article-block__chips">
        <span class="article-block__chip">T-shirts</span>
        <span class="article-block__chip">Mugs</span>
        <span class="article-block__chip">Posters</span>
        <span class="article-block__chip">Photo prints</span>
      </div>
      <div class="article-block__actions">
        <a class="article-block__button article-block__button--light" href="{{path:/bansko-collection}}">Explore the collection</a>
      </div>
    </div>
  </div>
</section>`;

const facebookBg = `<section id="community" class="article-block article-block--forest">
  <div class="article-block__split">
    <div>
      <p class="article-block__eyebrow">Общност</p>
      <h2 class="article-block__title">Присъедини се към общността</h2>
      <p class="article-block__text">Имаш събитие, снимка, препоръка или въпрос за Банско? Сподели го в Bansko NOW | Живот в Банско.</p>
    </div>
    <a class="article-block__button article-block__button--light" href="{{facebook_group_url}}">{{icon:facebook}}Към Facebook групата</a>
  </div>
</section>`;

const facebookEn = `<section id="community" class="article-block article-block--forest">
  <div class="article-block__split">
    <div>
      <p class="article-block__eyebrow">Community</p>
      <h2 class="article-block__title">Join the community</h2>
      <p class="article-block__text">Have an event, photo, recommendation or question about Bansko? Share it with the Bansko NOW community.</p>
    </div>
    <a class="article-block__button article-block__button--light" href="{{facebook_group_url}}">{{icon:facebook}}Open the Facebook group</a>
  </div>
</section>`;

/** Built in blocks. `id` is empty until the owner saves a row for the key. */
export const defaultArticleBlocks: ArticleBlock[] = [
  { id: "", key: "art_studio", title: "Art Studio", html_bg: artStudioBg, html_en: artStudioEn, is_active: true, sort_order: 10, article_toggle: "show_art_studio_block", created_at: "", updated_at: "" },
  { id: "", key: "collection", title: "Bansko Collection", html_bg: collectionBg, html_en: collectionEn, is_active: true, sort_order: 20, article_toggle: "show_bansko_collection_block", created_at: "", updated_at: "" },
  { id: "", key: "facebook", title: "Facebook общност", html_bg: facebookBg, html_en: facebookEn, is_active: true, sort_order: 30, article_toggle: "show_facebook_cta", created_at: "", updated_at: "" }
];

/** Owner authored HTML; scripts, embeds, forms and inline event handlers are still stripped as a guard. */
export function sanitizeBlockHtml(html: string) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?(script|iframe|object|embed|form|input|textarea|select|button|link|meta|base)\b[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(href|src|action|xlink:href)\s*=\s*(["']?)\s*javascript:[^"'\s>]*\2/gi, ' $1="#"');
}

export type BlockRenderValues = { facebook_group_url?: string | null };

/** Resolves the tokens for one language and returns HTML that is safe to inject. */
export function renderArticleBlock(block: Pick<ArticleBlock, "html_bg" | "html_en">, locale: Locale, values: BlockRenderValues = {}) {
  const source = locale === "en" ? block.html_en || block.html_bg : block.html_bg || block.html_en;
  const html = sanitizeBlockHtml(source)
    .replace(/\{\{\s*path:\s*([^}]+?)\s*\}\}/g, (_match, path: string) => localePath(locale, path.trim()))
    .replace(/\{\{\s*icon:\s*([a-z0-9-]+)\s*\}\}/gi, (_match, name: string) => iconSvgMarkup(name, "article-block__icon"))
    .replace(/\{\{\s*facebook_group_url\s*\}\}/g, values.facebook_group_url || "#");
  return html.trim();
}

/** Stored rows first, then the defaults for keys that have no row yet; ordered for display. */
export function mergeWithDefaultBlocks(rows: ArticleBlock[]) {
  const byKey = new Map(rows.map((row) => [row.key, row]));
  const merged = [...rows, ...defaultArticleBlocks.filter((block) => !byKey.has(block.key))];
  return merged.sort((a, b) => a.sort_order - b.sort_order || a.key.localeCompare(b.key));
}

/** Active blocks for the public pages: one small query per render, defaults fill the gaps. */
export const getArticleBlocks = cache(async (): Promise<ArticleBlock[]> => {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return defaultArticleBlocks;

  const { data } = await supabase
    .from("article_blocks")
    .select("id,key,title,html_bg,html_en,is_active,sort_order,article_toggle,created_at,updated_at")
    .order("sort_order", { ascending: true });

  // Anonymous reads only see active rows; an inactive default therefore falls back to the default,
  // which is why the admin page reads through the authenticated client instead.
  return mergeWithDefaultBlocks((data ?? []) as ArticleBlock[]).filter((block) => block.is_active);
});

/** Blocks pre-rendered for both languages, for the editor preview. */
export async function getArticleBlockPreviews(values: BlockRenderValues = {}): Promise<ArticleBlockPreview[]> {
  const blocks = await getArticleBlocks();
  return blocks.map((block) => ({
    key: block.key,
    toggle: isArticleToggleKey(block.article_toggle) ? block.article_toggle : null,
    html: { bg: renderArticleBlock(block, "bg", values), en: renderArticleBlock(block, "en", values) }
  }));
}
