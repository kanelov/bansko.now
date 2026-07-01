import { uploadMediaAction } from "@/app/admin/actions";
import { getMediaItems } from "@/lib/content";

type SearchParams = Promise<{ uploaded?: string; error?: string }>;

const errorMessages: Record<string, string> = {
  "missing-file": "Избери файл за качване.",
  "invalid-type": "Може да качваш само изображения или видео файлове.",
  "file-too-large": "Изображението трябва да е до 8 MB, а видеото до 80 MB."
};

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

export default async function AdminMediaPage({ searchParams }: { searchParams: SearchParams }) {
  const [params, mediaItems] = await Promise.all([searchParams, getMediaItems(36)]);
  const errorMessage = params.error ? errorMessages[params.error] || params.error : null;

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-sm font-semibold uppercase text-stone-400">Assets</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold">Media</h1>
      </div>

      {params.uploaded ? (
        <div className="rounded-2xl border border-sage/40 bg-sage/15 p-4 text-sm font-semibold text-stone-50">
          Изображението е качено и записано в media библиотеката.
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-2xl border border-red-300/40 bg-red-500/10 p-4 text-sm font-semibold text-red-100">
          {errorMessage}
        </div>
      ) : null}

      <form action={uploadMediaAction} className="grid gap-5 rounded-2xl bg-white p-5 text-stone-950">
        <div>
          <h2 className="font-serif text-2xl font-semibold">Upload image</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
            Качи снимка в Supabase Storage bucket `bansko-media`. Публичният URL се записва автоматично в `media`.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
          <label className="grid gap-2 text-sm font-semibold">
            Image file
            <input
              type="file"
              name="file"
              accept="image/*,video/mp4,video/webm,video/quicktime"
              required
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-950 file:mr-4 file:rounded-full file:border-0 file:bg-forest file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Alt text
            <input
              name="alt_text"
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-950 outline-none focus:border-forest"
              placeholder="Пейзаж от Пирин над Банско"
            />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold">
          Caption
          <input
            name="caption"
            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-950 outline-none focus:border-forest"
            placeholder="Кратко описание или кредит на изображението"
          />
        </label>
        <div>
          <button type="submit" className="admin-button admin-button-forest px-6 py-3 text-sm font-semibold">
            Качи изображение
          </button>
        </div>
      </form>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase text-stone-400">Library</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold">Последни изображения</h2>
          </div>
          <p className="text-sm text-stone-400">{mediaItems.length} файла</p>
        </div>

        {mediaItems.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {mediaItems.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-2xl bg-white text-stone-950">
                {isVideoUrl(item.file_url) ? (
                  <video src={item.file_url} className="aspect-[4/3] w-full object-cover" controls preload="metadata" />
                ) : (
                  <img
                    src={item.file_url}
                    alt={item.alt_text || item.file_name || "Bansko NOW media"}
                    className="aspect-[4/3] w-full object-cover"
                  />
                )}
                <div className="grid gap-3 p-4">
                  <div>
                    <p className="truncate text-sm font-semibold">{item.alt_text || item.file_name || "Изображение"}</p>
                    {item.caption ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-600">{item.caption}</p> : null}
                  </div>
                  <input
                    readOnly
                    value={item.file_url}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600"
                  />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm leading-6 text-stone-300">
            Все още няма качени изображения. Качи първата снимка и тя ще се появи тук, както и в article editor-а.
          </div>
        )}
      </section>
    </div>
  );
}
