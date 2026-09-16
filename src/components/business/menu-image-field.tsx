"use client";

import { useState } from "react";
import { createMenuImageUploadAction, deleteMenuImageAction, finalizeMenuImageAction } from "@/app/business/menu/actions";
import { portalUi } from "@/components/business/ui";

type Current = { id: string; url: string | null } | null;

/**
 * Снимка на артикул. Файлът отива направо в R2 с подписан адрес (Vercel реже
 * тела над 4,5 MB), после сървърът прави размерите и връща реда. Формата носи
 * само media_id.
 */
export function MenuImageField({ initial }: { initial: Current }) {
  const [current, setCurrent] = useState<Current>(initial);
  const [status, setStatus] = useState<{ kind: "idle" | "busy" | "error"; text?: string }>({ kind: "idle" });

  async function handleFile(file: File | null) {
    if (!file) return;
    setStatus({ kind: "busy", text: "Качва се…" });

    try {
      const ticket = await createMenuImageUploadAction({ contentType: file.type, bytes: file.size });
      if (!ticket.ok) throw new Error(ticket.error);

      const put = await fetch(ticket.url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!put.ok) throw new Error(`Качването не успя (${put.status}).`);

      setStatus({ kind: "busy", text: "Обработва се…" });
      const result = await finalizeMenuImageAction({ key: ticket.key });
      if (!result.ok) throw new Error(result.error);

      /* Старата снимка си отива чак когато новата е готова. */
      if (current) {
        await deleteMenuImageAction({ id: current.id }).catch(() => undefined);
      }

      setCurrent({ id: result.id, url: result.url });
      setStatus({ kind: "idle" });
    } catch (error) {
      setStatus({ kind: "error", text: error instanceof Error ? error.message : "Неуспешно качване." });
    }
  }

  async function remove() {
    if (!current) return;
    setStatus({ kind: "busy", text: "Премахва се…" });
    await deleteMenuImageAction({ id: current.id }).catch(() => undefined);
    setCurrent(null);
    setStatus({ kind: "idle" });
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-[var(--stone)] bg-paper/60 p-4">
      <input type="hidden" name="media_id" value={current?.id ?? ""} />
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 flex-none overflow-hidden rounded-xl border border-[var(--stone)] bg-white">
          {current?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-stone-650">без снимка</div>
          )}
        </div>
        <div className="grid gap-2 text-sm">
          <label className="grid gap-1">
            <span className="font-semibold">Снимка</span>
            <input
              id="menu-image-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={status.kind === "busy"}
              onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
              className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-forest file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
          </label>
          <p className={portalUi.hint}>JPEG, PNG или WebP до 8 MB. Прави се квадратна миниатюра и три размера за уеб.</p>
          {current ? (
            <button type="button" onClick={remove} disabled={status.kind === "busy"} className={portalUi.smallButton + " w-fit"}>
              Премахни снимката
            </button>
          ) : null}
        </div>
      </div>
      {status.text ? (
        <p className={status.kind === "error" ? "text-sm font-semibold text-clay" : "text-sm text-stone-650"} role={status.kind === "error" ? "alert" : "status"}>
          {status.text}
        </p>
      ) : null}
    </div>
  );
}
