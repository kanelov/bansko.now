import type { Metadata } from "next";
import Link from "next/link";
import { PrintBackgroundField } from "@/components/business/print-background-field";
import { portalUi } from "@/components/business/ui";
import { requireBusinessOwner } from "@/lib/business-platform/auth";
import { businessMediaUrls } from "@/lib/business-platform/media";
import { getMenuCategoryOptions } from "@/lib/business-platform/menu";
import { printLanguages, printSizes } from "@/lib/business-platform/print";

export const metadata: Metadata = {
  title: "Печат"
};

/**
 * Настройките за печат не се пазят: формата е обикновен GET към страницата за
 * печат, която отваря в нов раздел. Така няма таблица, няма запис и няма какво
 * да остарее - менюто се чете в момента на отваряне.
 */
export default async function BusinessPrintPage() {
  const { supabase, business } = await requireBusinessOwner();
  const [categories, { data: backgrounds }] = await Promise.all([
    getMenuCategoryOptions(supabase, business.businessId),
    supabase
      .from("business_media")
      .select("id, original_key, variant_keys")
      .eq("business_id", business.businessId)
      .eq("kind", "print_background")
      .eq("media_type", "image")
      .order("created_at", { ascending: false })
  ]);

  const visibleCategories = categories.filter((category) => category.isActive);

  return (
    <div className="grid gap-6">
      <header>
        <p className={portalUi.eyebrow}>Печат</p>
        <h1 className={portalUi.h1}>Меню на хартия</h1>
        <p className="mt-2 max-w-xl text-sm text-stone-650">
          Същото меню, подредено за лист. Избираш размер, език и фон, отваряш страницата и от диалога за печат запазваш PDF или
          печаташ. Цените са тези от „Меню“ в момента на отваряне.
        </p>
      </header>

      {visibleCategories.length === 0 ? (
        <div className={portalUi.alert} role="status">
          Менюто е празно.{" "}
          <Link href="/business/menu" className="font-semibold text-forest underline underline-offset-4">
            Добави категория и артикул
          </Link>
          , после се върни тук.
        </div>
      ) : null}

      <form method="get" action="/business/print/menu" target="_blank" className={portalUi.card + " grid gap-6"}>
        <fieldset className="grid gap-2">
          <legend className="text-sm font-semibold">Размер</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {printSizes.map((size, index) => (
              <label key={size.value} className="flex items-start gap-3 rounded-2xl border border-[var(--stone)] bg-paper px-4 py-3 text-sm">
                <input type="radio" name="size" value={size.value} defaultChecked={index === 0} className="mt-1 accent-forest" />
                <span>
                  <span className="block font-semibold">{size.label}</span>
                  <span className={portalUi.hint}>{size.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-6 sm:grid-cols-2">
          <fieldset className="grid gap-2">
            <legend className="text-sm font-semibold">
              Ориентация <span className={portalUi.hint}>само за A4 и A3</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-2 rounded-full border border-[var(--stone)] bg-paper px-4 py-2 text-sm">
                <input type="radio" name="orientation" value="portrait" defaultChecked className="accent-forest" />
                Изправен
              </label>
              <label className="flex items-center gap-2 rounded-full border border-[var(--stone)] bg-paper px-4 py-2 text-sm">
                <input type="radio" name="orientation" value="landscape" className="accent-forest" />
                Легнал
              </label>
            </div>
          </fieldset>

          <fieldset className="grid gap-2">
            <legend className="text-sm font-semibold">Език</legend>
            <div className="flex flex-wrap gap-2">
              {printLanguages.map((language, index) => (
                <label key={language.value} className="flex items-center gap-2 rounded-full border border-[var(--stone)] bg-paper px-4 py-2 text-sm">
                  <input type="radio" name="lang" value={language.value} defaultChecked={index === 0} className="accent-forest" />
                  {language.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="grid gap-2">
            <legend className="text-sm font-semibold">Вид</legend>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-2 rounded-full border border-[var(--stone)] bg-paper px-4 py-2 text-sm">
                <input type="radio" name="style" value="light" defaultChecked className="accent-forest" />
                Светъл
              </label>
              <label className="flex items-center gap-2 rounded-full border border-[var(--stone)] bg-paper px-4 py-2 text-sm">
                <input type="radio" name="style" value="dark" className="accent-forest" />
                Тъмен
              </label>
            </div>
          </fieldset>

          <fieldset className="grid gap-2">
            <legend className="text-sm font-semibold">За къде е файлът</legend>
            <div className="grid gap-2">
              <label className="flex items-start gap-2 text-sm">
                <input type="radio" name="margin" value="office" defaultChecked className="mt-1 accent-forest" />
                <span>
                  Офис принтер <span className={portalUi.hint}>точният размер на листа</span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input type="radio" name="margin" value="bleed" className="mt-1 accent-forest" />
                <span>
                  Печатница <span className={portalUi.hint}>с 3 mm за рязане от всяка страна</span>
                </span>
              </label>
            </div>
          </fieldset>
        </div>

        <PrintBackgroundField initial={(backgrounds ?? []).map((row) => ({ id: row.id, url: businessMediaUrls(row).w480 }))} />

        <fieldset className="grid gap-2">
          <legend className="text-sm font-semibold">Категории</legend>
          <p className={portalUi.hint}>Без отметка се печата цялото меню. Скритите категории не се печатат.</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {visibleCategories.map((category) => (
              <li key={category.id}>
                <label className="flex items-center gap-3 rounded-2xl border border-[var(--stone)] bg-paper px-4 py-3 text-sm">
                  <input type="checkbox" name="cat" value={category.id} className="h-4 w-4 accent-forest" />
                  <span className="font-semibold">{category.name}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        <div className="grid gap-2">
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="desc" value="1" className="h-4 w-4 accent-forest" />
            Печатай описанията
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="hidden" name="qr" value="0" />
            <input type="checkbox" name="qr" value="1" defaultChecked className="h-4 w-4 accent-forest" />
            <span>
              QR код към актуалното меню <span className={portalUi.hint}>долу вдясно; хартията остарява, кодът – не</span>
            </span>
          </label>
        </div>

        <div>
          <button type="submit" className={portalUi.primaryButton}>
            Отвори за печат
          </button>
        </div>
      </form>
    </div>
  );
}
