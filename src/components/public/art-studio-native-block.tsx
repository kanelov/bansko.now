import Link from "next/link";

export function ArtStudioNativeBlock() {
  return (
    <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
      <div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
        <div className="min-h-72 bg-[url('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center" />
        <div className="p-8 sm:p-10">
          <p className="text-sm font-semibold uppercase text-moss">Art Studio към Bansko NOW</p>
          <h2 className="mt-4 font-serif text-3xl font-semibold text-stone-950">
            Визуални истории от Банско
          </h2>
          <p className="mt-4 text-base leading-7 text-stone-650">
            Когато едно събитие, пейзаж или личен спомен заслужава да остане извън екрана, Art Studio към Bansko NOW го превръща във фотография, арт печат или платно с музейно качество.
          </p>
          <div className="mt-6 grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
            <span>Fine art печат</span>
            <span>Canvas печат</span>
            <span>Фото печат</span>
            <span>Визуални решения</span>
          </div>
          <Link
            href="/art-studio"
            className="mt-8 inline-flex rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-moss hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest"
          >
            Виж Art Studio услугите
          </Link>
        </div>
      </div>
    </section>
  );
}
