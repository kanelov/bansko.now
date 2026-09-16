import type { Metadata } from "next";
import { ConfirmButton } from "@/components/business/confirm-button";
import { portalUi } from "@/components/business/ui";
import { deleteHourExceptionAction, saveBusinessHoursAction, saveHourExceptionAction } from "@/app/business/hours/actions";
import { requireBusinessOwner } from "@/lib/business-platform/auth";
import { getPortalBusiness } from "@/lib/business-platform/business";
import { formatTime, getBusinessHours, resolveOpenState, sofiaDate, weekdayName } from "@/lib/business-platform/hours";
import { openStateText } from "@/components/public/business-hours";

export const metadata: Metadata = {
  title: "Работно време"
};

const savedMessages: Record<string, string> = {
  week: "Работното време е записано.",
  exception: "Промяната за тази дата е записана.",
  deleted: "Изтрито."
};

const errorMessages: Record<string, string> = {
  time: "Часът трябва да е във вид 08:00 и началото да е различно от края.",
  equal: "Началото и краят не може да съвпадат.",
  duplicate: "Две смени в един ден не може да започват в един и същ час.",
  date: "Датата не е валидна.",
  past: "Датата е минала.",
  save: "Записът не мина. Опитай пак.",
  delete: "Изтриването не успя.",
  missing: "Не намерих записа."
};

export default async function BusinessHoursPage({
  searchParams
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const { supabase, business } = await requireBusinessOwner();
  const [portal, hours] = await Promise.all([
    getPortalBusiness(supabase, business.businessId),
    getBusinessHours(supabase, business.businessId)
  ]);

  const today = sofiaDate(new Date());
  const override = portal?.settings?.open_override ?? "auto";
  const state = resolveOpenState(hours, override);
  const stateText = openStateText(state, "bg");
  const upcoming = hours.exceptions.filter((exception) => exception.date >= today);

  return (
    <div className="grid gap-6">
      <header>
        <p className={portalUi.eyebrow}>Работно време</p>
        <h1 className={portalUi.h1}>Кога сте отворени</h1>
        <p className="mt-2 max-w-xl text-sm text-stone-650">
          Часовете излизат на профила и на QR менюто, а „Отворено сега“ се смята по тях. Ден без часове значи почивен ден.
        </p>
      </header>

      {saved ? (
        <div className={portalUi.notice} role="status">
          {savedMessages[saved] ?? "Записано."}
        </div>
      ) : null}

      {error ? (
        <div className={portalUi.alert} role="alert">
          {errorMessages[error] ?? "Нещо не мина. Опитай пак."}
        </div>
      ) : null}

      {stateText ? (
        <p className="text-sm">
          Сега: <strong>{stateText}</strong>
          {override !== "auto" ? <span className="text-stone-650"> · ръчно от таблото</span> : null}
        </p>
      ) : null}

      <section className={portalUi.card}>
        <h2 className={portalUi.h2}>Седмицата</h2>
        <p className="mt-2 text-sm text-stone-650">
          Втората смяна е за заведения с почивка по обяд. Работа след полунощ се пише както си е – например 18:00 – 02:00.
        </p>

        <form action={saveBusinessHoursAction} className="mt-4 grid gap-3">
          <input type="hidden" name="business_id" value={business.businessId} />

          {hours.week.map((day) => {
            const first = day.intervals[0];
            const second = day.intervals[1];

            return (
              <div key={day.weekday} className="grid gap-2 border-b border-[var(--stone)] pb-3 last:border-b-0 sm:grid-cols-[9rem_1fr] sm:items-center">
                <p className="text-sm font-semibold">{weekdayName(day.weekday, "bg")}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <TimePair weekday={day.weekday} shift={1} opens={first?.opens} closes={first?.closes} />
                  <span className="text-xs text-stone-650">и</span>
                  <TimePair weekday={day.weekday} shift={2} opens={second?.opens} closes={second?.closes} />
                </div>
              </div>
            );
          })}

          <div>
            <button type="submit" className={portalUi.primaryButton}>
              Запази седмицата
            </button>
          </div>
        </form>
      </section>

      <section className={portalUi.card}>
        <h2 className={portalUi.h2}>Празници и еднократни промени</h2>
        <p className="mt-2 text-sm text-stone-650">
          Тук се пише един ден, който е различен от обичайното: затворено на Коледа или по-дълго работно време за празник. Датата бие седмицата.
        </p>

        {upcoming.length ? (
          <ul className="mt-4 grid gap-2">
            {upcoming.map((exception) => (
              <li key={exception.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--stone)] bg-paper px-4 py-3 text-sm">
                <span>
                  <strong>{exception.date}</strong>{" "}
                  {exception.is_closed || !exception.opens || !exception.closes
                    ? "· затворено"
                    : `· ${formatTime(exception.opens)} – ${formatTime(exception.closes)}`}
                  {exception.note ? <span className="text-stone-650"> · {exception.note}</span> : null}
                </span>
                <form action={deleteHourExceptionAction}>
                  <input type="hidden" name="business_id" value={business.businessId} />
                  <input type="hidden" name="id" value={exception.id} />
                  <ConfirmButton message="Да изтрия ли тази промяна?" className={portalUi.smallButton}>
                    Изтрий
                  </ConfirmButton>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-stone-650">Няма предстоящи промени.</p>
        )}

        <form action={saveHourExceptionAction} className="mt-5 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="business_id" value={business.businessId} />

          <label className={portalUi.label}>
            Дата
            <input type="date" name="date" min={today} required className={portalUi.input} />
          </label>

          <label className={portalUi.label}>
            Бележка <span className={portalUi.hint}>по избор, вижда се на сайта</span>
            <input type="text" name="note" maxLength={120} placeholder="Коледа" className={portalUi.input} />
          </label>

          <fieldset className="grid gap-2 sm:col-span-2">
            <legend className="text-sm font-semibold">Този ден</legend>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="mode" value="closed" defaultChecked />
              Затворено
            </label>
            <label className="flex flex-wrap items-center gap-2 text-sm">
              <input type="radio" name="mode" value="open" />
              Отворено от
              <input type="time" name="opens" className="rounded-xl border border-[var(--stone)] bg-paper px-3 py-2 text-base" />
              до
              <input type="time" name="closes" className="rounded-xl border border-[var(--stone)] bg-paper px-3 py-2 text-base" />
            </label>
          </fieldset>

          <div className="sm:col-span-2">
            <button type="submit" className={portalUi.primaryButton}>
              Добави промяната
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function TimePair({ weekday, shift, opens, closes }: { weekday: number; shift: number; opens?: string; closes?: string }) {
  const label = shift === 1 ? "първа смяна" : "втора смяна";

  return (
    <span className="flex items-center gap-1.5">
      <input
        type="time"
        name={`opens_${weekday}_${shift}`}
        defaultValue={opens ? formatTime(opens) : ""}
        aria-label={`${weekdayName(weekday, "bg")}, ${label}, начало`}
        className="rounded-xl border border-[var(--stone)] bg-paper px-3 py-2 text-base"
      />
      <span aria-hidden className="text-stone-650">
        –
      </span>
      <input
        type="time"
        name={`closes_${weekday}_${shift}`}
        defaultValue={closes ? formatTime(closes) : ""}
        aria-label={`${weekdayName(weekday, "bg")}, ${label}, край`}
        className="rounded-xl border border-[var(--stone)] bg-paper px-3 py-2 text-base"
      />
    </span>
  );
}
