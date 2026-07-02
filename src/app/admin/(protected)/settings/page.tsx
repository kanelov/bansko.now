import { saveNavigationAction, saveSettingsAction, saveSocialLinksAction } from "@/app/admin/actions";
import { IconGlyph, menuIconOptions, socialIconOptions } from "@/components/public/icon-glyph";
import { getAllNavigationItems, getAllSocialLinks, getSiteSettings } from "@/lib/content";
import type { NavigationItem, SocialLink } from "@/lib/types";

function fieldClass() {
  return "w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-sm text-stone-950";
}

function compactFieldClass() {
  return "w-full rounded-lg border border-white/10 bg-white px-3 py-2 text-sm text-stone-950";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function MenuRow({ item, rowKey }: { item?: NavigationItem; rowKey: string }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <input type="hidden" name="navigation_row_key" value={rowKey} />
      {item?.id && isUuid(item.id) ? <input type="hidden" name={`navigation_id_${rowKey}`} value={item.id} /> : null}
      <div className="grid gap-3 lg:grid-cols-[1.1fr_1.4fr_0.85fr_0.55fr]">
        <label className="grid gap-1 text-xs font-semibold uppercase text-stone-400">
          Label
          <input name={`navigation_label_${rowKey}`} defaultValue={item?.label || ""} className={compactFieldClass()} placeholder="Събития" />
        </label>
        <label className="grid gap-1 text-xs font-semibold uppercase text-stone-400">
          Link
          <input name={`navigation_href_${rowKey}`} defaultValue={item?.href || ""} className={compactFieldClass()} placeholder="/events или https://..." />
        </label>
        <label className="grid gap-1 text-xs font-semibold uppercase text-stone-400">
          Icon
          <div className="flex items-center gap-2">
            <IconGlyph name={item?.icon_name} className="h-5 w-5 shrink-0 text-white" />
            <input
              name={`navigation_icon_name_${rowKey}`}
              defaultValue={item?.icon_name || ""}
              className={compactFieldClass()}
              list="menu-icon-options"
              placeholder="calendar-days"
            />
          </div>
        </label>
        <label className="grid gap-1 text-xs font-semibold uppercase text-stone-400">
          Order
          <input name={`navigation_sort_order_${rowKey}`} type="number" defaultValue={item?.sort_order ?? 100} className={compactFieldClass()} />
        </label>
      </div>
      <label className="grid gap-1 text-xs font-semibold uppercase text-stone-400">
        Aria label
        <input name={`navigation_aria_label_${rowKey}`} defaultValue={item?.aria_label || ""} className={compactFieldClass()} placeholder="Optional SEO/accessibility label" />
      </label>
      <div className="flex flex-wrap gap-4 text-sm text-stone-100">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name={`navigation_is_active_${rowKey}`} defaultChecked={item?.is_active ?? true} />
          Active
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name={`navigation_is_external_${rowKey}`} defaultChecked={item?.is_external ?? false} />
          External
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name={`navigation_open_in_new_tab_${rowKey}`} defaultChecked={item?.open_in_new_tab ?? false} />
          New tab
        </label>
        {item?.id && isUuid(item.id) ? (
          <label className="inline-flex items-center gap-2 text-red-200">
            <input type="checkbox" name={`navigation_delete_${rowKey}`} />
            Remove
          </label>
        ) : null}
      </div>
    </div>
  );
}

