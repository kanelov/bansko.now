import Link from "next/link";
import { removeBusinessMemberAction, saveBusinessModulesAction, savePlatformSettingsAction } from "@/app/admin/platform-actions";
import { BusinessVideoUploader } from "@/components/admin/business-video-uploader";
import { AddOwnerForm, ResetPasswordForm } from "@/components/admin/platform-owner-forms";
import { getPlatformBusinesses, manageableModules, platformStatusOptions } from "@/lib/business-platform/admin";
import { siteUrl } from "@/lib/env";

type SearchParams = Promise<{ saved?: string; error?: string }>;

const savedMessages: Record<string, string> = {
  status: "Статусът на платформата е записан.",
  modules: "Модулите са записани.",
  member: "Собственикът е премахнат от бизнеса."
};

const statusBadge: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-900",
  suspended: "bg-red-100 text-red-900",
  listing: "bg-stone-200 text-stone-700"
};

const panelClass = "grid gap-3 rounded-2xl border border-[var(--admin-line)] bg-white p-5 text-stone-950";

/** Админ „Бизнес платформа“: кой бизнес е на платформата, с кои модули и с кои собственици. */
export default async function AdminPlatformPage({ searchParams }: { searchParams: SearchParams }) {
  const [{ saved, error }, businesses] = await Promise.all([searchParams, getPlatformBusinesses()]);

  return (
    <div className="grid gap-8">
      <div className="grid gap-4">
        <p className="text-sm font-semibold uppercase text-[var(--admin-muted)]">Бизнеси</p>
        <h1 className="font-serif text-4xl font-semibold">Бизнес платформа</h1>
        <p className="max-w-3xl text-sm leading-6 text-[var(--admin-muted)]">
          Оттук се решава кой бизнес получава портала{" "}
          <Link href="/business" className="font-semibold text-forest underline underline-offset-4">
            bansko.now/business
          </Link>
          : активираш платформата, включваш модулите от плана му и създаваш акаунта на собственика. Менюто, часовете, екраните и печата
          ги управлява самият собственик в портала. Профилът в каталога (текстове, снимки, одобрение) остава в „Бизнеси“.
        </p>
      </div>

      {saved ? (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-100 p-4 text-sm font-semibold text-emerald-950">{savedMessages[saved] ?? "Записано."}</div>
      ) : null}
      {error ? <div className="rounded-2xl border border-red-300 bg-red-100 p-4 text-sm font-semibold text-red-900">{error === "invalid" ? "Невалидни данни." : error}</div> : null}

      <div className="grid gap-4">
        {businesses.map((business) => {
          const owners = business.members.filter((member) => member.role === "owner");
          const onlineDisplays = business.displays.filter((display) => display.isActive && display.online).length;
          const status = business.platformStatus ?? "listing";

          return (
            <details key={business.id} id={`b-${business.id}`} open={business.platformStatus === "active"} className="rounded-2xl border border-[var(--admin-line)] bg-[var(--admin-panel)] p-5">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-[var(--admin-muted)]">
                      {business.category ?? "Бизнес"} · {business.status === "approved" ? "одобрен" : "не е одобрен"}
                    </p>
                    <h2 className="mt-1 font-serif text-2xl font-semibold">{business.name}</h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className={`rounded-full px-3 py-1 ${statusBadge[status]}`}>{platformStatusOptions.find((option) => option.value === status)?.label}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-stone-700">{owners.length} собственик(а)</span>
                    {business.displays.length ? (
                      <span className="rounded-full bg-white px-3 py-1 text-stone-700">
                        екрани {onlineDisplays}/{business.displays.length} онлайн
                      </span>
                    ) : null}
                  </div>
                </div>
              </summary>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <form action={savePlatformSettingsAction} className={panelClass}>
                  <input type="hidden" name="business_id" value={business.id} />
                  <p className="text-sm font-semibold">Статус на платформата</p>
                  {business.status !== "approved" ? (
                    <p className="text-xs text-red-800">Бизнесът не е одобрен в „Бизнеси“ – докато не е, публиката не вижда нищо от платформата.</p>
                  ) : null}
                  <div className="grid gap-2">
                    {platformStatusOptions.map((option) => (
                      <label key={option.value} className="flex items-start gap-2 text-sm">
                        <input type="radio" name="platform_status" value={option.value} defaultChecked={status === option.value} className="mt-1" />
                        <span>
                          <span className="font-semibold">{option.label}</span> <span className="text-xs text-[var(--admin-muted)]">{option.hint}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <label className="grid gap-1 text-xs font-semibold text-stone-700">
                    План (свободен текст, за твоя сметка)
                    <input name="plan" defaultValue={business.plan ?? "free"} maxLength={40} className="rounded-xl border border-[var(--admin-line)] bg-white px-3 py-2 text-sm" />
                  </label>
                  <button className="admin-button admin-button-primary w-fit px-4 py-2 text-sm font-semibold">Запази статуса</button>
                </form>

                <form action={saveBusinessModulesAction} className={panelClass}>
                  <input type="hidden" name="business_id" value={business.id} />
                  <p className="text-sm font-semibold">Модули</p>
                  <div className="grid gap-2">
                    {manageableModules.map((module) => (
                      <label key={module.key} className="flex items-start gap-2 text-sm">
                        <input type="checkbox" name="modules" value={module.key} defaultChecked={business.modules[module.key] ?? false} className="mt-1" />
                        <span>
                          <span className="font-semibold">{module.label}</span> <span className="text-xs text-[var(--admin-muted)]">{module.hint}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--admin-muted)]">Изключен модул изчезва от публичните страници веднага; данните му се пазят.</p>
                  <button className="admin-button admin-button-primary w-fit px-4 py-2 text-sm font-semibold">Запази модулите</button>
                </form>

                <div className={panelClass}>
                  <p className="text-sm font-semibold">Собственици (вход в портала)</p>
                  {owners.length ? (
                    <ul className="grid gap-3">
                      {owners.map((member) => (
                        <li key={member.id} className="grid gap-2 rounded-xl border border-[var(--admin-line)] p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                            <span className="font-semibold">{member.email ?? "акаунт без записан имейл"}</span>
                            <form action={removeBusinessMemberAction}>
                              <input type="hidden" name="business_id" value={business.id} />
                              <input type="hidden" name="member_id" value={member.id} />
                              <button className="text-xs font-semibold text-red-700">Премахни достъпа</button>
                            </form>
                          </div>
                          <ResetPasswordForm memberId={member.id} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-[var(--admin-muted)]">Още няма собственик – никой не може да влезе в портала на този бизнес.</p>
                  )}
                  <AddOwnerForm businessId={business.id} />
                  <p className="text-xs text-[var(--admin-muted)]">
                    Нов имейл получава акаунт с временна парола (показва се веднъж тук). Собственикът я сменя от „Парола“ в портала.
                  </p>
                </div>

                <div className={panelClass}>
                  <p className="text-sm font-semibold">Екрани и адреси</p>
                  {business.displays.length ? (
                    <ul className="grid gap-2 text-sm">
                      {business.displays.map((display) => (
                        <li key={display.id} className="flex flex-wrap items-center justify-between gap-2">
                          <span>
                            <span className="font-semibold">{display.name}</span>{" "}
                            <span className="text-xs text-[var(--admin-muted)]">{!display.isActive ? "изключен" : display.online ? "онлайн" : "офлайн"}</span>
                          </span>
                          <a href={`${siteUrl}/display/${display.token}?preview=1`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-forest underline underline-offset-4">
                            Виж екрана
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-[var(--admin-muted)]">Собственикът още не е създал екран.</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-xs font-semibold">
                    <a href={`${siteUrl}/places/${business.slug}`} target="_blank" rel="noopener noreferrer" className="text-forest underline underline-offset-4">
                      Профил
                    </a>
                    <a href={`${siteUrl}/places/${business.slug}/menu`} target="_blank" rel="noopener noreferrer" className="text-forest underline underline-offset-4">
                      QR меню
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <BusinessVideoUploader businessId={business.id} initial={business.videos} />
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
