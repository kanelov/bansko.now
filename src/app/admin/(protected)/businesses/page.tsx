import {
  approveBusinessAction,
  deleteBusinessAction,
  markContactMessageAction,
  saveBusinessDirectorySettingsAction,
  updateBusinessAction,
  upsertBusinessPlanAction
} from "@/app/admin/business-actions";
import {
  businessCategories,
  businessFeatures,
  businessServices,
  getAdminBusinesses,
  getBusinessDirectorySettings,
  getBusinessListingPlans,
  getContactMessages
} from "@/lib/businesses";
import {
  businessPaymentStatusLabels,
  businessStatusLabels,
  businessTierLabels,
  getBusinessTierLabel
} from "@/lib/business-plan-labels";

type SearchParams = Promise<{ saved?: string; approved?: string; deleted?: string; error?: string }>;

function textAreaValue(value: string[] | null | undefined) {
  return (value ?? []).join("\n");
}

function faqTextAreaValue(value: unknown) {
  return Array.isArray(value)
    ? value
        .map((item) => {
          if (!item || typeof item !== "object") {
            return "";
          }

          const record = item as Record<string, unknown>;
          const question = typeof record.question === "string" ? record.question.trim() : "";
          const answer = typeof record.answer === "string" ? record.answer.trim() : "";
          return question && answer ? `${question} | ${answer}` : "";
        })
        .filter(Boolean)
        .join("\n")
    : "";
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("bg-BG") : "—";
}

