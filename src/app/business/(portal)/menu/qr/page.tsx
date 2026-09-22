import type { Metadata } from "next";
import Link from "next/link";
import { PrintButton } from "@/components/business/print-button";
import { portalUi } from "@/components/business/ui";
import { requireBusinessOwner } from "@/lib/business-platform/auth";
import { qrPngDataUrl, qrSvg } from "@/lib/business-platform/qr";
import { getBusinessTheme, qrColorFor } from "@/lib/business-platform/theme";
import { siteUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: "QR код за менюто"
};

/** QR кодът сочи към българското меню; страницата има превключвател към английски. */
export default async function MenuQrPage() {
  const { supabase, business } = await requireBusinessOwner();
  const menuUrl = `${siteUrl}/places/${business.slug}/menu`;
  const qrTarget = `${menuUrl}?src=qr`;
  /* Цветът на кода следва темата на бизнеса (акцентът, ако е достатъчно тъмен на бяло). */
  const { theme } = await getBusinessTheme(supabase, business.businessId);
  const dark = qrColorFor(theme);
  const [png, svg] = [await qrPngDataUrl(qrTarget, 1024, { dark }), qrSvg(qrTarget, { light: null, dark })];
  const svgHref = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  return (
    <div className="grid gap-6">
      <header className="print:hidden">
        <p className={portalUi.eyebrow}>Меню</p>
        <h1 className={portalUi.h1}>QR код за менюто</h1>
        <p className="mt-2 max-w-xl text-sm text-stone-650">
          Гостът го сканира с телефона и вижда менюто с актуалните цени. Кодът не се сменя — каквото промениш в „Меню“, е вътре. Цветът му е от темата на бизнеса („Брандиране“), а кодът с листото се чете като всеки друг; за печатница вземи SVG-то.
        </p>
      </header>

      <section className={portalUi.card + " grid gap-5 print:border-0 print:p-0"}>
        <div className="mx-auto grid max-w-sm gap-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={png} alt={`QR код към ${menuUrl}`} width={1024} height={1024} className="mx-auto w-full max-w-72 rounded-2xl border border-[var(--stone)] bg-white p-3" />
          <p className="font-display text-2xl font-semibold text-forest">{business.name}</p>
          <p className="text-sm text-stone-650 print:text-base">Сканирай за менюто · Scan for the menu</p>
          <p className="break-all text-xs text-stone-500">{menuUrl}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 print:hidden">
          <a href={png} download={`qr-menu-${business.slug}.png`} className={portalUi.primaryButton}>
            Свали PNG
          </a>
          <a href={svgHref} download={`qr-menu-${business.slug}.svg`} className={portalUi.secondaryButton}>
            Свали SVG (за печатница)
          </a>
          <PrintButton className={portalUi.secondaryButton}>Печатай лист</PrintButton>
          <Link href={menuUrl} target="_blank" rel="noopener" className={portalUi.secondaryButton}>
            Отвори менюто
          </Link>
        </div>
      </section>

      <p className="text-sm text-stone-650 print:hidden">
        <Link href="/business/menu" className="font-semibold text-forest underline-offset-4 hover:underline">
          ← Обратно към менюто
        </Link>
      </p>
    </div>
  );
}
