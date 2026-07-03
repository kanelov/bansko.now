import Link from "next/link";
import type { Route } from "next";
import type { ArtStudioService } from "@/lib/types";

const fallbackServiceImage = "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80";

export function ArtStudioServiceCard({
  service,
  featured = false
}: {
  service: ArtStudioService;
  featured?: boolean;
}) {
  const href = service.button_url || "/contact";
  const isExternal = /^https?:\/\//i.test(href);
  const image = service.image_url || fallbackServiceImage;

  return (
    <article
      className={[
        "group overflow-hidden rounded-2xl border bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(38,31,22,0.13)]",
        featured || service.is_premium ? "border-forest/25 md:grid md:grid-cols-[1.05fr_0.95fr]" : "border-stone-200"
      ].join(" ")}
    >
      <div className={featured || service.is_premium ? "min-h-72 overflow-hidden bg-sage" : "aspect-[4/3] overflow-hidden bg-sage"}>
        <img
          src={image}
          alt={service.image_alt || service.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading={featured || service.is_premium ? "eager" : "lazy"}
        />
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
            href={href as Route}
            className="mt-6 inline-flex w-fit rounded-full bg-forest px-5 py-3 text-sm font-semibold text-white transition hover:bg-moss"
          >
            {service.button_label || "Виж повече"}
          </Link>
        )}
      </div>
    </article>
  );
}
