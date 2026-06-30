import type { SiteSettings } from "@/lib/types";

export function FacebookGroupCTA({ settings }: { settings: SiteSettings }) {
  if (!settings.facebook_group_url) {
    return null;
  }

  return (
    <section id="community" className="rounded-3xl bg-forest p-8 text-white sm:p-10">
      <div className="grid gap-6 md:grid-cols-[1.4fr_auto] md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase text-stone-300">Общност</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold">Присъедини се към общността</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-100">
            Имаш събитие, снимка, препоръка или въпрос за Банско? Сподели го в Bansko NOW | Живот в Банско.
          </p>
        </div>
        <a
          href={settings.facebook_group_url}
          className="inline-flex justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-stone-950 shadow-sm transition hover:bg-stone-100"
        >
          Към Facebook групата
        </a>
      </div>
    </section>
  );
}
