"use client";

import { portalUi } from "@/components/business/ui";
import { slideDurationDefault, slideDurationMax, slideDurationMin } from "@/lib/business-platform/display-slides";
import type { DisplayMediaOption, DisplaySlideForEdit } from "@/lib/business-platform/display-slides";

/**
 * Слайдовете на шаблон „Слайдове“: списък с картинка или видео, заглавие,
 * подзаглавие и секунди, подреждан с бутони нагоре/надолу (по-лесно на
 * телефон от влачене). Носи всичко като един скрит JSON към формата; сървърът
 * проверява, че медиите са на бизнеса. Видеото върви до края си, секундите
 * важат за снимките.
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

  function add(mediaId: string) {
    onChange([...slides, { mediaId, title: "", subtitle: "", duration: slideDurationDefault }]);
  }

  return (
    <div className="grid gap-4">
      <input type="hidden" name="slides_json" value={JSON.stringify(slides)} />

      {slides.length === 0 ? (
        <p className="text-sm text-stone-650">Още няма слайдове. Качи снимка или видео отдолу, или избери от качените.</p>
      ) : (
        <ol className="grid gap-3">
          {slides.map((slide, index) => {
            const item = byId.get(slide.mediaId);
            const isVideo = item?.mediaType === "video";
            return (
              <li key={`${slide.mediaId}-${index}`} className="grid gap-3 rounded-2xl border border-[var(--stone)] bg-white p-3 sm:grid-cols-[160px_minmax(0,1fr)]">
                <div className="relative overflow-hidden rounded-xl bg-stone-100">
                  {item ? (
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
                    {index + 1} · {isVideo ? "видео" : "снимка"}
                  </span>
                </div>

                <div className="grid gap-2">
                  <input
                    value={slide.title}
                    onChange={(event) => update(index, { title: event.target.value })}
                    maxLength={80}
                    placeholder="Заглавие, например „Пейзажна фотография“"
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
                      <button
                        type="button"
                        onClick={() => onChange(slides.filter((_, position) => position !== index))}
                        className={portalUi.smallButton}
                        aria-label="Махни слайда"
                      >
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

      {media.length > 0 ? (
        <details className="rounded-2xl border border-[var(--stone)] bg-paper/60 p-3">
          <summary className="cursor-pointer text-sm font-semibold">Добави от качените ({media.length})</summary>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {media.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => add(item.id)}
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
