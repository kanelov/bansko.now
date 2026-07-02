import type { Business, BusinessFaq, BusinessTier } from "@/lib/types";

export const businessCategories = [
  "Ресторанти",
  "Кафета",
  "Хотели",
  "Къщи за гости",
  "Услуги",
  "Магазини",
  "Активности",
  "Здраве и спорт",
  "Транспорт",
  "Култура"
];

export const businessFeatures = [
  "Wi-Fi",
  "Паркинг",
  "Плащане с карта",
  "Pet friendly",
  "Подходящо за семейства",
  "Доставка",
  "Работи целогодишно",
  "Английски език",
  "Тераса",
  "Достъпно за колички"
];

export const businessServices = [
  "Професионално заснемане",
  "Видео представяне",
  "Дрон кадри",
  "Дизайн и визуална идентичност",
  "Искам индивидуална оферта"
];

export function isPaidTierActive(business: Pick<Business, "listing_tier" | "paid_until" | "payment_status">) {
  return (
    business.payment_status === "paid" &&
    business.listing_tier !== "free" &&
    Boolean(business.paid_until) &&
    new Date(business.paid_until as string).getTime() > Date.now()
  );
}

export function getEffectiveBusinessTier(business: Pick<Business, "listing_tier" | "paid_until" | "payment_status">): BusinessTier {
  return isPaidTierActive(business) ? business.listing_tier : "free";
}

export function getBusinessPath(business: Pick<Business, "slug">) {
  return `/businesses/${business.slug}`;
}

export function getDirectionsUrl(business: Pick<Business, "latitude" | "longitude" | "address" | "name">) {
  if (typeof business.latitude === "number" && typeof business.longitude === "number") {
    return `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`;
  }

  const query = encodeURIComponent(`${business.name}, ${business.address}, Bansko`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function videoSearchParams(provider: "youtube" | "vimeo", id: string, autoplay?: boolean) {
  if (!autoplay) {
    return "";
  }

  const params =
    provider === "youtube"
      ? new URLSearchParams({
          autoplay: "1",
          mute: "1",
          loop: "1",
          playlist: id,
          controls: "0",
          playsinline: "1",
          rel: "0",
          modestbranding: "1"
        })
      : new URLSearchParams({
          autoplay: "1",
          muted: "1",
          loop: "1",
          background: "1",
          controls: "0"
        });

  return `?${params.toString()}`;
}

export function getBusinessVideoEmbedUrl(videoLink: string | null | undefined, options?: { autoplay?: boolean }) {
  if (!videoLink) {
    return null;
  }

  try {
    const url = new URL(videoLink);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}${videoSearchParams("youtube", id, options?.autoplay)}` : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      const id = url.searchParams.get("v") || url.pathname.split("/").filter(Boolean).at(-1);
      return id ? `https://www.youtube.com/embed/${id}${videoSearchParams("youtube", id, options?.autoplay)}` : null;
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = url.pathname.split("/").filter(Boolean).at(-1);
      return id ? `https://player.vimeo.com/video/${id}${videoSearchParams("vimeo", id, options?.autoplay)}` : null;
    }

    return videoLink.includes("/embed/") || videoLink.includes("player.vimeo.com") ? videoLink : null;
  } catch {
    return null;
  }
}

export function parseBusinessFaqs(value: unknown): BusinessFaq[] {
  return Array.isArray(value)
    ? value
        .map((item) => {
          if (!item || typeof item !== "object") {
            return null;
          }

          const record = item as Record<string, unknown>;
          const question = typeof record.question === "string" ? record.question : "";
          const answer = typeof record.answer === "string" ? record.answer : "";

          return question && answer ? { question, answer } : null;
        })
        .filter(Boolean) as BusinessFaq[]
    : [];
}
