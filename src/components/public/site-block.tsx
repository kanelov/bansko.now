import { getArticleBlocks, renderArticleBlock } from "@/lib/article-blocks";
import type { Locale, SiteSettings } from "@/lib/types";

/** One HTML block by key (art_studio, collection, facebook, …) on a public page. Renders nothing when the block is off. */
export async function SiteBlock({ name, locale, settings }: { name: string; locale: Locale; settings?: Pick<SiteSettings, "facebook_group_url"> | null }) {
  const blocks = await getArticleBlocks();
  const block = blocks.find((entry) => entry.key === name && entry.is_active);
  if (!block) return null;

  const html = renderArticleBlock(block, locale, { facebook_group_url: settings?.facebook_group_url });
  if (!html) return null;

  return <div className="site-block" dangerouslySetInnerHTML={{ __html: html }} />;
}
