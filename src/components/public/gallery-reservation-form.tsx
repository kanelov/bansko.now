import Link from "next/link";
import { createGalleryReservationAction } from "@/app/(site)/[locale]/art-studio/gallery/actions";
import { localePath } from "@/lib/i18n";
import type { LocalizedGalleryProduct } from "@/lib/gallery-catalog";
import type { Locale } from "@/lib/types";

const fieldClass = "w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-base text-stone-950 outline-none transition focus:border-forest focus:ring-2 focus:ring-sage";

export function GalleryReservationForm({
  product,
  locale,
  reservationCode,
  reservationError
}: {
  product: LocalizedGalleryProduct;
  locale: Locale;
  reservationCode?: string | null;
  reservationError?: string | null;
}) {
  const isEnglish = locale === "en";
  const safeReservationCode = /^BN-\d{4}-\d{6}$/.test(reservationCode || "") ? reservationCode : null;
  const maxQuantity = Math.min(20, Math.max(...product.variants.map((variant) => variant.quantity_available), 1));

  if (safeReservationCode) {
    return (
      <section id="reserve" className="rounded-lg border border-forest/20 bg-sage/40 p-6" aria-live="polite">
        <p className="text-sm font-semibold uppercase text-moss">{isEnglish ? "Request received" : "Заявката е получена"}</p>
        <h2 className="mt-2 font-serif text-3xl font-semibold text-stone-950">{safeReservationCode}</h2>
        <p className="mt-3 text-sm leading-6 text-stone-700">
          {isEnglish
            ? "Keep this number. We will contact you to confirm availability before pickup and payment at the gallery."
            : "Запази този номер. Ще се свържем с теб, за да потвърдим наличността преди взимане и плащане в галерията."}
        </p>
      </section>
    );
  }

  if (!product.can_reserve || !product.variants.length) {
    return (
      <section id="reserve" className="rounded-lg border border-stone-200 bg-stone-100 p-6">
        <h2 className="font-serif text-2xl font-semibold text-stone-950">{isEnglish ? "Gallery pickup" : "Взимане от галерията"}</h2>
        <p className="mt-3 text-sm leading-6 text-stone-650">{isEnglish ? "This product is not currently available to reserve." : "В момента този продукт не може да бъде резервиран."}</p>
      </section>
    );
  }

  return (
    <form id="reserve" action={createGalleryReservationAction} className="grid gap-5 rounded-lg border border-stone-200 bg-white p-5 shadow-soft sm:p-6">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="product_id" value={product.id} />
      <input type="hidden" name="product_slug" value={product.slug} />
      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <header>
        <p className="text-sm font-semibold uppercase text-moss">{isEnglish ? "Reserve" : "Заяви"}</p>
        <h2 className="mt-2 font-serif text-3xl font-semibold text-stone-950">{isEnglish ? "Pick up from the gallery" : "Вземи от галерията"}</h2>
        <p className="mt-2 text-sm leading-6 text-stone-650">{isEnglish ? "No online payment. We confirm availability, then you collect and pay at the gallery in Bansko." : "Без онлайн плащане. Потвърждаваме наличността, след което взимаш и плащаш на място в галерията в Банско."}</p>
      </header>

      <label className="grid gap-2 text-sm font-semibold text-stone-800">
        {isEnglish ? "Variant" : "Вариант"}
        <select name="variant_id" required className={fieldClass} defaultValue="">
          <option value="" disabled>{isEnglish ? "Choose" : "Избери"}</option>
          {product.variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {[variant.product_type?.name, variant.label].filter(Boolean).join(" · ")}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-semibold text-stone-800">
        {isEnglish ? "Quantity" : "Количество"}
        <input name="quantity" type="number" min={1} max={maxQuantity} defaultValue={1} required className={fieldClass} />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-stone-800">
        {isEnglish ? "Name" : "Име"}
        <input name="customer_name" required autoComplete="name" maxLength={120} className={fieldClass} />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-stone-800">
        {isEnglish ? "Phone" : "Телефон"}
        <input name="customer_phone" type="tel" required autoComplete="tel" maxLength={60} className={fieldClass} />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-stone-800">
        Email
        <input name="customer_email" type="email" required autoComplete="email" maxLength={180} className={fieldClass} />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-stone-800">
        {isEnglish ? "Note (optional)" : "Бележка (по желание)"}
        <textarea name="note" rows={3} maxLength={1200} className={fieldClass} placeholder={isEnglish ? "For example, preferred pickup day" : "Например предпочитан ден за взимане"} />
      </label>
      <label className="choice-row text-sm leading-6 text-stone-650">
        <input type="checkbox" name="accept_terms" required className="choice-control" />
        <span>{isEnglish ? "I accept the" : "Приемам"} <Link href={localePath(locale, "/terms")} className="font-semibold text-forest underline">{isEnglish ? "terms" : "условията"}</Link> {isEnglish ? "and" : "и"} <Link href={localePath(locale, "/privacy")} className="font-semibold text-forest underline">{isEnglish ? "privacy policy" : "политиката за поверителност"}</Link>.</span>
      </label>
      {reservationError ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">
          {isEnglish ? "The request could not be saved. Check the fields or try again." : "Заявката не можа да бъде записана. Провери полетата или опитай отново."}
        </p>
      ) : null}
      <button className="admin-button admin-button-forest w-full px-6 py-4 text-base font-semibold">
        {isEnglish ? "Send pickup request" : "Изпрати заявка за взимане"}
      </button>
    </form>
  );
}
