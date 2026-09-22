"use client";

import { useState } from "react";
import { portalUi } from "@/components/business/ui";

/**
 * Един цвят от темата: избор с палитра или отметка „по темата“ (тогава полето
 * е изключено, не се изпраща и действието записва null - пресетът решава).
 */
export function BrandColorField({
  name,
  label,
  hint,
  initial,
  fallback
}: {
  name: "accent" | "background" | "ink";
  label: string;
  hint?: string;
  /** Записаният цвят или null = по темата. */
  initial: string | null;
  /** Цветът на пресета - с него започва палитрата, когато отметката се махне. */
  fallback: string;
}) {
  const [auto, setAuto] = useState(initial === null);
  const [value, setValue] = useState(initial ?? fallback);

  return (
    <div className="grid gap-2 rounded-2xl border border-[var(--stone)] bg-paper px-4 py-3">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            id={`brand-${name}`}
            type="color"
            name={name}
            value={value}
            disabled={auto}
            onChange={(event) => setValue(event.target.value)}
            className="h-9 w-14 cursor-pointer rounded-lg border border-[var(--stone)] bg-white p-0.5 disabled:cursor-default disabled:opacity-40"
          />
          <span className={auto ? "font-mono text-xs text-stone-650" : "font-mono text-xs"}>{value}</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            id={`brand-${name}-auto`}
            type="checkbox"
            name={`${name}_auto`}
            checked={auto}
            onChange={(event) => setAuto(event.target.checked)}
            className="h-4 w-4 accent-forest"
          />
          по темата
        </label>
      </div>
      {hint ? <p className={portalUi.hint}>{hint}</p> : null}
    </div>
  );
}
