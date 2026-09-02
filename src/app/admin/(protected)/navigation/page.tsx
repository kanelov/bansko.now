import Link from "next/link";
import { saveHeaderSettingsAction } from "@/app/admin/actions";
import { NavigationItemsEditor, SocialLinksEditor } from "@/components/admin/navigation-editor";
import { getAllNavigationItems, getAllSocialLinks, getSiteSettings } from "@/lib/content";

type SearchParams = Promise<{ saved?: string; error?: string }>;

const fieldClass = "w-full rounded-xl border border-[var(--admin-line)] bg-white px-4 py-3 text-sm text-stone-950";

function savedMessage(value?: string) {
  if (value === "menu") return "Главното меню е запазено.";
  if (value === "social") return "Социалните икони са запазени.";
  return "Логото, общността и бутонът „Подкрепи ни“ са запазени.";
}

export default async function AdminNavigationPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const [settings, englishSettings, navigationItems, englishNavigationItems] = await Promise.all([
    getSiteSettings("bg"),
    getSiteSettings("en"),
    getAllNavigationItems("bg"),
    getAllNavigationItems("en")
  ]);
  const socialLinks = await getAllSocialLinks(settings);

  return (
    <div className="grid max-w-6xl gap-8">
      <header>
        <p className="text-sm font-semibold uppercase text-[var(--admin-muted)]">Site chrome</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold">Меню и хедър</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--admin-muted)]">
          Управлявай логото, навигацията, социалните икони и бутона за подкрепа от едно място. Търсенето и смяната на езика остават системни контроли.
        </p>
      </header>

      {params.saved ? (
        <div className="rounded-2xl border border-sage/40 bg-sage/15 p-4 text-sm font-semibold text-stone-50">{savedMessage(params.saved)}</div>
      ) : null}
      {params.error ? (
        <div className="rounded-2xl border border-red-300 bg-red-100 p-4 text-sm font-semibold text-red-900">{params.error}</div>
      ) : null}

      <section className="grid gap-5 rounded-2xl border border-[var(--admin-line)] bg-[var(--admin-panel)] p-6">
        <div>
          <p className="text-sm font-semibold uppercase text-[var(--admin-muted)]">Brand and support</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">Лого и „Подкрепи ни“</h2>
        </div>
        <form action={saveHeaderSettingsAction} className="grid gap-6">
          {settings.id !== "fallback" ? <input type="hidden" name="id" value={settings.id} /> : null}

          <div className="grid gap-5 rounded-2xl border border-[var(--admin-line)] bg-black/10 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                Име на сайта / текстово лого
                <input name="site_name" defaultValue={settings.site_name || "Bansko NOW"} className={fieldClass} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                URL на графично лого
                <input type="url" name="logo_image_url" defaultValue={settings.logo_image_url || ""} className={fieldClass} placeholder="https://..." />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-semibold">
              Alt текст на логото
              <input name="logo_image_alt" defaultValue={settings.logo_image_alt || settings.site_name || "Bansko NOW"} className={fieldClass} />
            </label>
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[var(--admin-line)] bg-[var(--admin-panel)] p-4">
              <span className="text-xs font-semibold uppercase text-[var(--admin-muted)]">Преглед</span>
              {settings.logo_image_url ? (
                <img src={settings.logo_image_url} alt={settings.logo_image_alt || settings.site_name || "Bansko NOW"} width={180} height={48} className="h-10 w-auto max-w-44 object-contain" />
              ) : (
                <span className="font-serif text-2xl font-semibold text-[var(--admin-ink)]">{settings.site_name || "Bansko NOW"}</span>
              )}
              <Link href="/admin/media" className="admin-button admin-button-secondary ml-auto px-4 py-2 text-sm font-semibold">
                Отвори Медия
              </Link>
            </div>
            <p className="text-xs leading-5 text-[var(--admin-muted)]">Остави URL полето празно, за да се използва текстовото лого. Изображението се показва с фиксирана височина, за да няма разместване на страницата.</p>
          </div>

          <div className="grid gap-5 rounded-2xl border border-[var(--admin-line)] bg-black/10 p-5">
            <div>
              <h3 className="font-serif text-2xl font-semibold">Подкрепи Bansko NOW</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--admin-muted)]">Този бутон стои до социалните икони и отваря картата за доброволна подкрепа.</p>
            </div>
            <label className="choice-row cursor-pointer rounded-xl border border-[var(--admin-line)] bg-[var(--admin-panel)] p-4 text-sm font-semibold">
              <input className="choice-control" type="checkbox" name="support_enabled" defaultChecked={settings.support_enabled ?? true} />
              <span>Показвай бутона „Подкрепи ни“</span>
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                Текст на бутона
                <input name="support_button_label" defaultValue={settings.support_button_label || "Подкрепи ни"} className={fieldClass} maxLength={24} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                English button
                <input name="support_button_label_en" defaultValue={englishSettings.support_button_label || "Support us"} className={fieldClass} maxLength={24} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Заглавие на картата
                <input name="support_title" defaultValue={settings.support_title || "Подкрепи Bansko NOW"} className={fieldClass} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                English title
                <input name="support_title_en" defaultValue={englishSettings.support_title || "Support Bansko NOW"} className={fieldClass} />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                Текст на картата
                <textarea name="support_description" defaultValue={settings.support_description || ""} className={fieldClass} rows={4} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                English description
                <textarea name="support_description_en" defaultValue={englishSettings.support_description || ""} className={fieldClass} rows={4} />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                Снимка URL
                <input type="url" name="support_image_url" defaultValue={settings.support_image_url || ""} className={fieldClass} placeholder="https://..." />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Facebook група URL
                <input type="url" name="facebook_group_url" defaultValue={settings.facebook_group_url || ""} className={fieldClass} placeholder="https://facebook.com/groups/..." />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Alt текст на снимката
                <input name="support_image_alt" defaultValue={settings.support_image_alt || ""} className={fieldClass} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                English image alt
                <input name="support_image_alt_en" defaultValue={englishSettings.support_image_alt || ""} className={fieldClass} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Stripe Payment Link
                <input type="url" name="support_stripe_url" defaultValue={settings.support_stripe_url || ""} className={fieldClass} placeholder="https://buy.stripe.com/..." />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                PayPal / PayPal.Me
                <input type="url" name="support_paypal_url" defaultValue={settings.support_paypal_url || ""} className={fieldClass} placeholder="https://paypal.me/..." />
              </label>
            </div>
          </div>

          <button className="admin-button admin-button-primary w-fit px-6 py-3 text-sm font-semibold">Запази логото и подкрепата</button>
        </form>
      </section>

      <section className="grid gap-5 rounded-2xl border border-[var(--admin-line)] bg-[var(--admin-panel)] p-6">
        <div>
          <p className="text-sm font-semibold uppercase text-[var(--admin-muted)]">Navigation</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">Главно меню</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--admin-muted)]">Поддържа вътрешни и външни линкове, BG/EN имена и реални Font Awesome икони. По-ниският номер се показва по-напред.</p>
        </div>
        <NavigationItemsEditor items={navigationItems} englishItems={englishNavigationItems} />
      </section>

      <section className="grid gap-5 rounded-2xl border border-[var(--admin-line)] bg-[var(--admin-panel)] p-6">
        <div>
          <p className="text-sm font-semibold uppercase text-[var(--admin-muted)]">Header and footer</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">Социални икони</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--admin-muted)]">Активните икони с валиден URL се показват в публичния header и footer.</p>
        </div>
        <SocialLinksEditor items={socialLinks} />
      </section>
    </div>
  );
}
