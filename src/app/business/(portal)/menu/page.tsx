import type { Metadata } from "next";
import Link from "next/link";
import { MenuOverview } from "@/components/business/menu-overview";
import { portalUi } from "@/components/business/ui";
import { requireBusinessOwner } from "@/lib/business-platform/auth";
import { getBusinessMenu } from "@/lib/business-platform/menu";

export const metadata: Metadata = {
  title: "Меню"
};

const savedMessages: Record<string, string> = {
  category: "Категорията е записана.",
  item: "Артикулът е записан.",
  deleted: "Изтрито."
};

const errorMessages: Record<string, string> = {
  delete: "Изтриването не успя. Опитай пак.",
  missing: "Не намерих записа."
};

export default async function BusinessMenuPage({
  searchParams
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const { supabase, business } = await requireBusinessOwner();
  const menu = await getBusinessMenu(supabase, business.businessId, { locale: "bg", includeHidden: true });

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={portalUi.eyebrow}>Меню</p>
          <h1 className={portalUi.h1}>Категории и артикули</h1>
          <p className="mt-2 max-w-xl text-sm text-stone-650">
            Това е единственото меню: каквото промениш тук, стига до QR менюто, телевизорите и печата за под минута.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/business/menu/categories/new" className={portalUi.primaryButton}>
            Нова категория
          </Link>
          {menu.categories.length > 0 ? (
            <>
              <Link href="/business/menu/items/new" className={portalUi.secondaryButton}>
                Нов артикул
              </Link>
              <Link href="/business/menu/qr" className={portalUi.secondaryButton}>
                QR код
              </Link>
              <Link href={`/places/${business.slug}/menu`} target="_blank" rel="noopener" className={portalUi.secondaryButton}>
                Виж менюто
              </Link>
            </>
          ) : null}
        </div>
      </header>

      {saved ? (
        <div className={portalUi.notice} role="status">
          {savedMessages[saved] ?? "Записано."}
        </div>
      ) : null}

      {error ? (
        <div className={portalUi.alert} role="alert">
          {errorMessages[error] ?? "Нещо не мина. Опитай пак."}
        </div>
      ) : null}

      {menu.categories.length === 0 ? (
        <section className={portalUi.card}>
          <h2 className={portalUi.h2}>Още няма меню</h2>
          <p className="mt-2 text-sm text-stone-650">
            Започни с категория – „Кафе“, „Топли напитки“, „Кроасани“ – и после добавяй артикулите в нея.
          </p>
          <Link href="/business/menu/categories/new" className={portalUi.primaryButton + " mt-4"}>
            Създай първата категория
          </Link>
        </section>
      ) : (
        <MenuOverview businessId={business.businessId} menu={menu} />
      )}
    </div>
  );
}
