import type { PublicDisplaySlide } from "@/lib/business-platform/displays";

/**
 * Слайдовете на телевизора: всички са един върху друг, скриптът показва по
 * един. Видеото носи адреса си в data-src и се зарежда само когато е на ред,
 * за да не държи паметта на телевизора с всички видеа наведнъж. Без Tailwind
 * и без нови CSS функции – браузърът на Tizen е Chromium 85.
 */
export function DisplaySlides({ slides, businessName }: { slides: PublicDisplaySlide[]; businessName: string }) {
  if (slides.length === 0) {
    return <p className="display-empty">Слайдовете се подготвят</p>;
  }

  return (
    <div id="display-slides" className="display-slides">
      {slides.map((slide, index) => {
        const image = slide.urls.w1600 ?? slide.urls.original ?? "";
        const hasText = Boolean(slide.title || slide.subtitle);
        const kind = slide.kind === "html" ? "html" : slide.mediaType ?? "image";
        return (
          <section
            key={index}
            className={index === 0 ? "display-slide is-active" : "display-slide"}
            data-kind={kind}
            data-duration={slide.duration}
          >
            {slide.kind === "html" ? (
              /* Затворена рамка: скриптовете вървят, но без достъп до bansko.now, бисквитки и навигация.
                 Съдържанието се слага от скрипта на телевизора, когато слайдът е на ред (анимацията почва отначало). */
              <iframe title={slide.title || businessName} sandbox="allow-scripts" data-html={slide.html} tabIndex={-1} />
            ) : slide.mediaType === "video" ? (
              <video data-src={slide.urls.original ?? ""} muted playsInline preload="none" />
            ) : image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={slide.alt ?? slide.title ?? businessName} />
            ) : null}
            {hasText ? (
              <div className="display-slide-text">
                {slide.title ? <h2>{slide.title}</h2> : null}
                {slide.subtitle ? <p>{slide.subtitle}</p> : null}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
