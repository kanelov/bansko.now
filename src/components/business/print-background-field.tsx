"use client";

import { useState } from "react";
import { createPrintBackgroundUploadAction, deletePrintBackgroundAction, finalizePrintBackgroundAction } from "@/app/business/print/actions";
import { portalUi } from "@/components/business/ui";

type Background = { id: string; url: string | null };

/**
 * Фон за менюто за печат: „без фон“ или една от качените снимки. Новата снимка
 * отива направо в R2 с подписан адрес; формата носи само bg=<id>.
 */
export function PrintBackgroundField({ initial }: { initial: Background[] }) {
  const [items, setItems] = useState(initial);
  const [selected, setSelected] = useState<string>("");
  const [status, setStatus] = useState<{ kind: "idle" | "busy" | "error"; text?: string }>({ kind: "idle" });

  async function handleFile(file: File | null) {
    if (!file) return;
    setStatus({ kind: "busy", text: "Качва се…" });

    try {
      const ticket = await createPrintBackgroundUploadAction({ contentType: file.type, bytes: file.size });
      if (!ticket.ok) throw new Error(ticket.error);

      const put = await fetch(ticket.url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!put.ok) throw new Error(`Качването не успя (${put.status}).`);

      setStatus({ kind: "busy", text: "Обработва се…" });
      const result = await finalizePrintBackgroundAction({ key: ticket.key });
      if (!result.ok) throw new Error(result.error);

      setItems((current) => [{ id: result.id, url: result.url }, ...current]);
      setSelected(result.id);
      setStatus({ kind: "idle" });
    } catch (error) {
      setStatus({ kind: "error", text: error instanceof Error ? error.message : "Неуспешно качване." });
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Да изтрия ли тази снимка?")) return;
    setStatus({ kind: "busy", text: "Премахва се…" });
    const result = await deletePrintBackgroundAction({ id });
    if (result.ok) {
      setItems((current) => current.filter((item) => item.id !== id));
      if (selected === id) setSelected("");
      setStatus({ kind: "idle" });
    } else {
      setStatus({ kind: "error", text: result.error ?? "Изтриването не успя." });
    }
  }

  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-semibold">Фон</legend>
      <input type="hidden" name="bg" value={selected} />

      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        <li>
          <button
            type="button"
            onClick={() => setSelected("")}
            aria-pressed={selected === ""}
            className={
              selected === ""
                ? "flex aspect-[3/4] w-full items-center justify-center rounded-xl border-2 border-forest bg-paper text-xs font-semibold"
                : "flex aspect-[3/4] w-full items-center justify-center rounded-xl border-2 border-[var(--stone)] bg-paper text-xs font-semibold text-stone-650"
            }
          >
            Без фон
          </button>
        </li>
        {items.map((item) => (
          <li key={item.id} className="grid gap-1">
            <button
              type="button"
              onClick={() => setSelected(item.id)}
              aria-pressed={selected === item.id}
              className={
                selected === item.id
                  ? "overflow-hidden rounded-xl border-2 border-forest bg-white"
                  : "overflow-hidden rounded-xl border-2 border-transparent bg-white transition hover:border-[var(--stone)]"
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url ?? ""} alt="" className="aspect-[3/4] w-full object-cover" />
            </button>
            <button type="button" onClick={() => remove(item.id)} disabled={status.kind === "busy"} className="text-xs text-stone-650 hover:text-clay">
              Изтрий
            </button>
          </li>
        ))}
      </ul>

      <label className="grid gap-1 text-sm">
        <span className="font-semibold">Качи снимка за фон</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={status.kind === "busy"}
          onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
          className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-forest file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
        />
        <span className={portalUi.hint}>
          До 8 MB. За А4 стигат 2 500 px по дългата страна, за А3 – 3 500 px. Върху снимката има воал, за да се чете текстът.
        </span>
      </label>

      {status.kind === "busy" ? <p className="text-sm text-stone-650">{status.text}</p> : null}
      {status.kind === "error" ? (
        <p className="text-sm text-clay" role="alert">
          {status.text}
        </p>
      ) : null}
    </fieldset>
  );
}
