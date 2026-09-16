/** Общите класове на портала, за да изглежда всяка страница като една и съща ръка. */
export const portalUi = {
  eyebrow: "text-xs font-semibold uppercase tracking-[0.2em] text-moss",
  h1: "font-display mt-2 text-3xl font-semibold text-forest sm:text-4xl",
  h2: "font-display text-xl font-semibold",
  card: "rounded-3xl border border-[var(--stone)] bg-white p-5 sm:p-6",
  primaryButton:
    "inline-flex items-center justify-center rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-moss disabled:opacity-50",
  secondaryButton:
    "inline-flex items-center justify-center rounded-full border border-[var(--stone)] bg-white px-5 py-2.5 text-sm font-semibold transition hover:border-forest disabled:opacity-50",
  dangerButton:
    "inline-flex items-center justify-center rounded-full border border-clay/50 bg-white px-5 py-2.5 text-sm font-semibold text-clay transition hover:bg-clay/10",
  smallButton:
    "inline-flex items-center justify-center rounded-full border border-[var(--stone)] bg-white px-3 py-1.5 text-xs font-semibold transition hover:border-forest disabled:opacity-40",
  label: "grid gap-1.5 text-sm font-semibold",
  hint: "text-xs font-normal text-stone-650",
  input:
    "w-full rounded-xl border border-[var(--stone)] bg-paper px-4 py-3 text-base text-stone-950 outline-none focus:border-forest",
  textarea:
    "min-h-24 w-full rounded-xl border border-[var(--stone)] bg-paper px-4 py-3 text-base text-stone-950 outline-none focus:border-forest",
  notice: "rounded-2xl bg-sage px-5 py-4 text-sm font-medium text-forest",
  alert: "rounded-2xl bg-clay/15 px-5 py-4 text-sm",
  badge: "rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
};
