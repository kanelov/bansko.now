"use client";

import { useEffect, useRef, useState } from "react";
import { startBusinessCheckoutAction } from "@/app/business/subscription/actions";
import { portalUi } from "@/components/business/ui";

/**
 * Прозорецът „Абонирай се“: два начина за плащане на план „Бизнес“ –
 * месечен абонамент (Stripe таксува сам всеки месец) или едно плащане за
 * един месец. И двата водят към страницата за плащане на Stripe.
 */
export function SubscribeDialog({ priceLabel, label }: { priceLabel: string; label: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={portalUi.primaryButton}>
        {label}
      </button>

      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === ref.current) setOpen(false);
        }}
        className="m-auto w-[min(92vw,30rem)] rounded-3xl border border-[var(--stone)] bg-white p-0 text-stone-950 backdrop:bg-black/40"
      >
        <div className="grid gap-5 p-6">
          <header className="flex items-start justify-between gap-4">
            <div>
              <p className={portalUi.eyebrow}>План „Бизнес“</p>
              <h2 className="font-display mt-1 text-2xl font-semibold text-forest">Как искаш да платиш?</h2>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Затвори" className="rounded-full px-2 text-2xl leading-none text-stone-650 hover:text-stone-950">
              ×
            </button>
          </header>

          <form action={startBusinessCheckoutAction} className="grid gap-2 rounded-2xl border-2 border-forest bg-sage/40 p-4">
            <input type="hidden" name="mode" value="subscription" />
            <p className="text-base font-semibold">Месечен абонамент</p>
            <p className="text-sm text-stone-650">
              {priceLabel} всеки месец от картата, без да мислиш за това. Спира се с един бутон, когато поискаш.
            </p>
            <button type="submit" className={portalUi.primaryButton + " mt-1"}>
              Абонирай се със Stripe
            </button>
          </form>

          <form action={startBusinessCheckoutAction} className="grid gap-2 rounded-2xl border border-[var(--stone)] p-4">
            <input type="hidden" name="mode" value="one_time" />
            <p className="text-base font-semibold">Еднократно за един месец</p>
            <p className="text-sm text-stone-650">{priceLabel} веднъж. След месец плащаш отново, ако искаш да продължиш.</p>
            <button type="submit" className={portalUi.secondaryButton + " mt-1"}>
              Плати един месец
            </button>
          </form>

          <p className={portalUi.hint}>Плащането е с карта на сигурната страница на Stripe. Bansko NOW не вижда данните на картата.</p>
        </div>
      </dialog>
    </>
  );
}
