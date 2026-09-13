import Link from "next/link";
import { createFallbackImageAction, deleteFallbackImageAction, updateFallbackImageAction } from "@/app/admin/fallback-image-actions";
import { getMediaItems } from "@/lib/content";
import { scoreFallbackImages } from "@/lib/fallback-images";
import { getPublishedPhotos } from "@/lib/photos";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ArticleFallbackImage } from "@/lib/types";

type SearchParams = Promise<{ saved?: string; error?: string; test?: string }>;

const fieldClass = "w-full rounded-xl border border-[var(--admin-line)] bg-white px-3 py-2 text-sm text-stone-950";
const labelClass = "grid gap-1 text-xs font-semibold text-stone-700";

function savedMessage(value?: string) {
  if (value === "created") return "Снимката е добавена. Статиите без собствена снимка се обновяват до няколко секунди.";
  if (value === "deleted") return "Снимката е премахната.";
  return "Промените са запазени. Статиите без собствена снимка се обновяват до няколко секунди.";
}

/** One thumbnail that can be chosen as the picture of a new default image (plain radio, no scripts). */
function PickTile({ url, thumb, label }: { url: string; thumb: string; label: string }) {
  return (
    <label className="grid cursor-pointer gap-1">
      <input type="radio" name="image_pick" value={url} className="peer sr-only" />
      {/* eslint-disable-next-line @next/next/no-img-element -- deliberate: admin thumbnails, no optimization traffic */}
      <img src={thumb} alt={label} loading="lazy" className="aspect-[4/3] w-full rounded-xl object-cover ring-2 ring-transparent transition peer-checked:ring-forest peer-focus-visible:ring-forest" />
      <span className="truncate text-xs text-[var(--admin-muted)]">{label}</span>
    </label>
  );
}