export default async function AdminBusinessesPage({ searchParams }: { searchParams: SearchParams }) {
  const [params, businesses, plans, settings, messages] = await Promise.all([
    searchParams,
    getAdminBusinesses(),
    getBusinessListingPlans({ includeInactive: true }),
    getBusinessDirectorySettings(),
    getContactMessages()
  ]);
  const annualPlans = plans.filter((plan) => plan.period_months === 12);

  return (
    <div className="grid gap-10">
      <header>
        <p className="text-sm font-semibold uppercase text-stone-400">Местен каталог</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold">Бизнес каталог</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-300">
          Управлявай бизнес заявки, годишни нива за видимост, позиции на картата, Stripe линкове и контактни съобщения.
        </p>
      </header>

      {params.saved || params.approved || params.deleted ? (
        <div className="rounded-2xl border border-sage/40 bg-sage/15 p-4 text-sm font-semibold text-stone-50">
          Промените са запазени.
        </div>
      ) : null}
      {params.error ? (
        <div className="rounded-2xl border border-red-300/40 bg-red-500/10 p-4 text-sm font-semibold text-red-100">
          {params.error}
        </div>
      ) : null}

      <section className="grid gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-stone-400">Заявки</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">Бизнес заявки</h2>
        </div>
        {businesses.length ? (
          <div className="grid gap-4">
            {businesses.map((business) => (
              <details key={business.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase text-stone-400">{business.category} / {businessStatusLabels[business.status]}</p>
                      <h3 className="mt-2 font-serif text-2xl font-semibold">{business.name}</h3>
                      <p className="mt-1 text-sm text-stone-300">{business.address}</p>
                    </div>
                    <div className="text-right text-sm text-stone-300">
                      <p>{businessTierLabels[business.listing_tier]} / {businessPaymentStatusLabels[business.payment_status]}</p>
                      <p>Активен до: {formatDate(business.paid_until)}</p>
                    </div>
                  </div>
                </summary>

                <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                  <form action={updateBusinessAction} className="grid gap-4 rounded-2xl bg-white p-5 text-stone-950">
                    <input type="hidden" name="id" value={business.id} />
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2 text-sm font-semibold">
                        Име
                        <input name="name" defaultValue={business.name} className="rounded-xl border border-stone-300 px-4 py-3" />
                      </label>
                      <label className="grid gap-2 text-sm font-semibold">
                        Slug
                        <input name="slug" defaultValue={business.slug} className="rounded-xl border border-stone-300 px-4 py-3" />
                      </label>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2 text-sm font-semibold">
                        Категория
                        <select name="category" defaultValue={business.category} className="rounded-xl border border-stone-300 px-4 py-3">
                          {businessCategories.map((category) => (
                            <option key={category}>{category}</option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-2 text-sm font-semibold">
                        Статус
                        <select name="status" defaultValue={business.status} className="rounded-xl border border-stone-300 px-4 py-3">
                          <option value="draft">Чернова</option>
                          <option value="approved">Одобрен</option>
                          <option value="rejected">Отхвърлен</option>
                        </select>
                      </label>
                    </div>
                    <label className="grid gap-2 text-sm font-semibold">
                      Описание
                      <textarea name="description" defaultValue={business.description ?? ""} rows={4} className="rounded-xl border border-stone-300 px-4 py-3" />
                    </label>
                    <label className="grid gap-2 text-sm font-semibold">
                      Адрес
                      <input name="address" defaultValue={business.address} className="rounded-xl border border-stone-300 px-4 py-3" />
                    </label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <input name="latitude" defaultValue={business.latitude ?? ""} placeholder="Latitude" className="rounded-xl border border-stone-300 px-4 py-3" />
                      <input name="longitude" defaultValue={business.longitude ?? ""} placeholder="Longitude" className="rounded-xl border border-stone-300 px-4 py-3" />
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <input name="video_link" defaultValue={business.video_link ?? ""} placeholder="Video" className="rounded-xl border border-stone-300 px-4 py-3" />
                      <input name="website_url" defaultValue={business.website_url ?? ""} placeholder="Website" className="rounded-xl border border-stone-300 px-4 py-3" />
                      <input name="instagram_url" defaultValue={business.instagram_url ?? ""} placeholder="Instagram" className="rounded-xl border border-stone-300 px-4 py-3" />
                    </div>
                    <input name="facebook_url" defaultValue={business.facebook_url ?? ""} placeholder="Facebook" className="rounded-xl border border-stone-300 px-4 py-3" />
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-sm font-semibold uppercase text-moss">Контакт само за администратора</p>
                      <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <input name="owner_name" defaultValue={business.contact?.owner_name ?? ""} placeholder="Име" className="rounded-xl border border-stone-300 px-4 py-3" />
                        <input name="owner_email" defaultValue={business.contact?.owner_email ?? ""} placeholder="Имейл" className="rounded-xl border border-stone-300 px-4 py-3" />
                        <input name="owner_phone" defaultValue={business.contact?.owner_phone ?? ""} placeholder="Телефон" className="rounded-xl border border-stone-300 px-4 py-3" />
                      </div>
                    </div>
                    <label className="grid gap-2 text-sm font-semibold">
                      URL адреси на изображенията
                      <textarea
                        name="images_input"
                        defaultValue={textAreaValue(business.images)}
                        rows={4}
                        className="rounded-xl border border-stone-300 px-4 py-3"
                        placeholder="Един URL на ред. Първият е основната снимка."
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-semibold">
                      Въпроси и отговори
                      <textarea
                        name="faqs_input"
                        defaultValue={faqTextAreaValue(business.faqs)}
                        rows={4}
                        className="rounded-xl border border-stone-300 px-4 py-3"
                        placeholder="Въпрос | Отговор"
                      />
                    </label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <textarea name="features_input" defaultValue={textAreaValue(business.features)} rows={5} className="rounded-xl border border-stone-300 px-4 py-3" placeholder={businessFeatures.join("\n")} />
                      <textarea name="requested_services_input" defaultValue={textAreaValue(business.requested_services)} rows={5} className="rounded-xl border border-stone-300 px-4 py-3" placeholder={businessServices.join("\n")} />
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <label className="grid gap-2 text-sm font-semibold">
                        Ниво на видимост
                        <select name="listing_tier" defaultValue={business.listing_tier} className="rounded-xl border border-stone-300 px-4 py-3">
                          <option value="free">Безплатен</option>
                          <option value="premium">Премиум</option>
                          <option value="homepage">На фокус</option>
                        </select>
                      </label>
                      <label className="grid gap-2 text-sm font-semibold">
                        Плащане
                        <select name="payment_status" defaultValue={business.payment_status} className="rounded-xl border border-stone-300 px-4 py-3">
                          <option value="unpaid">Неплатено</option>
                          <option value="pending">Очаква плащане</option>
                          <option value="paid">Платено</option>
                          <option value="expired">Изтекло</option>
                        </select>
                      </label>
                      <label className="grid gap-2 text-sm font-semibold">
                        Активен годишен план
                        <select name="active_plan_id" defaultValue={business.active_plan_id ?? ""} className="rounded-xl border border-stone-300 px-4 py-3">
                          <option value="">Без платен план</option>
                          {annualPlans.map((plan) => (
                            <option key={plan.id} value={plan.id}>{getBusinessTierLabel(plan.tier)}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <label className="grid gap-2 text-sm font-semibold">
                        Активен до
                        <input type="date" name="paid_until" defaultValue={business.paid_until?.slice(0, 10) ?? ""} className="rounded-xl border border-stone-300 px-4 py-3" />
                      </label>
                      <label className="grid gap-2 text-sm font-semibold">
                        Приоритет
                        <input name="priority" defaultValue={business.priority} className="rounded-xl border border-stone-300 px-4 py-3" />
                      </label>
                      <label className="choice-row cursor-pointer self-end rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm font-semibold">
                        <input className="choice-control" type="checkbox" name="is_homepage_spotlight" defaultChecked={business.is_homepage_spotlight} />
                        <span>На фокус на началната страница</span>
                      </label>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <input type="date" name="homepage_spotlight_until" defaultValue={business.homepage_spotlight_until?.slice(0, 10) ?? ""} className="rounded-xl border border-stone-300 px-4 py-3" />
                      <input name="map_pin_x" defaultValue={business.map_pin_x ?? ""} placeholder="Map pin X %" className="rounded-xl border border-stone-300 px-4 py-3" />
                      <input name="map_pin_y" defaultValue={business.map_pin_y ?? ""} placeholder="Map pin Y %" className="rounded-xl border border-stone-300 px-4 py-3" />
                    </div>
                    <label className="choice-row cursor-pointer rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm font-semibold">
                      <input className="choice-control" type="checkbox" name="show_on_illustrated_map" defaultChecked={business.show_on_illustrated_map} />
                      <span>Покажи на илюстрираната карта</span>
                    </label>
                    <textarea name="admin_notes" defaultValue={business.admin_notes ?? ""} rows={3} className="rounded-xl border border-stone-300 px-4 py-3" placeholder="Admin notes" />
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-sm font-semibold uppercase text-moss">SEO</p>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <input name="seo_title" defaultValue={business.seo_title ?? ""} placeholder="SEO title" className="rounded-xl border border-stone-300 px-4 py-3" />
                        <input name="seo_description" defaultValue={business.seo_description ?? ""} placeholder="SEO description" className="rounded-xl border border-stone-300 px-4 py-3" />
                        <input name="canonical_url" defaultValue={business.canonical_url ?? ""} placeholder="Canonical URL" className="rounded-xl border border-stone-300 px-4 py-3" />
                        <input name="og_image_url" defaultValue={business.og_image_url ?? ""} placeholder="OG image URL" className="rounded-xl border border-stone-300 px-4 py-3" />
                        <input name="og_title" defaultValue={business.og_title ?? ""} placeholder="OG title" className="rounded-xl border border-stone-300 px-4 py-3" />
                        <input name="og_description" defaultValue={business.og_description ?? ""} placeholder="OG description" className="rounded-xl border border-stone-300 px-4 py-3" />
                        <input name="schema_type" defaultValue={business.schema_type ?? "LocalBusiness"} placeholder="Schema type" className="rounded-xl border border-stone-300 px-4 py-3" />
                        <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
                          <label className="choice-row cursor-pointer rounded-xl border border-stone-200 bg-white p-3">
                            <input className="choice-control" type="checkbox" name="robots_index" defaultChecked={business.robots_index ?? true} />
                            <span>Позволи индексиране</span>
                          </label>
                          <label className="choice-row cursor-pointer rounded-xl border border-stone-200 bg-white p-3">
                            <input className="choice-control" type="checkbox" name="robots_follow" defaultChecked={business.robots_follow ?? true} />
                            <span>Следвай линковете</span>
                          </label>
                        </div>
                      </div>
                    </div>
                    <button className="admin-button admin-button-forest px-5 py-3 text-sm font-semibold">Запази бизнеса</button>
                  </form>

                  <aside className="grid gap-4 content-start">
                    <div className="rounded-2xl bg-white p-5 text-stone-950">
                      <p className="text-sm font-semibold uppercase text-moss">Контакт за администратора</p>
                      <p className="mt-3 font-semibold">{business.contact?.owner_name || "—"}</p>
                      <p className="text-sm text-stone-600">{business.contact?.owner_email || "—"}</p>
                      <p className="text-sm text-stone-600">{business.contact?.owner_phone || "—"}</p>
                    </div>
                    {business.images?.length ? (
                      <div className="grid grid-cols-2 gap-2">
                        {business.images.map((image) => (
                          <img key={image} src={image} alt={business.name} className="aspect-square rounded-xl object-cover" />
                        ))}
                      </div>
                    ) : null}
                    <form action={approveBusinessAction}>
                      <input type="hidden" name="id" value={business.id} />
                      <button className="admin-button admin-button-sage w-full px-5 py-3 text-sm font-semibold">Одобри</button>
                    </form>
                    <details>
                      <summary className="admin-button admin-button-danger list-none px-5 py-3 text-sm font-semibold">Изтрий / отхвърли</summary>
                      <form action={deleteBusinessAction} className="mt-3 grid gap-3 rounded-2xl bg-red-950/30 p-4">
                        <input type="hidden" name="id" value={business.id} />
                        <p className="text-sm text-red-100">Изтрива бизнеса, private контакта и качените снимки.</p>
                        <button className="admin-button admin-button-danger px-4 py-2 text-sm font-semibold">Потвърди изтриването</button>
                      </form>
                    </details>
                  </aside>
                </div>
              </details>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-stone-300">Няма бизнес заявки.</div>
        )}
      </section>

      <section className="grid gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-stone-400">План за видимост</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">Годишни нива и Stripe линкове</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-300">
            Безплатният план е по подразбиране. Всички платени нива са за една година, за да бъдат офертата и подновяването ясни.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {annualPlans.map((plan, index) => (
            <form key={plan.id} action={upsertBusinessPlanAction} className="grid gap-3 rounded-2xl bg-white p-5 text-stone-950">
              <input type="hidden" name="id" value={plan.id} />
              <input type="hidden" name="period_months" value="12" />
              <input name="name" defaultValue={plan.name} placeholder="Име на плана" className="rounded-xl border border-stone-300 px-4 py-3" />
              <input name="slug" defaultValue={plan.slug} placeholder="slug" className="rounded-xl border border-stone-300 px-4 py-3" />
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <select name="tier" defaultValue={plan.tier} className="rounded-xl border border-stone-300 px-4 py-3">
                  <option value="free">Безплатен</option>
                  <option value="premium">Премиум</option>
                  <option value="homepage">На фокус</option>
                </select>
                <span className="inline-flex items-center rounded-xl bg-sage px-4 py-3 text-sm font-semibold text-forest">1 година</span>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <input name="price" defaultValue={plan.price ?? ""} placeholder="Цена" className="rounded-xl border border-stone-300 px-4 py-3" />
                <input name="currency" defaultValue={plan.currency} placeholder="BGN" className="rounded-xl border border-stone-300 px-4 py-3" />
                <input name="sort_order" defaultValue={plan.sort_order ?? index * 10} placeholder="Ред" className="rounded-xl border border-stone-300 px-4 py-3" />
              </div>
              <input name="stripe_payment_link" defaultValue={plan.stripe_payment_link ?? ""} placeholder="Stripe Payment Link" className="rounded-xl border border-stone-300 px-4 py-3" />
              <textarea name="description" defaultValue={plan.description ?? ""} rows={2} placeholder="Кратко описание" className="rounded-xl border border-stone-300 px-4 py-3" />
              <textarea name="benefits_input" defaultValue={textAreaValue(plan.benefits)} rows={3} placeholder="Предимства, по едно на ред" className="rounded-xl border border-stone-300 px-4 py-3" />
              <label className="choice-row cursor-pointer rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm font-semibold">
                <input className="choice-control" type="checkbox" name="is_active" defaultChecked={plan.is_active} />
                <span>Активен план</span>
              </label>
              <button className="admin-button admin-button-forest px-4 py-2 text-sm font-semibold">Запази плана</button>
            </form>
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-stone-400">Settings</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">Directory, Map, About</h2>
        </div>
        <form action={saveBusinessDirectorySettingsAction} className="grid gap-4 rounded-2xl bg-white p-5 text-stone-950">
          {settings.id !== "fallback" ? <input type="hidden" name="id" value={settings.id} /> : null}
          <div className="grid gap-4 md:grid-cols-2">
            <input name="intro_title" defaultValue={settings.intro_title ?? ""} placeholder="Directory title" className="rounded-xl border border-stone-300 px-4 py-3" />
            <input name="notification_email" defaultValue={settings.notification_email ?? ""} placeholder="Notification email" className="rounded-xl border border-stone-300 px-4 py-3" />
          </div>
          <textarea name="intro_description" defaultValue={settings.intro_description ?? ""} rows={2} placeholder="Directory description" className="rounded-xl border border-stone-300 px-4 py-3" />
          <div className="grid gap-4 md:grid-cols-2">
            <input name="premium_offer_title" defaultValue={settings.premium_offer_title ?? ""} placeholder="Premium offer title" className="rounded-xl border border-stone-300 px-4 py-3" />
            <input name="premium_offer_description" defaultValue={settings.premium_offer_description ?? ""} placeholder="Premium offer text" className="rounded-xl border border-stone-300 px-4 py-3" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input name="map_image_url" defaultValue={settings.map_image_url ?? ""} placeholder="Illustrated map image URL" className="rounded-xl border border-stone-300 px-4 py-3" />
            <input name="map_image_alt" defaultValue={settings.map_image_alt ?? ""} placeholder="Map alt text" className="rounded-xl border border-stone-300 px-4 py-3" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input name="about_title" defaultValue={settings.about_title ?? ""} placeholder="About title" className="rounded-xl border border-stone-300 px-4 py-3" />
            <input name="about_eyebrow" defaultValue={settings.about_eyebrow ?? ""} placeholder="About eyebrow" className="rounded-xl border border-stone-300 px-4 py-3" />
          </div>
          <textarea name="about_description" defaultValue={settings.about_description ?? ""} rows={2} placeholder="About description" className="rounded-xl border border-stone-300 px-4 py-3" />
          <textarea name="about_body" defaultValue={settings.about_body ?? ""} rows={5} placeholder="About body" className="rounded-xl border border-stone-300 px-4 py-3" />
          <input name="about_image_url" defaultValue={settings.about_image_url ?? ""} placeholder="About image URL" className="rounded-xl border border-stone-300 px-4 py-3" />
          <div className="grid gap-4 md:grid-cols-2">
            <input name="contact_title" defaultValue={settings.contact_title ?? ""} placeholder="Contact title" className="rounded-xl border border-stone-300 px-4 py-3" />
            <input name="contact_description" defaultValue={settings.contact_description ?? ""} placeholder="Contact description" className="rounded-xl border border-stone-300 px-4 py-3" />
          </div>
          <button className="admin-button admin-button-forest px-5 py-3 text-sm font-semibold">Save settings</button>
        </form>
      </section>

      <section id="messages" className="grid gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-stone-400">Messages</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">Contact form</h2>
        </div>
        <div className="grid gap-3">
          {messages.map((message) => (
            <article key={message.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-stone-400">{message.status} / {formatDate(message.created_at)}</p>
                  <h3 className="mt-2 text-lg font-semibold">{message.subject || "Съобщение"}</h3>
                  <p className="mt-1 text-sm text-stone-300">{message.name} · {message.email} · {message.phone || "—"}</p>
                </div>
                <form action={markContactMessageAction}>
                  <input type="hidden" name="id" value={message.id} />
                  <input type="hidden" name="status" value={message.status === "archived" ? "read" : "archived"} />
                  <button className="admin-button admin-button-secondary px-4 py-2 text-xs font-semibold">
                    {message.status === "archived" ? "Mark read" : "Archive"}
                  </button>
                </form>
              </div>
              <p className="mt-4 text-sm leading-6 text-stone-200">{message.message}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
