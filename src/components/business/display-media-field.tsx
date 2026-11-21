"use client";

import { useState } from "react";
import {
  createDisplayImageUploadAction,
  deleteDisplayMediaAction,
  finalizeDisplayImageAction,
  finalizeDisplayVideoAction
} from "@/app/business/displays/actions";
import { DisplaySlidesEditor } from "@/components/business/display-slides-editor";
import { portalUi } from "@/components/business/ui";
import type { DisplayMediaOption, DisplaySlideForEdit } from "@/lib/business-platform/display-slides";
import { slideDurationDefault } from "@/lib/business-platform/display-slides";
import type { BusinessDisplayTemplate } from "@/lib/types";

const templateOptions: { value: BusinessDisplayTemplate; label: string; hint: string }[] = [
  { value: "menu_only", label: "Само меню", hint: "Целият екран е менюто." },
  { value: "menu_image", label: "Меню + снимка", hint: "Менюто вляво, снимка вдясно." },
  { value: "menu_video", label: "Меню + видео", hint: "Менюто вляво, видео в цикъл, без звук." },
  { value: "slides", label: "Слайдове", hint: "Снимки и видеа на цял екран, едно след друго." }
];

/**
 * Медията на екрана. Шаблонът се избира тук, за да знае полето какво да
 * покаже: една снимка, едно видео или списък слайдове. Снимките и видеата се
 * качват направо в R2 с подписан адрес (заобикаля ограничението на Vercel от
 * 4,5 MB), после сървърът записва реда; за снимките прави и размерите.
 * Видеото е MP4 до 150 MB, качено както е.
 */
export function DisplayMediaField({
  options,
  initialMediaId,
  initialTemplate,
  initialSlides
}: {
  options: DisplayMediaOption[];
  initialMediaId: string | null;
  initialTemplate: BusinessDisplayTemplate;
  initialSlides: DisplaySlideForEdit[];
}) {
  const [items, setItems] = useState(options);
  const [selected, setSelected] = useState<string | null>(initialMediaId);
  const [template, setTemplate] = useState<BusinessDisplayTemplate>(initialTemplate);
  const [slides, setSlides] = useState<DisplaySlideForEdit[]>(initialSlides);
  const [status, setStatus] = useState<{ kind: "idle" | "busy" | "error"; text?: string }>({ kind: "idle" });

  const wanted = template === "menu_video" ? "video" : "image";
  const visible = items.filter((item) => item.mediaType === wanted);
  const busy = status.kind === "busy";

  async function upload(file: File): Promise<DisplayMediaOption> {
    const isVideo = file.type === "video/mp4";
    const ticket = await createDisplayImageUploadAction({ contentType: file.type, bytes: file.size, mediaType: isVideo ? "video" : "image" });
    if (!ticket.ok) throw new Error(ticket.error);

    setStatus({ kind: "busy", text: isVideo ? "Видеото се качва… (може да отнеме минута)" : "Качва се…" });
    const put = await fetch(ticket.url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    if (!put.ok) throw new Error(`Качването не успя (${put.status}).`);

    setStatus({ kind: "busy", text: "Обработва се…" });
    const result = isVideo ? await finalizeDisplayVideoAction({ key: ticket.key }) : await finalizeDisplayImageAction({ key: ticket.key });
    if (!result.ok) throw new Error(result.error);

    return {
      id: result.id,
      mediaType: isVideo ? "video" : "image",
      alt: null,
      urls: isVideo ? { original: result.url, w480: null, w960: null, w1600: null } : { original: null, w480: result.url, w960: null, w1600: null },
      createdAt: new Date().toISOString()
    };
  }

  async function handleFiles(list: FileList | null) {
    const files = Array.from(list ?? []);
    if (files.length === 0) return;
    setStatus({ kind: "busy", text: "Качва се…" });

    try {
      const added: DisplayMediaOption[] = [];
      for (const file of files) {
        added.push(await upload(file));
      }
      setItems((current) => [...added.reverse(), ...current]);
      if (template === "slides") {
        setSlides((current) => [...current, ...added.reverse().map((item) => ({ kind: "media" as const, mediaId: item.id, html: "", title: "", subtitle: "", duration: slideDurationDefault }))]);
      } else {
        setSelected(added[0].id);
      }
      setStatus({ kind: "idle" });
    } catch (error) {
      setStatus({ kind: "error", text: error instanceof Error ? error.message : "Неуспешно качване." });
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Да изтрия ли този файл? Екраните и слайдовете, които го ползват, ще останат без него.")) return;
    setStatus({ kind: "busy", text: "Премахва се…" });
    const result = await deleteDisplayMediaAction({ id });
    if (result.ok) {
      setItems((current) => current.filter((item) => item.id !== id));
      setSlides((current) => current.filter((slide) => slide.mediaId !== id));
      if (selected === id) setSelected(null);
      setStatus({ kind: "idle" });
    } else {
      setStatus({ kind: "error", text: result.error ?? "Изтриването не успя." });
    }
  }

  return (
    <div className="grid gap-4">
      <fieldset className="grid gap-2">
        <legend className="text-sm font-semibold">Шаблон</legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {templateOptions.map((option) => {
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
                <input type="radio" name="template" value={option.value} checked={active} onChange={() => setTemplate(option.value)} className="sr-only" />
                <span className="block text-sm font-semibold">{option.label}</span>
                <span className={active ? "mt-1 block text-xs text-white/80" : "mt-1 block text-xs text-stone-650"}>{option.hint}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {template === "slides" ? (
        <div className="grid gap-3 rounded-2xl border border-[var(--stone)] bg-paper/60 p-4">
          <p className="text-sm font-semibold">Слайдове</p>
          <DisplaySlidesEditor slides={slides} onChange={setSlides} media={items} busy={busy} />
        </div>
      ) : template !== "menu_only" ? (
        <div className="grid gap-3 rounded-2xl border border-[var(--stone)] bg-paper/60 p-4">
          <input type="hidden" name="media_id" value={selected ?? ""} />
          <p className="text-sm font-semibold">{wanted === "video" ? "Видео" : "Снимка"}</p>

          {visible.length === 0 ? (
            <p className="text-sm text-stone-650">{wanted === "video" ? "Още няма качено видео." : "Още няма качена снимка за екран."}</p>
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
                    <button type="button" onClick={() => remove(item.id)} disabled={busy} className="text-xs text-stone-650 hover:text-clay">
                      Изтрий
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      {template !== "menu_only" ? (
        <label className="grid gap-1 text-sm">
          <span className="font-semibold">{template === "slides" ? "Качи снимки или видеа" : wanted === "video" ? "Качи видео" : "Качи снимка"}</span>
          <input
            type="file"
            multiple={template === "slides"}
            accept={template === "slides" ? "image/jpeg,image/png,image/webp,video/mp4" : wanted === "video" ? "video/mp4" : "image/jpeg,image/png,image/webp"}
            disabled={busy}
            onChange={(event) => {
              void handleFiles(event.target.files);
              event.target.value = "";
            }}
            className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-forest file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
          <span className={portalUi.hint}>
            Снимки: JPEG, PNG или WebP до 8 MB{template === "slides" ? ", най-добре хоризонтални 1920 × 1080" : ""}. Видео: MP4 до 150 MB, най-добре 1080p и до
            минута, без звук.
          </span>
        </label>
      ) : null}

      {status.kind === "busy" ? <p className="text-sm text-stone-650">{status.text}</p> : null}
      {status.kind === "error" ? (
        <p className="text-sm text-clay" role="alert">
          {status.text}
        </p>
      ) : null}
    </div>
  );
}