/** Admin "Снимки по подразбиране": the pool of default article images and their keywords. */
export default async function FallbackImagesPage({ searchParams }: { searchParams: SearchParams }) {
  const { saved, error, test } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [rows, mediaItems, archive] = await Promise.all([
    supabase
      ? supabase.from("article_fallback_images").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as ArticleFallbackImage[] }),
    getMediaItems(24),
    getPublishedPhotos("bg", { pageSize: 24 })
  ]);
  const images = (rows.data ?? []) as ArticleFallbackImage[];
  const activeImages = images.filter((image) => image.is_active);
  const ranked = test ? scoreFallbackImages(activeImages, { title: test }) : [];
  const archivePhotos = archive.photos.filter((photo) => photo.article_url && photo.thumb_url);
  const mediaImages = mediaItems.filter((item) => !/\.(mp4|webm|mov)(\?|$)/i.test(item.file_url));

  return (
    <div className="grid gap-8">
      <div className="grid gap-4">
        <p className="text-sm font-semibold uppercase text-[var(--admin-muted)]">Статии</p>
        <h1 className="font-serif text-4xl font-semibold">Снимки по подразбиране за статии</h1>
        <p className="max-w-3xl text-sm leading-6 text-[var(--admin-muted)]">
          Когато една статия няма собствена снимка, сайтът показва една от тези. Изборът е по ключовите думи: думите на всяка снимка се
          сравняват със заглавието, категорията, таговете, резюмето и текста на статията и печели най-близката. Ако нищо не съвпада,
          снимките се редуват равномерно, за да не се повтаря една и съща в списъка. Нищо не се записва в статията: щом ѝ сложиш
          собствена снимка от редактора, тя веднага измества тази по подразбиране.
        </p>
      </div>

      {saved ? (
        <div className="max-w-3xl rounded-2xl border border-sage/40 bg-sage/15 p-4 text-sm font-semibold text-stone-950">{savedMessage(saved)}</div>
      ) : null}
      {error ? (
        <div className="max-w-3xl rounded-2xl border border-red-300 bg-red-100 p-4 text-sm font-semibold text-red-900">{error}</div>
      ) : null}

      <section className="grid gap-4 rounded-2xl border border-[var(--admin-line)] bg-[var(--admin-panel)] p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl font-semibold">Снимки ({images.length})</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--admin-muted)]">
              Описанието е и alt текстът на снимката. Ключовите думи ги пиши със запетая, на български и английски; думи с общ корен се
              разпознават („планина“ хваща и „планината“, „планински“). Не слагай „Банско“ на всяка снимка – то е във всяка статия и не
              помага за избора.
            </p>
          </div>
        </div>

        {images.length ? (
          <div className="grid gap-5">
            {images.map((image) => (
              <article key={image.id} className="grid gap-4 rounded-2xl bg-white p-4 lg:grid-cols-[260px_1fr]">
                <div className="grid gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- deliberate: admin thumbnails, no optimization traffic */}
                  <img src={image.image_url} alt={image.title} loading="lazy" className={`aspect-[4/3] w-full rounded-xl object-cover ${image.is_active ? "" : "opacity-50"}`} />
                  <form action={deleteFallbackImageAction}>
                    <input type="hidden" name="id" value={image.id} />
                    <button type="submit" className="admin-button admin-button-danger px-3 py-1.5 text-xs font-semibold">
                      Премахни
                    </button>
                  </form>
                </div>
                <form action={updateFallbackImageAction} className="grid gap-3">
                  <input type="hidden" name="id" value={image.id} />
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className={labelClass}>
                      Описание (български, alt текст)
                      <input name="title" defaultValue={image.title} className={fieldClass} required />
                    </label>
                    <label className={labelClass}>
                      Описание на английски (alt за /en)
                      <input name="title_en" defaultValue={image.title_en || ""} className={fieldClass} />
                    </label>
                  </div>
                  <label className={labelClass}>
                    Ключови думи, със запетая
                    <textarea name="keywords" defaultValue={image.keywords.join(", ")} rows={2} className={fieldClass} />
                  </label>
                  <label className={labelClass}>
                    Адрес на снимката
                    <input name="image_url" defaultValue={image.image_url} className={fieldClass} />
                  </label>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="grid gap-1 text-xs font-semibold text-stone-700">
                      Ред
                      <input name="sort_order" type="number" defaultValue={image.sort_order} className="w-24 rounded-xl border border-[var(--admin-line)] bg-white px-3 py-2 text-sm" />
                    </label>
                    <label className="flex items-center gap-2 pt-4 text-sm font-semibold text-stone-700">
                      <input name="is_active" type="checkbox" defaultChecked={image.is_active} className="h-4 w-4" />
                      Активна
                    </label>
                    <button type="submit" className="admin-button admin-button-primary ml-auto px-4 py-2 text-sm font-semibold">
                      Запази
                    </button>
                  </div>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-white p-4 text-sm text-[var(--admin-muted)]">
            Още няма снимки по подразбиране. Докато няма, статиите без снимка използват общата картинка на сайта.
          </p>
        )}
      </section>

      <section className="grid gap-4 rounded-2xl border border-[var(--admin-line)] bg-[var(--admin-panel)] p-6">
        <h2 className="font-serif text-2xl font-semibold">Добави снимка</h2>
        <form action={createFallbackImageAction} className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className={labelClass}>
              Описание (български, alt текст)
              <input name="title" className={fieldClass} placeholder="Дрон снимка на центъра на Банско" required />
            </label>
            <label className={labelClass}>
              Описание на английски
              <input name="title_en" className={fieldClass} placeholder="Drone view of Bansko town centre" />
            </label>
          </div>
          <label className={labelClass}>
            Ключови думи, със запетая
            <textarea name="keywords" rows={2} className={fieldClass} placeholder="център, град, площад, улици, събитие, фестивал, community, town, events" />
          </label>
          <div className="grid gap-3 md:grid-cols-[1fr_120px]">
            <label className={labelClass}>
              Адрес на снимката (или избери отдолу)
              <input name="image_url" className={fieldClass} placeholder="https://…" />
            </label>
            <label className={labelClass}>
              Ред
              <input name="sort_order" type="number" defaultValue={images.length + 1} className={fieldClass} />
            </label>
          </div>

          {archivePhotos.length ? (
            <div className="grid gap-2">
              <p className="text-xs font-semibold uppercase text-[var(--admin-muted)]">От фотоархива</p>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {archivePhotos.map((photo) => (
                  <PickTile key={photo.id} url={photo.article_url as string} thumb={photo.thumb_url as string} label={photo.title} />
                ))}
              </div>
            </div>
          ) : null}

          {mediaImages.length ? (
            <div className="grid gap-2">
              <p className="text-xs font-semibold uppercase text-[var(--admin-muted)]">От „Медия“</p>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {mediaImages.map((item) => (
                  <PickTile key={item.id} url={item.file_url} thumb={item.file_url} label={item.alt_text || item.file_name || "Изображение"} />
                ))}
              </div>
            </div>
          ) : null}

          <p className="text-xs leading-5 text-[var(--admin-muted)]">
            Нова снимка първо се качва в{" "}
            <Link href="/admin/media" className="font-semibold text-forest underline underline-offset-4">
              Медия
            </Link>{" "}
            или във{" "}
            <Link href="/admin/photos" className="font-semibold text-forest underline underline-offset-4">
              Фотоархив
            </Link>
            , после се избира тук. Снимка от фотоархива носи и надписа „© фотограф“ под статията.
          </p>
          <button type="submit" className="admin-button admin-button-primary w-fit px-5 py-2.5 text-sm font-semibold">
            Добави снимка
          </button>
        </form>
      </section>

      <section className="grid gap-4 rounded-2xl border border-[var(--admin-line)] bg-[var(--admin-panel)] p-6">
        <h2 className="font-serif text-2xl font-semibold">Провери избора</h2>
        <p className="text-sm leading-6 text-[var(--admin-muted)]">Напиши примерно заглавие на статия и виж коя снимка би била избрана и защо.</p>
        <form method="get" className="flex flex-wrap gap-2">
          <input name="test" defaultValue={test || ""} className={`${fieldClass} max-w-xl`} placeholder="Залез над Тодорка: къде да го гледаш тази вечер" />
          <button type="submit" className="admin-button admin-button-secondary px-4 py-2 text-sm font-semibold">
            Провери
          </button>
        </form>
        {test ? (
          ranked.length ? (
            <ol className="grid gap-2">
              {ranked.map((entry, index) => (
                <li key={entry.image.id} className={`flex items-center gap-3 rounded-xl bg-white p-3 text-sm ${index === 0 && entry.score > 0 ? "ring-2 ring-forest" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- deliberate: admin thumbnails, no optimization traffic */}
                  <img src={entry.image.image_url} alt="" className="h-12 w-16 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-stone-950">{entry.image.title}</p>
                    <p className="text-xs text-[var(--admin-muted)]">
                      {entry.score > 0 ? `${entry.score} т. · съвпадения: ${entry.matched.join(", ")}` : "няма съвпадение"}
                    </p>
                  </div>
                </li>
              ))}
              {ranked[0].score === 0 ? (
                <li className="text-xs text-[var(--admin-muted)]">Нищо не съвпада с това заглавие: снимките ще се редуват по ред. Добави ключови думи, ако искаш конкретна.</li>
              ) : null}
            </ol>
          ) : (
            <p className="text-sm text-[var(--admin-muted)]">Няма активни снимки за проверка.</p>
          )
        ) : null}
      </section>
    </div>
  );
}
