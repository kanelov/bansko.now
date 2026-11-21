"use client";

import { useEffect, useRef, useState } from "react";
import { portalUi } from "@/components/business/ui";
import { slideDurationDefault, slideDurationMax, slideDurationMin, slideHtmlMaxLength } from "@/lib/business-platform/display-slides";
import type { DisplayMediaOption, DisplaySlideForEdit } from "@/lib/business-platform/display-slides";

/**
 * Слайдовете на шаблон „Слайдове“: снимка, видео или готова HTML страница
 * (банер/анимация). Подреждат се с бутони нагоре/надолу (по-лесно на телефон
 * от влачене). Всичко отива като един скрит JSON към формата; сървърът
 * проверява медиите и размера. HTML се показва само в затворена рамка
 * (sandbox без same-origin), и тук, и на телевизора.
 */
export function DisplaySlidesEditor({
  slides,
  onChange,
  media,
  busy
}: {
  slides: DisplaySlideForEdit[];
  onChange: (next: DisplaySlideForEdit[]) => void;
  media: DisplayMediaOption[];
  busy: boolean;
}) {
  const byId = new Map(media.map((item) => [item.id, item]));
  const [fileError, setFileError] = useState("");

  function update(index: number, patch: Partial<DisplaySlideForEdit>) {
    onChange(slides.map((slide, position) => (position === index ? { ...slide, ...patch } : slide)));
  }

  function move(index: number, step: number) {
    const target = index + step;
    if (target < 0 || target >= slides.length) return;
    const next = [...slides];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function addMedia(mediaId: string) {
    onChange([...slides, { kind: "media", mediaId, html: "", title: "", subtitle: "", duration: slideDurationDefault }]);
  }

  async function addHtmlFiles(list: FileList | null) {
    const files = Array.from(list ?? []);
    if (files.length === 0) return;
    setFileError("");
    const added: DisplaySlideForEdit[] = [];
    for (const file of files) {
      const text = await file.text();
      if (text.length > slideHtmlMaxLength) {
        setFileError(`„${file.name}“ е над 200 KB. Снимките в него трябва да са адреси, не вградени файлове.`);
        continue;
      }
      added.push({ kind: "html", mediaId: "", html: text, title: "", subtitle: "", duration: 15 });
    }
    if (added.length) onChange([...slides, ...added]);
  }

  return (
    <div className="grid gap-4">
      <input type="hidden" name="slides_json" value={JSON.stringify(slides)} />

      {slides.length === 0 ? (
        <p className="text-sm text-stone-650">Още няма слайдове. Качи снимка, видео или HTML файл отдолу, или избери от качените.</p>
      ) : (
        <ol className="grid gap-3">
          {slides.map((slide, index) => {
            const item = slide.kind === "media" ? byId.get(slide.mediaId) : undefined;
            const isVideo = item?.mediaType === "video";
            const label = slide.kind === "html" ? "HTML" : isVideo ? "видео" : "снимка";
            return (
              <li key={`${slide.kind}-${slide.mediaId}-${index}`} className="grid gap-3 rounded-2xl border border-[var(--stone)] bg-white p-3 sm:grid-cols-[200px_minmax(0,1fr)]">
                <div className="relative overflow-hidden rounded-xl bg-stone-100">
                  {slide.kind === "html" ? (
                    <HtmlThumb html={slide.html} />
                  ) : item ? (
                    isVideo ? (
                      <video src={item.urls.original ?? undefined} muted playsInline preload="metadata" className="aspect-video w-full object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.urls.w480 ?? item.urls.original ?? ""} alt="" className="aspect-video w-full object-cover" />
                    )
                  ) : (
                    <div className="grid aspect-video place-items-center text-xs text-stone-650">няма файл</div>
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
                    {index + 1} · {label}
                  </span>
                </div>

                <div className="grid gap-2">
                  {slide.kind === "html" ? (
                    <details className="rounded-xl border border-[var(--stone)] bg-paper px-3 py-2">
                      <summary className="cursor-pointer text-sm font-semibold">HTML код ({Math.round(slide.html.length / 1024)} KB)</summary>
                      <textarea
                        value={slide.html}
                        onChange={(event) => update(index, { html: event.target.value.slice(0, slideHtmlMaxLength) })}
                        rows={8}
                        spellCheck={false}
                        aria-label={`HTML код на слайд ${index + 1}`}
                        className="mt-2 w-full rounded-lg border border-[var(--stone)] bg-white p-2 font-mono text-xs"
                      />
                    </details>
                  ) : null}
                  <input
                    value={slide.title}
                    onChange={(event) => update(index, { title: event.target.value })}
                    maxLength={80}
                    placeholder={slide.kind === "html" ? "Надпис отгоре (обикновено празно – страницата си има)" : "Заглавие, например „Пейзажна фотография“"}
                    aria-label={`Заглавие на слайд ${index + 1}`}
                    className={portalUi.input}
                  />
                  <input
                    value={slide.subtitle}
                    onChange={(event) => update(index, { subtitle: event.target.value })}
                    maxLength={160}
                    placeholder="Кратък ред отдолу (не е задължителен)"
                    aria-label={`Подзаглавие на слайд ${index + 1}`}
                    className={portalUi.input}
                  />
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {isVideo ? (
                      <span className={portalUi.hint}>Видеото върви до края си.</span>
                    ) : (
                      <label className="flex items-center gap-2">
                        <span>Стои</span>
                        <input
                          type="number"
                          min={slideDurationMin}
                          max={slideDurationMax}
                          value={slide.duration}
                          onChange={(event) => update(index, { duration: Number(event.target.value) || slideDurationDefault })}
                          className="w-20 rounded-xl border border-[var(--stone)] bg-paper px-3 py-1.5 text-sm"
                        />
                        <span>секунди</span>
                      </label>
                    )}
                    <span className="ml-auto flex gap-1">
                      <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className={portalUi.smallButton} aria-label="По-напред">
                        ↑
                      </button>
                      <button type="button" onClick={() => move(index, 1)} disabled={index === slides.length - 1} className={portalUi.smallButton} aria-label="По-назад">
                        ↓
                      </button>
                      <button type="button" onClick={() => onChange(slides.filter((_, position) => position !== index))} className={portalUi.smallButton}>
                        Махни
                      </button>
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <label className="grid gap-1 text-sm">
        <span className="font-semibold">Добави HTML слайд</span>
        <input
          type="file"
          multiple
          accept=".html,.htm,text/html"
          disabled={busy}
          onChange={(event) => {
            void addHtmlFiles(event.target.files);
            event.target.value = "";
          }}
          className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-forest file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
        />
        <span className={portalUi.hint}>
          Готова страница 1920 × 1080 (например банер, направен с Claude), до 200 KB. Снимките в нея трябва да са адреси от интернет. На телевизора
          върви в затворена рамка, без звук и без достъп до сайта.
        </span>
        {fileError ? (
          <span className="text-sm text-clay" role="alert">
            {fileError}
          </span>
        ) : null}
      </label>

      {media.length > 0 ? (
        <details className="rounded-2xl border border-[var(--stone)] bg-paper/60 p-3">
          <summary className="cursor-pointer text-sm font-semibold">Добави от качените снимки и видеа ({media.length})</summary>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {media.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => addMedia(item.id)}
                  className="w-full overflow-hidden rounded-xl border-2 border-transparent bg-white transition hover:border-forest"
                  title="Добави като слайд"
                >
                  {item.mediaType === "video" ? (
                    <video src={item.urls.original ?? undefined} muted playsInline preload="metadata" className="aspect-video w-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.urls.w480 ?? item.urls.original ?? ""} alt="" className="aspect-video w-full object-cover" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

/** Малък преглед на HTML слайда: страницата 1920 × 1080, смалена до ширината на кутията. */
function HtmlThumb({ html }: { html: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.1);

  useEffect(() => {
    const element = boxRef.current;
    if (!element) return;
    const update = () => setScale(element.clientWidth / 1920);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={boxRef} className="relative aspect-video w-full overflow-hidden bg-black">
      <iframe
        title="HTML слайд"
        sandbox="allow-scripts"
        srcDoc={html}
        style={{ width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: "0 0", border: 0, pointerEvents: "none" }}
      />
    </div>
  );
}
