import type { Metadata } from "next";
import Link from "next/link";
import { PrintButton } from "@/components/business/print-button";
import { portalUi } from "@/components/business/ui";
import { requireBusinessOwner } from "@/lib/business-platform/auth";
import { getBusinessMenu } from "@/lib/business-platform/menu";
import { createQrSvg, qrMenuUrl } from "@/lib/business-platform/qr";
import { siteUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: "QR код"
};

export default async function BusinessQrPage() {
  const { supabase, business } = await requireBusinessOwner();

  const [{ data: translations }, menu] = await Promise.all([
    supabase.from("business_translations").select("locale, slug").eq("business_id", business.businessId),
    getBusinessMenu(supabase, business.businessId, { locale: "bg", includeHidden: true })
  ]);

  const bgSlug = translations?.find((row) => row.locale === "bg")?.slug ?? business.slug;
  const enSlug = translations?.find((row) => row.locale === "en")?.slug ?? null;
  const menuUrl = qrMenuUrl(siteUrl, bgSlug);
  const svg = await createQrSvg(menuUrl, 360);
  const hasMenu = menu.categories.some((category) => category.items.length > 0);

  return (
    <div className="grid gap-6">
      <header className="print:hidden">
        <p className={portalUi.eyebrow}>QR код</p>
        <h1 className={portalUi.h1}>Менюто на масата</h1>
        <p className="mt-2 max-w-xl text-sm text-stone-650">
          Един код за цялото меню. Отпечатай го и го сложи на масите – кодът не се сменя, каквото и да променяш в менюто.
        </p>
      </header>

      {!hasMenu ? (
        <div className={portalUi.alert} role="status">
          Менюто е празно, затова страницата още няма какво да покаже на госта.{" "}
          <Link href="/business/menu" className="font-semibold text-forest underline underline-offset-4">
            Добави категория и артикул
          </Link>
          .
        </div>
      ) : null}

      <section className={portalUi.card}>
        <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="mx-auto w-[220px] sm:mx-0" aria-hidden dangerouslySetInnerHTML={{ __html: svg }} />
          <div>
            <h2 className={portalUi.h2}>{business.name}</h2>
            <p className="mt-1 text-sm text-stone-650">Сканирай за менюто · Scan for the menu</p>
            <p className="mt-4 break-all text-sm font-semibold text-forest">{menuUrl}</p>
            <p className="mt-2 text-xs text-stone-650">
              Същият адрес на английски:{" "}
              {enSlug ? `${siteUrl}/en/places/${enSlug}/menu` : "ще се появи, когато Bansko NOW публикува английския профил."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 print:hidden">
              <PrintButton className={portalUi.primaryButton}>Отпечатай</PrintButton>
              <a href={menuUrl} target="_blank" rel="noopener noreferrer" className={portalUi.secondaryButton}>
                Отвори менюто
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className={portalUi.card + " print:hidden"}>
        <h2 className={portalUi.h2}>Как се използва</h2>
        <ol className="mt-3 grid gap-2 text-sm text-stone-650">
          <li>1. Натисни „Отпечатай“ и излиза лист само с кода и името.</li>
          <li>2. Изрежи и сложи на масите или на витрината.</li>
          <li>3. Гостът сканира с камерата на телефона и вижда менюто с актуалните цени.</li>
          <li>4. Не се налага нов код при промяна на цена или при изчерпан артикул.</li>
        </ol>
      </section>
    </div>
  );
}
