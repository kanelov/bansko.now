import { unlockPreviewAction } from "./actions";

/** Видеото от Пирин, което върви на фон. Един и същи номер и за повторението. */
const backgroundVideoId = "BLGSZB6Klok";

const videoSource = [
  `https://www.youtube-nocookie.com/embed/${backgroundVideoId}`,
  "?autoplay=1",
  "&mute=1",
  "&loop=1",
  `&playlist=${backgroundVideoId}`,
  "&controls=0",
  "&disablekb=1",
  "&fs=0",
  "&modestbranding=1",
  "&playsinline=1",
  "&rel=0",
  "&iv_load_policy=3"
].join("");

export default async function ComingSoonPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-[#0b0d0a]">
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <iframe
          /* Рамката се разтяга така, че видеото да покрие екрана при всяка форма
             на прозореца: по-широкото измерение води. */
          className="pointer-events-none absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2"
          src={videoSource}
          title="Банско и Пирин"
          allow="autoplay; encrypted-media"
          referrerPolicy="strict-origin-when-cross-origin"
          tabIndex={-1}
        />
      </div>

      {/* Същият градиент като на началната страница: горе почти нищо, за да се
          гледа видеото, и потъмняване само долу, където стои текстът. */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/75" />

      <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-4 pb-16 pt-24 text-white sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase">Bansko NOW</p>

        <h1 className="mt-4 max-w-4xl font-serif text-6xl font-semibold leading-none sm:text-7xl">
          Очаквайте скоро
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-100">
          Фотография от Пирин и животът в Банско — отблизо, през цялата година.
        </p>

        <details className="group mt-8 max-w-sm">
          {/* Отвори ли се полето, бутонът се скрива: иначе двата реда изглеждат
              като две различни неща едно под друго. */}
          <summary className="flex w-fit cursor-pointer list-none rounded-full bg-white px-6 py-3 text-sm font-semibold text-stone-950 shadow-sm transition group-open:hidden hover:bg-stone-100">
            Вход с код
          </summary>

          <form action={unlockPreviewAction} className="flex flex-wrap gap-2">
            <label htmlFor="preview-code" className="sr-only">
              Код за достъп
            </label>
            <input
              id="preview-code"
              name="code"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              required
              placeholder="Код"
              className="min-w-0 flex-1 rounded-full border border-white/70 bg-black/30 px-6 py-3 text-sm text-white shadow-sm outline-none placeholder:text-white/60 focus:bg-black/45"
            />
            <button
              type="submit"
              className="rounded-full border border-white/70 bg-black/30 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black/45"
            >
              Влез
            </button>
          </form>

          {error ? (
            <p className="mt-3 text-sm font-semibold text-stone-100" role="alert">
              Грешен код. Опитай пак.
            </p>
          ) : null}
        </details>
      </div>
    </section>
  );
}
