import { saveSettingsAction } from "@/app/admin/actions";
import { getSiteSettings } from "@/lib/content";

function fieldClass() {
  return "w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-sm text-stone-950";
}

function textAreaValue(value: string[] | null | undefined) {
  return (value ?? []).join("\n");
}

type SearchParams = Promise<{ saved?: string; error?: string }>;

export default async function AdminSettingsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const [settings, englishSettings] = await Promise.all([getSiteSettings("bg"), getSiteSettings("en")]);

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-sm font-semibold uppercase text-stone-400">Configuration</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold">Settings</h1>
      </div>
      {params.saved ? (
        <div className="max-w-3xl rounded-2xl border border-sage/40 bg-sage/15 p-4 text-sm font-semibold text-stone-50">
          Settings са запазени.
        </div>
      ) : null}
      {params.error ? (
        <div className="max-w-3xl rounded-2xl border border-red-300/40 bg-red-500/10 p-4 text-sm font-semibold text-red-100">
          {params.error}
        </div>
      ) : null}
      <form action={saveSettingsAction} className="grid max-w-3xl gap-6 rounded-2xl border border-white/10 bg-white/5 p-6">
        {settings.id !== "fallback" ? <input type="hidden" name="id" value={settings.id} /> : null}
        <section className="grid gap-5">
          <h2 className="font-serif text-2xl font-semibold">General</h2>
          <label className="grid gap-2 text-sm font-semibold">
            Site description
            <textarea name="site_description" defaultValue={settings.site_description || ""} className={fieldClass()} rows={3} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Default OG image
            <input name="default_og_image" defaultValue={settings.default_og_image || ""} className={fieldClass()} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Default author
            <input name="default_author_name" defaultValue={settings.default_author_name || "Любо Канелов"} className={fieldClass()} />
          </label>
        </section>

        <section className="grid gap-5 border-t border-white/10 pt-6">
          <div>
            <h2 className="font-serif text-2xl font-semibold">Блокове под статията</h2>
            <p className="mt-2 text-sm leading-6 text-stone-300">
              Тук редактираш общите български текстове. Във всяка статия от Settings избираш кои блокове да се покажат.
              Картите с конкретните Art Studio услуги се управляват от „Страници“ → „Art Studio“.
            </p>
          </div>
          <div className="grid gap-4 rounded-2xl border border-white/10 bg-black/10 p-4">
            <p className="text-sm font-semibold uppercase text-stone-300">Facebook общност</p>
            <div className="grid gap-4 md:grid-cols-2">
              <input name="facebook_cta_eyebrow" defaultValue={settings.facebook_cta_eyebrow || ""} className={fieldClass()} placeholder="Малък надпис" />
              <input name="facebook_cta_title" defaultValue={settings.facebook_cta_title || ""} className={fieldClass()} placeholder="Заглавие" />
            </div>
            <textarea name="facebook_cta_text" defaultValue={settings.facebook_cta_text || ""} className={fieldClass()} rows={3} placeholder="Текст" />
            <input name="facebook_cta_button_label" defaultValue={settings.facebook_cta_button_label || ""} className={fieldClass()} placeholder="Текст на бутона" />
          </div>
          <div className="grid gap-4 rounded-2xl border border-white/10 bg-black/10 p-4">
            <p className="text-sm font-semibold uppercase text-stone-300">Art Studio</p>
            <div className="grid gap-4 md:grid-cols-2">
              <input name="art_studio_block_eyebrow" defaultValue={settings.art_studio_block_eyebrow || ""} className={fieldClass()} placeholder="Малък надпис" />
              <input name="art_studio_block_title" defaultValue={settings.art_studio_block_title || ""} className={fieldClass()} placeholder="Заглавие" />
            </div>
            <textarea name="art_studio_block_text" defaultValue={settings.art_studio_block_text || ""} className={fieldClass()} rows={3} placeholder="Текст" />
            <input name="art_studio_block_button_label" defaultValue={settings.art_studio_block_button_label || ""} className={fieldClass()} placeholder="Текст на бутона" />
          </div>
          <div className="grid gap-4 rounded-2xl border border-white/10 bg-black/10 p-4">
            <p className="text-sm font-semibold uppercase text-stone-300">Bansko Collection</p>
            <div className="grid gap-4 md:grid-cols-2">
              <input name="collection_block_eyebrow" defaultValue={settings.collection_block_eyebrow || ""} className={fieldClass()} placeholder="Малък надпис" />
              <input name="collection_block_title" defaultValue={settings.collection_block_title || ""} className={fieldClass()} placeholder="Заглавие" />
            </div>
            <textarea name="collection_block_text" defaultValue={settings.collection_block_text || ""} className={fieldClass()} rows={3} placeholder="Текст" />
            <input name="collection_block_button_label" defaultValue={settings.collection_block_button_label || ""} className={fieldClass()} placeholder="Текст на бутона" />
            <label className="grid gap-2 text-sm font-semibold">
              Продуктови етикети, по един на ред
              <textarea name="collection_items" defaultValue={textAreaValue(settings.collection_items)} className={fieldClass()} rows={4} />
            </label>
          </div>
        </section>

        <section className="grid gap-5 border-t border-white/10 pt-6">
          <div>
            <p className="text-sm font-semibold uppercase text-stone-400">English</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold">English public texts</h2>
          </div>
          <label className="grid gap-2 text-sm font-semibold">
            Site description
            <textarea name="site_description_en" defaultValue={englishSettings.site_description || ""} className={fieldClass()} rows={3} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Hero image alt
            <input name="hero_image_alt_en" defaultValue={englishSettings.hero_image_alt || ""} className={fieldClass()} />
          </label>
          <div className="grid gap-4 rounded-2xl border border-white/10 bg-black/10 p-4">
            <p className="text-sm font-semibold uppercase text-stone-300">Article blocks</p>
            <div className="grid gap-3 md:grid-cols-2">
              <input name="facebook_cta_eyebrow_en" defaultValue={englishSettings.facebook_cta_eyebrow || ""} className={fieldClass()} placeholder="Community eyebrow" />
              <input name="facebook_cta_title_en" defaultValue={englishSettings.facebook_cta_title || ""} className={fieldClass()} placeholder="Community title" />
            </div>
            <textarea name="facebook_cta_text_en" defaultValue={englishSettings.facebook_cta_text || ""} className={fieldClass()} rows={3} placeholder="Community text" />
            <input name="facebook_cta_button_label_en" defaultValue={englishSettings.facebook_cta_button_label || ""} className={fieldClass()} placeholder="Community button" />
            <div className="grid gap-3 md:grid-cols-2">
              <input name="art_studio_block_eyebrow_en" defaultValue={englishSettings.art_studio_block_eyebrow || ""} className={fieldClass()} placeholder="Art Studio eyebrow" />
              <input name="art_studio_block_title_en" defaultValue={englishSettings.art_studio_block_title || ""} className={fieldClass()} placeholder="Art Studio title" />
            </div>
            <textarea name="art_studio_block_text_en" defaultValue={englishSettings.art_studio_block_text || ""} className={fieldClass()} rows={3} placeholder="Art Studio text" />
            <input name="art_studio_block_button_label_en" defaultValue={englishSettings.art_studio_block_button_label || ""} className={fieldClass()} placeholder="Art Studio button" />
            <div className="grid gap-3 md:grid-cols-2">
              <input name="collection_block_eyebrow_en" defaultValue={englishSettings.collection_block_eyebrow || ""} className={fieldClass()} placeholder="Collection eyebrow" />
              <input name="collection_block_title_en" defaultValue={englishSettings.collection_block_title || ""} className={fieldClass()} placeholder="Collection title" />
            </div>
            <textarea name="collection_block_text_en" defaultValue={englishSettings.collection_block_text || ""} className={fieldClass()} rows={3} placeholder="Collection text" />
            <input name="collection_block_button_label_en" defaultValue={englishSettings.collection_block_button_label || ""} className={fieldClass()} placeholder="Collection button" />
            <textarea name="collection_items_en" defaultValue={textAreaValue(englishSettings.collection_items)} className={fieldClass()} rows={4} placeholder="Collection items, one per line" />
          </div>
        </section>

        <section className="grid gap-5 border-t border-white/10 pt-6">
          <h2 className="font-serif text-2xl font-semibold">Homepage hero media</h2>
          <p className="text-sm leading-6 text-stone-300">
            За най-чист hero без YouTube controls използвай Hosted video: качи кратък MP4/WebM файл в Media и постави публичния URL тук.
            YouTube/Vimeo embed работи, но платформата може да покаже собствен loading/chrome за момент.
          </p>
          <label className="grid gap-2 text-sm font-semibold">
            Hero media type
            <select name="hero_media_type" defaultValue={settings.hero_media_type || "image"} className={fieldClass()}>
              <option value="image">Image</option>
              <option value="video">Hosted video</option>
              <option value="embed">Embed</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Hero image URL
            <input name="hero_image_url" defaultValue={settings.hero_image_url || settings.default_og_image || ""} className={fieldClass()} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Hero image alt text
            <input name="hero_image_alt" defaultValue={settings.hero_image_alt || "Банско и Пирин"} className={fieldClass()} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Hosted video URL
            <input name="hero_video_url" defaultValue={settings.hero_video_url || ""} className={fieldClass()} placeholder="MP4/WebM URL или YouTube/Vimeo URL" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Video poster URL
            <input
              name="hero_video_poster_url"
              defaultValue={settings.hero_video_poster_url || settings.hero_image_url || settings.default_og_image || ""}
              className={fieldClass()}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Embed URL
            <input name="hero_embed_url" defaultValue={settings.hero_embed_url || ""} className={fieldClass()} placeholder="YouTube, Vimeo или /embed/ URL" />
          </label>
        </section>

        <button className="admin-button admin-button-primary w-fit px-6 py-3 text-sm font-semibold">
          Save settings
        </button>
      </form>

    </div>
  );
}
