import Link from "next/link";
import type { SiteSettings } from "@/lib/types";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="border-t border-stone-200 bg-forest text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
        <div>
          <p className="font-serif text-3xl font-semibold">Bansko NOW</p>
          <p className="mt-4 max-w-md text-sm leading-6 text-stone-200">
            {settings.site_description ||
              "Събития, култура, природа, хора и истории от Банско и Пирин."}
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase text-stone-300">Проект</p>
          <div className="mt-4 grid gap-2 text-sm text-stone-100">
            <Link href="/about">За проекта</Link>
            <Link href="/contact">Контакт</Link>
            <Link href="/art-studio">Art Studio</Link>
            <Link href="/bansko-collection">Bansko Collection</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase text-stone-300">Връзки</p>
          <div className="mt-4 grid gap-2 text-sm text-stone-100">
            {settings.facebook_group_url ? <a href={settings.facebook_group_url}>Facebook група</a> : null}
            {settings.instagram_url ? <a href={settings.instagram_url}>Instagram</a> : null}
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
