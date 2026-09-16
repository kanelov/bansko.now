"use client";

import { useState } from "react";
import { createDisplayImageUploadAction, deleteDisplayMediaAction, finalizeDisplayImageAction } from "@/app/business/displays/actions";
import { portalUi } from "@/components/business/ui";
import type { DisplayMediaOption } from "@/lib/business-platform/displays";
import type { BusinessDisplayTemplate } from "@/lib/types";

/**
 * Медията на екрана: за „Меню + снимка“ собственикът избира от качените или
 * качва нова (направо в R2 с подписан адрес, после сървърът прави размерите);
 * за „Меню + видео“ избира от видеата, които Bansko NOW е качил за бизнеса -
 * така файлът е винаги MP4 в правилния размер за телевизор. Полето се показва
 * според избрания шаблон и носи само media_id.
 */
export function DisplayMediaField({
  options,
  initialMediaId,
  initialTemplate
}: {
  options: DisplayMediaOption[];
  initialMediaId: string | null;
  initialTemplate: BusinessDisplayTemplate;
}) {
  const [items, setItems] = useState(options);
  const [selected, setSelected] = useState<string | null>(initialMediaId);
  const [template, setTemplate] = useState<BusinessDisplayTemplate>(initialTemplate);
  const [status, setStatus] = useState<{ kind: "idle" | "busy" | "error"; text?: string }>({ kind: "idle" });

  const wanted = template === "menu_video" ? "video" : "image";
  const visible = items.filter((item) => item.mediaType === wanted);

  async function handleFile(file: File | null) {
    if (!file) return;
    setStatus({ kind: "busy", text: "Качва се…" });

    try {
      const ticket = await createDisplayImageUploadAction({ contentType: file.type, bytes: file.size });
      if (!ticket.ok) throw new Error(ticket.error);

      const put = await fetch(ticket.url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!put.ok) throw new Error(`Качването не успя (${put.status}).`);

      setStatus({ kind: "busy", text: "Обработва се…" });
      const result = await finalizeDisplayImageAction({ key: ticket.key });
      if (!result.ok) throw new Error(result.error);

      setItems((current) => [
        { id: result.id, mediaType: "image", alt: null, urls: { original: null, w480: result.url, w960: null, w1600: null }, createdAt: new Date().toISOString() },
        ...current
      ]);
      setSelected(result.id);
      setStatus({ kind: "idle" });
    } catch (error) {
      setStatus({ kind: "error", text: error instanceof Error ? error.message : "Неуспешно качване." });
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Да изтрия ли тази снимка? Екраните, които я ползват, ще останат без снимка.")) return;
    setStatus({ kind: "busy", text: "Премахва се…" });
    const result = await deleteDisplayMediaAction({ id });
    if (result.ok) {
      setItems((current) => current.filter((item) => item.id !== id));
      if (selected === id) setSelected(null);
      setStatus({ kind: "idle" });
    } else {
      setStatus({ kind: "error", text: result.error ?? "Изтриването не успя." });
    }
  }

  return (
    <div className="grid gap-4">
      {/* Шаблонът се избира тук, за да знае полето какъв вид медия да покаже. */}
      <fieldset className="grid gap-2">
        <legend className="text-sm font-semibold">Шаблон</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {(
            [
              { value: "menu_only", label: "Само меню", hint: "Целият екран е менюто." },
              { value: "menu_image", label: "Меню + снимка", hint: "Менюто вляво, снимка вдясно." },
              { value: "menu_video", label: "Меню + видео", hint: "Менюто вляво, видео в цикъл, без звук." }
            ] as { value: BusinessDisplayTemplate; label: string; hint: string }[]
          ).map((option) => {
            const active = option.value === template;
            return (
              <label
                key={option.value}
                className={
                  active
                    ? "cursor-pointer rounded-2xl border border-forest bg-forest px-4 py-3 text-white"
                    : "cursor-pointer rounded-2xl border border-[var(--stone)] bg-paper px-4 py-3 transition hover:border-forest"
                }
              >
                <input
                  type="radio"
                  name="template"
                  value={option.value}
                  checked={active}
                  onChange={() => setTemplate(option.value)}
                  className="sr-only"
                />
                <span className="block text-sm font-semibold">{option.label}</span>
                <span className={active ? "mt-1 block text-xs text-white/80" : "mt-1 block text-xs text-stone-650"}>{option.hint}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {template !== "menu_only" ? (
        <div className="grid gap-3 rounded-2xl border border-[var(--stone)] bg-paper/60 p-4">
          <input type="hidden" name="media_id" value={selected ?? ""} />
          <p className="text-sm font-semibold">{wanted === "video" ? "Видео" : "Снимка"}</p>

          {visible.length === 0 ? (
            <p className="text-sm text-stone-650">
              {wanted === "video"
                ? "Още няма видео за този бизнес. Видеото се подготвя и качва от Bansko NOW (MP4, 1080p, до 60 секунди), за да е сигурно, че върви на телевизор."
                : "Още няма качена снимка за екран."}
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {visible.map((item) => {
                const active = item.id === selected;
                return (
                  <li key={item.id} className="grid gap-1">
                    <button
                      type="button"
                      onClick={() => setSelected(item.id)}
                      aria-pressed={active}
                      className={
                        active
                          ? "overflow-hidden rounded-xl border-2 border-forest bg-white"
                          : "overflow-hidden rounded-xl border-2 border-transparent bg-white transition hover:border-[var(--stone)]"
                      }
                    >
                      {item.mediaType === "video" ? (
                        <video src={item.urls.original ?? undefined} muted playsInline preload="metadata" className="aspect-video w-full object-cover" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.urls.w480 ?? item.urls.original ?? ""} alt={item.alt ?? ""} className="aspect-video w-full object-cover" />
                      )}
                    </button>
                    {item.mediaType === "image" ? (
                      <button type="button" onClick={() => remove(item.id)} disabled={status.kind === "busy"} className="text-xs text-stone-650 hover:text-clay">
                        Изтрий
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}

          {wanted === "image" ? (
            <label className="grid gap-1 text-sm">
              <span className="font-semibold">Качи нова снимка</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={status.kind === "busy"}
                onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
                className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-forest file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
              <span className={portalUi.hint}>JPEG, PNG или WebP до 8 MB, най-добре вертикална (екранът ѝ дава 30 % от ширината).</span>
            </label>
          ) : null}

          {status.kind === "busy" ? <p className="text-sm text-stone-650">{status.text}</p> : null}
          {status.kind === "error" ? (
            <p className="text-sm text-clay" role="alert">
              {status.text}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
