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
    <>
      {/* Фонът стои под съдържанието само по реда в документа — без слоеве и
          без z-index, за да няма изненади на телефон. */}
      <div aria-hidden className="fixed inset-0 overflow-hidden bg-[#0b0d0a]">
        <iframe
          /* Рамката се разтяга така, че видеото да покрие екрана при всяка
             форма на прозореца: по-широкото измерение води. */
          className="pointer-events-none absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2"
          src={videoSource}
          title="Банско и Пирин"
          allow="autoplay; encrypted-media"
          referrerPolicy="strict-origin-when-cross-origin"
          tabIndex={-1}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/85" />
      </div>

      <main className="relative flex min-h-dvh flex-col justify-between px-6 py-10 text-paper sm:px-10 sm:py-14">
        <p className="font-serif text-lg tracking-[0.3em] uppercase text-paper/80">Bansko NOW</p>

        <div className="mx-auto w-full max-w-2xl py-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-clay">Очаквайте скоро</p>

          <h1 className="mt-5 font-serif text-4xl leading-tight font-semibold sm:text-6xl">
            Животът в Банско отблизо
          </h1>

          <div className="mt-7 space-y-4 text-base leading-7 text-paper/85 sm:text-lg sm:leading-8">
            <p>
              Bansko NOW е независимо местно издание за Банско и Пирин — статии, които се четат, а не
              се преглеждат. Какво се случва в града, кой го прави, къде да ядеш, какво да видиш и
              как изглежда планината този сезон.
            </p>
            <p>
              Към изданието вървят каталог на местните заведения и услуги, галерия с авторски картини,
              тениски и фотография от Пирин, както и прогноза, писана за хора, които ще излязат навън.
              Всичко на български и на английски, от хора, които живеят тук.
            </p>
          </div>

          <details className="group mx-auto mt-10 w-full max-w-sm text-left">
            <summary className="mx-auto flex w-fit cursor-pointer list-none items-center gap-2 rounded-full border border-paper/35 px-6 py-3 text-sm font-semibold tracking-wide transition hover:border-paper hover:bg-paper/10">
              Вход с код
            </summary>

            <form action={unlockPreviewAction} className="mt-4 rounded-2xl bg-black/45 p-4 backdrop-blur-sm">
              <label htmlFor="preview-code" className="block text-xs uppercase tracking-[0.2em] text-paper/70">
                Код за достъп
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="preview-code"
                  name="code"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  required
                  className="min-w-0 flex-1 rounded-full border border-paper/30 bg-black/40 px-4 py-2.5 text-paper outline-none placeholder:text-paper/40 focus:border-clay"
                  placeholder="••••"
                />
                <button
                  type="submit"
                  className="rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-paper transition hover:brightness-110"
                >
                  Влез
                </button>
              </div>

              {error ? (
                <p className="mt-3 text-sm text-clay" role="alert">
                  Грешен код. Опитай пак.
                </p>
              ) : null}
            </form>
          </details>
        </div>

        <p className="text-center text-xs text-paper/55">
          Отваряме, когато съдържанието е готово — не по-рано.
        </p>
      </main>
    </>
  );
}
