import { getArticleBlocks, isArticleToggleKey, renderArticleBlock } from "@/lib/article-blocks";
import type { ArticleWithCategory, Locale, SiteSettings } from "@/lib/types";

/**
 * The blocks under one article, in their order. A block tied to an article switch
 * (show_art_studio_block, show_bansko_collection_block, show_facebook_cta) follows that switch;
 * custom blocks without a switch appear under every article while they are active.
 */
export async function ArticleBlocks({ article, locale, settings }: { article: ArticleWithCategory; locale: Locale; settings?: Pick<SiteSettings, "facebook_group_url"> | null }) {
  const blocks = await getArticleBlocks();
  const visible = blocks.filter((block) => {
    if (!block.is_active) return false;
    if (isArticleToggleKey(block.article_toggle)) return article[block.article_toggle] !== false;
    return true;
  });

  return (
    <>
      {visible.map((block) => {
        const html = renderArticleBlock(block, locale, { facebook_group_url: settings?.facebook_group_url });
        return html ? <div key={block.key} className="site-block" dangerouslySetInnerHTML={{ __html: html }} /> : null;
      })}
    </>
  );
}
