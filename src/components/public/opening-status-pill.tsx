import type { OpeningStatus } from "@/lib/business-platform/hours";

/** „Отворено до 18:00“ като малка значка; нищо, когато няма часове. */
export function OpeningStatusPill({ status, label, tone = "light" }: { status: OpeningStatus; label: string | null; tone?: "light" | "dark" | "paper" }) {
  if (!label || status.state === "unknown") {
    return null;
  }

  const open = status.state === "open";
  const dot = open ? "bg-emerald-400" : "bg-clay";
  /* „paper“: в цветовете на бранд темата на менюто (menu-paper.css), за да не стърчи на тъмна тема. */
  const base =
    tone === "dark"
      ? "inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur"
      : tone === "paper"
        ? "inline-flex items-center gap-2 rounded-full border border-[var(--paper-line)] bg-[var(--paper-bar)] px-3 py-1 text-xs font-semibold text-[var(--paper-ink)]"
        : "inline-flex items-center gap-2 rounded-full border border-[var(--stone)] bg-white px-3 py-1 text-xs font-semibold";

  return (
    <span className={base}>
      <span aria-hidden className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
