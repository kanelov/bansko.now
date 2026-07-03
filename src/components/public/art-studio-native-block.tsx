import Link from "next/link";
import { ArtStudioServiceCard } from "@/components/public/art-studio-service-card";
import { getArtStudioServices } from "@/lib/content";

export async function ArtStudioNativeBlock() {
  const services = await getArtStudioServices();
  const premium = services.find((service) => service.is_premium) ?? services[0] ?? null;
  const secondaryServices = services.filter((service) => service.id !== premium?.id).slice(0, 2);

  return (
    <section className="rounded-3xl border border-stone-200 bg-[#f7f2e8] p-6 shadow-soft sm:p-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-semibold uppercase text-moss">Art Studio към Bansko NOW</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold text-stone-950">Визуални услуги с характер</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-650">
            Фотография, арт печат, платна и визуални решения, вдъхновени от Банско и Пирин.
          </p>
        </div>
        <Link
          href="/art-studio"
          className="inline-flex rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-moss hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest"
        >
          Виж Art Studio
        </Link>
      </div>
      {premium ? <ArtStudioServiceCard service={premium} featured /> : null}
      {secondaryServices.length ? (
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {secondaryServices.map((service) => (
            <ArtStudioServiceCard key={service.id} service={service} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
