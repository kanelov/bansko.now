import type { Metadata } from "next";
import { setOpenOverrideAction } from "@/app/business/actions";
import { requireBusinessOwner } from "@/lib/business-platform/auth";
import Link from "next/link";
import { getPortalBusiness, moduleLabels } from "@/lib/business-platform/business";
import { getOpeningStatus } from "@/lib/business-platform/hours";
import type { BusinessModuleKey, BusinessOpenOverride } from "@/lib/types";

export const metadata: Metadata = {
  title: "Табло"
};

const openOptions: { value: BusinessOpenOverride; label: string; hint: string }[] = [
  { value: "auto", label: "По работно време", hint: "Часовете се въвеждат в „Работно време“." },
  { value: "open", label: "Отворено сега", hint: "Показва „Отворено“ независимо от часовете." },
  { value: "closed", label: "Затворено сега", hint: "Например почивен ден или инвентаризация." }
];

/* Кои модули вече имат страница в портала. Останалите се показват като „предстои“,
   за да се вижда какво идва, без да води към празно място. */
const moduleLinks: Partial<Record<BusinessModuleKey, string>> = { menu: "/business/menu", hours: "/business/hours" };

const platformStatusLabels = {
  listing: "Визитка в каталога",
  active: "Платформата е активна",
  suspended: "Платформата е спряна"
};

export default async function BusinessDashboardPage({
  searchParams
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const { supabase, business } = await requireBusinessOwner();
  const [portal, opening] = await Promise.all([
    getPortalBusiness(supabase, business.businessId),
    getOpeningStatus(supabase, business.businessId, "bg")
  ]);

  if (!portal) {
    return (
      <div className="rounded-2xl bg-clay/15 p-5 text-sm">Бизнесът не може да се зареди. Опитай пак или пиши на Bansko NOW.</div>
    );
  }

  const openOverride = portal.settings?.open_override ?? "auto";
  const enabledModules = (Object.keys(moduleLabels) as BusinessModuleKey[]).filter((key) => portal.modules[key]);

  return (
    <div className="grid gap-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-moss">{portal.categoryName ?? "Бизнес"}</p>
        <h1 className="font-display mt-2 text-3xl font-semibold text-forest sm:text-4xl">{portal.name}</h1>
        <p className="mt-2 text-sm text-stone-650">{portal.address}</p>
      </header>

      {saved === "open" ? (
        <div className="rounded-2xl bg-sage px-5 py-4 text-sm font-medium text-forest" role="status">
          Записано. Промяната стига до менюто и екраните за под минута.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl bg-clay/15 px-5 py-4 text-sm" role="alert">
          Не успях да запиша. Опитай пак.
        </div>
      ) : null}

      <section className="rounded-3xl border border-[var(--stone)] bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-semibold">Отворено или затворено</h2>
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-moss">
            {portal.settings ? platformStatusLabels[portal.settings.platform_status] : "Без настройки"}
          </span>
        </div>
        <p className="mt-2 text-sm text-stone-650">
          Това виждат гостите на QR менюто и на профила. Автоматичният режим следва{" "}
          <Link href="/business/hours" className="font-semibold text-forest underline-offset-4 hover:underline">
            работното време
          </Link>
          .
        </p>
        {opening.label ? (
          <p className="mt-3 text-sm">
            Сега: <strong>{opening.label}</strong>
          </p>
        ) : (
          <p className="mt-3 text-sm text-stone-650">
            Още няма въведено работно време —{" "}
            <Link href="/business/hours" className="font-semibold text-forest underline-offset-4 hover:underline">
              въведи го
            </Link>
            , за да пише „Отворено до…“.
          </p>
        )}

        <form action={setOpenOverrideAction} className="mt-4 grid gap-2 sm:grid-cols-3">
          <input type="hidden" name="business_id" value={portal.id} />
          {openOptions.map((option) => {
            const active = option.value === openOverride;
            return (
              <button
                key={option.value}
                name="open_override"
                value={option.value}
                aria-pressed={active}
                className={
                  active
                    ? "rounded-2xl border border-forest bg-forest px-4 py-3 text-left text-white"
                    : "rounded-2xl border border-[var(--stone)] bg-paper px-4 py-3 text-left transition hover:border-forest"
                }
              >
                <span className="block text-sm font-semibold">{option.label}</span>
                <span className={active ? "mt-1 block text-xs text-white/80" : "mt-1 block text-xs text-stone-650"}>
                  {option.hint}
                </span>
              </button>
            );
          })}
        </form>
      </section>

      <section className="rounded-3xl border border-[var(--stone)] bg-white p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold">Модули</h2>
        <p className="mt-2 text-sm text-stone-650">Кое е включено за този бизнес. Включването и изключването е от Bansko NOW.</p>

        {enabledModules.length === 0 ? (
          <p className="mt-4 text-sm">Още няма включени модули.</p>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {enabledModules.map((key) => {
              const href = moduleLinks[key];
              return (
                <li key={key} className="flex items-center justify-between rounded-2xl border border-[var(--stone)] bg-paper px-4 py-3 text-sm">
                  <span className="font-semibold">{moduleLabels[key]}</span>
                  {href ? (
                    <a href={href} className="font-semibold text-forest">
                      Отвори →
                    </a>
                  ) : (
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-650">предстои</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
