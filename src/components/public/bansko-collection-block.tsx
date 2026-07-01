import Link from "next/link";

export function BanskoCollectionBlock() {
  return (
    <section className="rounded-3xl bg-stone-950 p-8 text-white sm:p-10">
      <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-stone-300">Designed in Bansko</p>
          <h2 className="mt-4 font-serif text-4xl font-semibold">Вдъхновено от Банско</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-200">
            Вдъхновено от Банско, създадено за хората, които искат да отнесат част от града със себе си. Авторски тениски, чаши, термоси и арт продукти с визуален характер.
          </p>
        </div>
        <div className="grid gap-3 text-sm text-stone-100">
          <div className="grid grid-cols-2 gap-3">
            <span className="rounded-2xl bg-white/10 p-4">Тениски</span>
            <span className="rounded-2xl bg-white/10 p-4">Чаши</span>
            <span className="rounded-2xl bg-white/10 p-4">Постери</span>
            <span className="rounded-2xl bg-white/10 p-4">Фото принтове</span>
          </div>
          <Link
            href="/bansko-collection"
            className="inline-flex justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-stone-950 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-stone-100 hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Разгледай Bansko Collection
          </Link>
        </div>
      </div>
    </section>
  );
}
