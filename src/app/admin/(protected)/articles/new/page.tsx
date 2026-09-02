import { ArticleEditorForm } from "@/components/admin/article-editor-form";
import { getCategories, getMediaItems, getSiteSettings } from "@/lib/content";
import { isLocale } from "@/lib/i18n";

type SearchParams = Promise<{ error?: string; locale?: string; translation_group_id?: string }>;

export default async function NewArticlePage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const locale = query.locale && isLocale(query.locale) ? query.locale : "bg";
  const [categories, mediaItems, settings] = await Promise.all([getCategories(locale, { includeHidden: true }), getMediaItems(12), getSiteSettings(locale)]);

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-sm font-semibold uppercase text-[var(--admin-muted)]">{locale === "en" ? "English version" : "Българска версия"}</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold">Create article</h1>
      </div>
      {query.error ? (
        <div className="rounded-2xl border border-red-300 bg-red-100 p-4 text-sm font-semibold text-red-900">
          {query.error}
        </div>
      ) : null}
      <ArticleEditorForm categories={categories} mediaItems={mediaItems} locale={locale} translationGroupId={query.translation_group_id || ""} settings={settings} />
    </div>
  );
}
