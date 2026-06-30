import { saveSettingsAction } from "@/app/admin/actions";
import { getSiteSettings } from "@/lib/content";

function fieldClass() {
  return "w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-sm text-stone-950";
}

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-sm font-semibold uppercase text-stone-400">Configuration</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold">Settings</h1>
      </div>
      <form action={saveSettingsAction} className="grid max-w-3xl gap-6 rounded-2xl border border-white/10 bg-white/5 p-6">
        {settings.id !== "fallback" ? <input type="hidden" name="id" value={settings.id} /> : null}
        <section className="grid gap-5">
          <h2 className="font-serif text-2xl font-semibold">General</h2>
          <label className="grid gap-2 text-sm font-semibold">
            Site name
            <input name="site_name" defaultValue={settings.site_name || "Bansko NOW"} className={fieldClass()} />
          </label>
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
          <h2 className="font-serif text-2xl font-semibold">Homepage hero media</h2>
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
            <input name="hero_video_url" defaultValue={settings.hero_video_url || ""} className={fieldClass()} placeholder="https://.../bansko-hero.mp4" />
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
            <input name="hero_embed_url" defaultValue={settings.hero_embed_url || ""} className={fieldClass()} placeholder="https://www.youtube.com/embed/..." />
          </label>
        </section>

        <section className="grid gap-5 border-t border-white/10 pt-6">
          <h2 className="font-serif text-2xl font-semibold">Social links</h2>
          <label className="grid gap-2 text-sm font-semibold">
            Facebook group URL
            <input name="facebook_group_url" defaultValue={settings.facebook_group_url || ""} className={fieldClass()} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Instagram URL
            <input name="instagram_url" defaultValue={settings.instagram_url || ""} className={fieldClass()} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            YouTube URL
            <input name="youtube_url" defaultValue={settings.youtube_url || ""} className={fieldClass()} />
          </label>
        </section>

        <button className="w-fit rounded-full bg-white px-6 py-3 text-sm font-semibold text-stone-950 shadow-sm transition hover:bg-stone-100">
          Save settings
        </button>
      </form>
    </div>
  );
}
