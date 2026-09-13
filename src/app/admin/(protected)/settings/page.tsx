import { saveSettingsAction } from "@/app/admin/actions";
import { getSiteSettings } from "@/lib/content";

function fieldClass() {
  return "w-full rounded-xl border border-[var(--admin-line)] bg-white px-4 py-3 text-sm text-stone-950";
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
        <p className="text-sm font-semibold uppercase text-[var(--admin-muted)]">Configuration</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold">Settings</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--admin-muted)]">
          Блоковете под статията и снимките по подразбиране имат свои страници в страничното меню: „Блокове“ и „Снимки по подразбиране“.
        </p>
      </div>
      {params.saved ? (
        <div className="max-w-3xl rounded-2xl border border-sage/40 bg-sage/15 p-4 text-sm font-semibold text-stone-50">
          Settings са запазени.
        </div>
      ) : null}
      {params.error ? (
        <div className="max-w-3xl rounded-2xl border border-red-300 bg-red-100 p-4 text-sm font-semibold text-red-900">
          {params.error}
        </div>
      ) : null}
      <form action={saveSettingsAction} className="grid max-w-3xl gap-6 rounded-2xl border border-[var(--admin-line)] bg-[var(--admin-panel)] p-6">
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


        <section className="grid gap-5 border-t border-[var(--admin-line)] pt-6">
          <div>
            <p className="text-sm font-semibold uppercase text-[var(--admin-muted)]">English</p>
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
        </section>

        <section className="grid gap-5 border-t border-[var(--admin-line)] pt-6">
          <h2 className="font-serif text-2xl font-semibold">Homepage hero media</h2>
          <p className="text-sm leading-6 text-[var(--admin-muted)]">
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