function SocialRow({ item, rowKey }: { item?: SocialLink; rowKey: string }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <input type="hidden" name="social_row_key" value={rowKey} />
      {item?.id && isUuid(item.id) ? <input type="hidden" name={`social_id_${rowKey}`} value={item.id} /> : null}
      <div className="grid gap-3 lg:grid-cols-[0.9fr_1fr_1.6fr_0.85fr_0.55fr]">
        <label className="grid gap-1 text-xs font-semibold uppercase text-stone-400">
          Platform
          <input name={`social_platform_${rowKey}`} defaultValue={item?.platform || ""} className={compactFieldClass()} placeholder="instagram" />
        </label>
        <label className="grid gap-1 text-xs font-semibold uppercase text-stone-400">
          Label
          <input name={`social_label_${rowKey}`} defaultValue={item?.label || ""} className={compactFieldClass()} placeholder="Instagram" />
        </label>
        <label className="grid gap-1 text-xs font-semibold uppercase text-stone-400">
          URL
          <input name={`social_url_${rowKey}`} defaultValue={item?.url || ""} className={compactFieldClass()} placeholder="https://..." />
        </label>
        <label className="grid gap-1 text-xs font-semibold uppercase text-stone-400">
          Icon
          <div className="flex items-center gap-2">
            <IconGlyph name={item?.icon_name || item?.platform} className="h-5 w-5 shrink-0 text-white" />
            <input
              name={`social_icon_name_${rowKey}`}
              defaultValue={item?.icon_name || item?.platform || ""}
              className={compactFieldClass()}
              list="social-icon-options"
              placeholder="instagram"
            />
          </div>
        </label>
        <label className="grid gap-1 text-xs font-semibold uppercase text-stone-400">
          Order
          <input name={`social_sort_order_${rowKey}`} type="number" defaultValue={item?.sort_order ?? 100} className={compactFieldClass()} />
        </label>
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-stone-100">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name={`social_is_active_${rowKey}`} defaultChecked={item?.is_active ?? true} />
          Active
        </label>
        {item?.id && isUuid(item.id) ? (
          <label className="inline-flex items-center gap-2 text-red-200">
            <input type="checkbox" name={`social_delete_${rowKey}`} />
            Remove
          </label>
        ) : null}
      </div>
    </div>
  );
}

type SearchParams = Promise<{ saved?: string; error?: string }>;

export default async function AdminSettingsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const settings = await getSiteSettings();
  const [navigationItems, socialLinks] = await Promise.all([getAllNavigationItems(), getAllSocialLinks(settings)]);

  return (
    <div className="grid gap-8">
      <datalist id="menu-icon-options">
        {menuIconOptions.map((icon) => (
          <option key={icon} value={icon} />
        ))}
      </datalist>
      <datalist id="social-icon-options">
        {socialIconOptions.map((icon) => (
          <option key={icon} value={icon} />
        ))}
      </datalist>
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

        <button className="admin-button admin-button-primary w-fit px-6 py-3 text-sm font-semibold">
          Save settings
        </button>
      </form>

      <form action={saveNavigationAction} className="grid max-w-5xl gap-5 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div>
          <h2 className="font-serif text-2xl font-semibold">Main menu</h2>
          <p className="mt-2 text-sm text-stone-400">
            Use Font Awesome style names like <span className="text-stone-200">calendar-days</span>, <span className="text-stone-200">mountain</span> or{" "}
            <span className="text-stone-200">fa-palette</span>.
          </p>
        </div>
        <div className="grid gap-4">
          {navigationItems.map((item, index) => (
            <MenuRow key={item.id} item={item} rowKey={`existing-${index}`} />
          ))}
          <MenuRow rowKey="new-1" />
          <MenuRow rowKey="new-2" />
        </div>
        <button className="admin-button admin-button-primary w-fit px-6 py-3 text-sm font-semibold">
          Save menu
        </button>
      </form>

      <form action={saveSocialLinksAction} className="grid max-w-5xl gap-5 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div>
          <h2 className="font-serif text-2xl font-semibold">Social links</h2>
          <p className="mt-2 text-sm text-stone-400">
            Icons appear in the public header/footer only when the link is active and has a URL.
          </p>
        </div>
        <div className="grid gap-4">
          {socialLinks.map((item, index) => (
            <SocialRow key={item.id} item={item} rowKey={`existing-${index}`} />
          ))}
          <SocialRow rowKey="new-1" />
          <SocialRow rowKey="new-2" />
        </div>
        <button className="admin-button admin-button-primary w-fit px-6 py-3 text-sm font-semibold">
          Save social links
        </button>
      </form>
    </div>
  );
}
