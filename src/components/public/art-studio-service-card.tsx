import Link from "next/link";
import type { Route } from "next";
import type { ArtStudioService } from "@/lib/types";
import { localePath } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export function ArtStudioServiceCard({
  service,
  featured = false,
  locale = "bg"
}: {
  service: ArtStudioService;
  featured?: boolean;
  locale?: Locale;
}) {
  const href = service.button_url || localePath(locale, "/contact");
  const isExternal = /^https?:\/\//i.test(href);

  return (
    <article
      className={[
        "group overflow-hidden rounded-2xl border bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(38,31,22,0.13)]",
        featured || service.is_premium ? "border-forest/25 md:grid md:grid-cols-[1.05fr_0.95fr]" : "border-stone-200"
      ].join(" ")}
    >
      <div className={featured || service.is_premium ? "min-h-72 overflow-hidden bg-sage" : "aspect-[4/3] overflow-hidden bg-sage"}>
        {service.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- deliberate: no Vercel image optimization traffic
          <img
            src={service.image_url}
            alt={service.image_alt || service.title}
            width={1200}
            height={900}
            decoding="async"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading={featured || service.is_premium ? "eager" : "lazy"}
          />
        ) : (
          <div className="grid h-full min-h-48 w-full place-items-center bg-[radial-gradient(circle_at_30%_30%,rgba(24,59,42,0.12),transparent_60%)] text-forest" aria-hidden="true">
            <span className="font-serif text-5xl font-semibold opacity-30">A</span>
          </div>
        )}
      </div>
      <div className="flex flex-col p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-sage px-3 py-1 text-xs font-semibold text-forest">Art Studio</span>
          {service.is_premium ? (
            <span className="rounded-full bg-forest px-3 py-1 text-xs font-semibold text-white">Premium</span>
          ) : null}
          {service.price_label ? (
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
              {service.price_label}
            </span>
          ) : null}
        </div>
        <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight text-stone-950">{service.title}</h2>
        {service.description ? (
          <p className="mt-3 text-sm leading-6 text-stone-650">{service.description}</p>
        ) : null}
        {service.features?.length ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {service.features.slice(0, featured || service.is_premium ? 6 : 4).map((feature) => (
              <span key={feature} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                {feature}
              </span>
            ))}
          </div>
        ) : null}
        {isExternal ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex w-fit rounded-full bg-forest px-5 py-3 text-sm font-semibold text-white transition hover:bg-moss"
          >
            {service.button_label || "Виж повече"}
          </a>
        ) : (
          <Link
            href={localePath(locale, href) as Route}
            className="mt-6 inline-flex w-fit rounded-full bg-forest px-5 py-3 text-sm font-semibold text-white transition hover:bg-moss"
          >
            {service.button_label || (locale === "en" ? "Learn more" : "Виж повече")}
          </Link>
        )}
      </div>
    </article>
  );
}
