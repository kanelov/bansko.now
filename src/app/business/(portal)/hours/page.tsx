import type { Metadata } from "next";
import Link from "next/link";
import { addHourExceptionAction, deleteHourExceptionAction, saveBusinessHoursAction } from "@/app/business/hours/actions";
import { ConfirmButton } from "@/components/business/confirm-button";
import { portalUi } from "@/components/business/ui";
import { requireBusinessOwner } from "@/lib/business-platform/auth";
import { formatTime, getOpeningStatus, sofiaClock, weekdayNames } from "@/lib/business-platform/hours";

export const metadata: Metadata = {
  title: "Работно време"
};

const savedMessages: Record<string, string> = {
  hours: "Работното време е записано.",
  exception: "Изключението е записано.",
  deleted: "Изтрито."
};

const errorMessages: Record<string, string> = {
  time: "Въведи час на отваряне и затваряне за всеки отворен ден.",
  date: "Избери дата.",
  "exception-time": "Въведи часове за този ден или го отбележи като затворен.",
  save: "Записът не успя. Опитай пак."
};

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
}

export default async function BusinessHoursPage({
  searchParams
}: {
  searchParams: Promise<{ saved?: string; error?: string; day?: string }>;
}) {
  const { saved, error, day } = await searchParams;
  const { supabase, business } = await requireBusinessOwner();
  const { hours, exceptions, label } = await getOpeningStatus(supabase, business.businessId, "bg");
  const today = sofiaClock().date;

  /* Празен ден при първо попълване: 9–18, за да не се пишат 14 часа на ръка. */
  const hasAny = hours.length > 0;
  const rows = [1, 2, 3, 4, 5, 6, 7].map((weekday) => {
    const first = hours.find((row) => row.weekday === weekday);
    return {
      weekday,
      name: weekdayNames.bg[weekday],
      closed: hasAny ? !first : false,
      opens: first ? first.opens.slice(0, 5) : "09:00",
      closes: first ? first.closes.slice(0, 5) : "18:00"
    };
  });

  return (
    <div className="grid gap-6">
      <header>
        <p className={portalUi.eyebrow}>Работно време</p>
        <h1 className={portalUi.h1}>Кога е отворено</h1>
        <p className="mt-2 max-w-xl text-sm text-stone-650">
          Гостите виждат „Отворено до 18:00“ на QR менюто и на профила. Ръчното „Отворено / Затворено сега“ е на{" "}
          <Link href="/business" className="font-semibold text-forest underline-offset-4 hover:underline">
            таблото
          </Link>
          .
        </p>
      </header>

      {label ? (
        <p className="rounded-2xl border border-[var(--stone)] bg-white px-5 py-3 text-sm">
          Сега: <strong>{label}</strong>
        </p>
      ) : null}

      {saved ? (
        <div className={portalUi.notice} role="status">
          {savedMessages[saved] ?? "Записано."}
        </div>
      ) : null}

      {error ? (
        <div className={portalUi.alert} role="alert">
          {errorMessages[error] ?? errorMessages.save}
          {error === "time" && day ? ` (${weekdayNames.bg[Number(day)] ?? ""})` : ""}
        </div>
      ) : null}

      <form action={saveBusinessHoursAction} className={portalUi.card + " grid gap-4"}>
        <input type="hidden" name="business_id" value={business.businessId} />
        <h2 className={portalUi.h2}>Седмица</h2>
        <div className="grid gap-2">
          {rows.map((row) => (
            <div
              key={row.weekday}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-[var(--stone)] bg-paper px-4 py-3 sm:grid-cols-[120px_auto_1fr]"
            >
              <span className="text-sm font-semibold capitalize">{row.name}</span>
              <label className="flex items-center gap-2 text-sm">
                <input id={`closed-${row.weekday}`} type="checkbox" name={`closed_${row.weekday}`} defaultChecked={row.closed} className="h-4 w-4 accent-forest" />
                затворено
              </label>
              <div className="col-span-2 flex items-center gap-2 text-sm sm:col-span-1">
                <input id={`opens-${row.weekday}`} type="time" name={`opens_${row.weekday}`} defaultValue={row.opens} className={portalUi.input + " max-w-36"} />
                <span aria-hidden>–</span>
                <input id={`closes-${row.weekday}`} type="time" name={`closes_${row.weekday}`} defaultValue={row.closes} className={portalUi.input + " max-w-36"} />
              </div>
            </div>
          ))}
        </div>
        <p className={portalUi.hint}>Отметнат ден = затворено; часовете му не се пазят. Нощна смяна (22:00–02:00) също работи.</p>
        <div>
          <button className={portalUi.primaryButton}>Запази часовете</button>
        </div>
      </form>

      <section className={portalUi.card + " grid gap-4"}>
        <div>
          <h2 className={portalUi.h2}>Изключения</h2>
          <p className="mt-1 text-sm text-stone-650">Празник, инвентаризация, удължено време за събитие — по дата, с предимство пред седмицата.</p>
        </div>

        {exceptions.length ? (
          <ul className="grid gap-2">
            {exceptions.map((exception) => (
              <li key={exception.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--stone)] bg-paper px-4 py-3 text-sm">
                <span>
                  <strong>{formatDate(exception.date)}</strong>
                  {exception.date === today ? " (днес)" : ""} ·{" "}
                  {exception.is_closed || !exception.opens || !exception.closes
                    ? "затворено"
                    : `${formatTime(exception.opens)}–${formatTime(exception.closes)}`}
                  {exception.note ? ` · ${exception.note}` : ""}
                </span>
                <form action={deleteHourExceptionAction}>
                  <input type="hidden" name="business_id" value={business.businessId} />
                  <input type="hidden" name="id" value={exception.id} />
                  <ConfirmButton message="Да махна ли това изключение?" className={portalUi.smallButton}>
                    Махни
                  </ConfirmButton>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-stone-650">Няма предстоящи изключения.</p>
        )}

        <form action={addHourExceptionAction} className="grid gap-3 rounded-2xl border border-dashed border-[var(--stone)] p-4">
          <input type="hidden" name="business_id" value={business.businessId} />
          <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
            <label className={portalUi.label}>
              Дата
              <input id="exception-date" type="date" name="date" min={today} required className={portalUi.input} />
            </label>
            <label className={portalUi.label}>
              <span>
                Бележка <span className={portalUi.hint}>по желание, вижда се на менюто</span>
              </span>
              <input id="exception-note" name="note" maxLength={80} placeholder="Празник" className={portalUi.input} />
            </label>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input id="exception-closed" type="radio" name="mode" value="closed" defaultChecked className="h-4 w-4 accent-forest" />
              Затворено цял ден
            </label>
            <label className="flex flex-wrap items-center gap-2 text-sm">
              <input id="exception-special" type="radio" name="mode" value="special" className="h-4 w-4 accent-forest" />
              Различни часове
              <input id="exception-opens" type="time" name="exception_opens" className={portalUi.input + " max-w-32"} />
              <span aria-hidden>–</span>
              <input id="exception-closes" type="time" name="exception_closes" className={portalUi.input + " max-w-32"} />
            </label>
          </div>
          <div>
            <button className={portalUi.secondaryButton}>Добави изключение</button>
          </div>
        </form>
      </section>
    </div>
  );
}
