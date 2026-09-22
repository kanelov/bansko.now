"use client";

import { useState } from "react";
import { createBrandLogoUploadAction, finalizeBrandLogoAction } from "@/app/business/branding/actions";
import { portalUi } from "@/components/business/ui";

type Current = { id: string; url: string | null; width?: number | null } | null;

/**
 * Логото на бизнеса за орнамента над името. Файлът отива направо в R2 с
 * подписан адрес, после сървърът прави размерите и записва ред от вида
 * 'logo'. Формата носи само logo_media_id; записът в темата става с „Запази“.
 * Тук нищо не се трие: старото лого (и изоставените качвания) ги чисти
 * saveBrandingAction, чак след като новата тема е записана - иначе напусне ли
 * собственикът страницата без запис, темата би сочела към изтрит ред.
 */
export function BrandLogoField({ initial }: { initial: Current }) {
  const [current, setCurrent] = useState<Current>(initial);
  const [status, setStatus] = useState<{ kind: "idle" | "busy" | "error"; text?: string }>({ kind: "idle" });

  async function handleFile(file: File | null) {
    if (!file) return;
    setStatus({ kind: "busy", text: "Качва се…" });

    try {
      const ticket = await createBrandLogoUploadAction({ contentType: file.type, bytes: file.size });
      if (!ticket.ok) throw new Error(ticket.error);

      const put = await fetch(ticket.url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!put.ok) throw new Error(`Качването не успя (${put.status}).`);

      setStatus({ kind: "busy", text: "Обработва се…" });
      const result = await finalizeBrandLogoAction({ key: ticket.key });
      if (!result.ok) throw new Error(result.error);

      setCurrent({ id: result.id, url: result.url, width: result.width });
      setStatus({ kind: "idle" });
    } catch (error) {
      setStatus({ kind: "error", text: error instanceof Error ? error.message : "Неуспешно качване." });
    }
  }

  function remove() {
    if (!current) return;
    if (!window.confirm("Да махна ли логото? Орнаментът ще стане листо. Промяната важи след „Запази бранда“.")) return;
    setCurrent(null);
    setStatus({ kind: "idle" });
  }

  const narrow = typeof current?.width === "number" && current.width > 0 && current.width < 400;

  return (
    <div className="grid gap-3 rounded-2xl border border-[var(--stone)] bg-paper/60 p-4">
      <input type="hidden" name="logo_media_id" value={current?.id ?? ""} />
      <div className="flex items-center gap-4">
        {/* Шахматен фон, за да се вижда прозрачността на PNG-то. */}
        <div
          className="flex h-20 w-32 flex-none items-center justify-center overflow-hidden rounded-xl border border-[var(--stone)]"
          style={{
            backgroundColor: "#fff",
            backgroundImage:
              "linear-gradient(45deg, #e7e0d2 25%, transparent 25%), linear-gradient(-45deg, #e7e0d2 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e7e0d2 75%), linear-gradient(-45deg, transparent 75%, #e7e0d2 75%)",
            backgroundSize: "12px 12px",
            backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0"
          }}
        >
          {current?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.url} alt="Лого" className="max-h-16 max-w-28 object-contain" />
          ) : (
            <span className="text-xs text-stone-650">без лого</span>
          )}
        </div>
        <div className="grid gap-2 text-sm">
          <label className="grid gap-1">
            <span className="font-semibold">Лого</span>
            <input
              id="brand-logo-file"
              type="file"
              accept="image/png,image/webp,image/jpeg"
              disabled={status.kind === "busy"}
              onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
              className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-forest file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
          </label>
          <p className={portalUi.hint}>
            Най-добре PNG с прозрачен фон, поне 400 px широко, до 8 MB. Приемат се и WebP и JPEG. Векторно лого (SVG) първо се
            записва като PNG.
          </p>
          {current ? (
            <button type="button" onClick={remove} disabled={status.kind === "busy"} className={portalUi.smallButton + " w-fit"}>
              Махни логото
            </button>
          ) : null}
        </div>
      </div>
      {narrow ? (
        <p className="text-sm text-clay" role="status">
          Логото е само {current?.width} px широко - на телевизора ще изглежда размазано. По-добре качи по-голям файл.
        </p>
      ) : null}
      {status.text ? (
        <p className={status.kind === "error" ? "text-sm font-semibold text-clay" : "text-sm text-stone-650"} role={status.kind === "error" ? "alert" : "status"}>
          {status.text}
        </p>
      ) : null}
    </div>
  );
}
