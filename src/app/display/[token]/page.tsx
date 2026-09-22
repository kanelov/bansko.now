import { notFound } from "next/navigation";
import { DisplayColumns } from "@/components/display/display-menu";
import { PaperMenuHead } from "@/components/public/paper-menu";
import { displayScript } from "@/components/display/display-script";
import { layoutDisplay } from "@/lib/business-platform/display-layout";
import { getDisplayByToken } from "@/lib/business-platform/displays";
import { getOpeningStatus } from "@/lib/business-platform/hours";
import { getBusinessMenu } from "@/lib/business-platform/menu";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

/**
 * Страницата на телевизора. Динамична и без кеш: зарежда се само когато
 * телевизорът види нова версия (десетина пъти на ден), затова ISR тук би било
 * излишна сложност и риск да презареди в стара версия. Телевизорът никога не
 * говори със Supabase - само с тази страница, /api/display/<token>/version и R2.
 */
export const dynamic = "force-dynamic";

type Params = Promise<{ token: string }>;
type Search = Promise<{ preview?: string }>;

export default async function DisplayPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const [{ token }, { preview }] = await Promise.all([params, searchParams]);
  const display = await getDisplayByToken(token);
  const supabase = createPublicSupabaseClient();

  if (!display || !supabase) {
    notFound();
  }

  const [menu, opening] = await Promise.all([
    getBusinessMenu(supabase, display.businessId, {
      locale: "bg",
      categoryIds: display.categoryIds.length ? display.categoryIds : undefined
    }),
    getOpeningStatus(supabase, display.businessId, "bg")
  ]);

  /* Категориите излизат в реда, който екранът е избрал; без избор - редът на менюто. */
  const order = new Map(display.categoryIds.map((id, index) => [id, index]));
  const categories = display.categoryIds.length
    ? [...menu.categories].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    : menu.categories;

  const withMedia = display.template !== "menu_only" && display.media !== null;
  const layout = layoutDisplay(categories, { showDescriptions: display.showDescriptions, maxColumns: withMedia ? 2 : 3 });
  const rootClass = ["display-root", "paper", display.theme === "dark" ? "paper--dark" : "", withMedia ? "display-root--media" : ""].filter(Boolean).join(" ");
  const isPreview = preview === "1";

  return (
    <>
      {isPreview ? null : <meta httpEquiv="refresh" content="21600" />}
      <div id="display-root" className={rootClass} data-token={token} data-version={display.version} data-preview={isPreview ? "1" : "0"}>
        <div id="display-menu" className="display-menu">
          <div className="display-head">
            <PaperMenuHead title={display.businessName} subtitle="Меню" />
            {opening.label ? <span className="display-status">{opening.label}</span> : null}
          </div>

          {layout.columns.every((column) => column.length === 0) ? (
            <p className="display-empty">Менюто се подготвя</p>
          ) : (
            <DisplayColumns columns={layout.columns} showDescriptions={display.showDescriptions} />
          )}

          <footer className="display-foot">
            <span>{display.name}</span>
            <span>Bansko NOW</span>
          </footer>
        </div>

        {withMedia && display.media ? (
          <div className="display-media">
            {display.media.mediaType === "video" && display.media.urls.original ? (
              <video src={display.media.urls.original} autoPlay muted loop playsInline preload="auto" />
            ) : display.media.urls.w1600 || display.media.urls.original ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={display.media.urls.w1600 || display.media.urls.original || ""} alt={display.media.alt ?? ""} />
            ) : null}
          </div>
        ) : null}

        <span className="display-offline" aria-hidden />
      </div>
      <script dangerouslySetInnerHTML={{ __html: displayScript }} />
    </>
  );
}
