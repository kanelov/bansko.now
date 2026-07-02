import Link from "next/link";
import { getSocialLinks } from "@/lib/content";
import type { SiteSettings } from "@/lib/types";
import { IconGlyph } from "./icon-glyph";

export async function SiteFooter({ settings }: { settings: SiteSettings }) {
  const socialLinks = await getSocialLinks(settings);

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
            <Link href="/businesses">Местни бизнеси</Link>
            <Link href="/art-studio">Art Studio</Link>
            <Link href="/bansko-collection">Bansko Collection</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase text-stone-300">Връзки</p>
          <div className="mt-4 grid gap-2 text-sm text-stone-100">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms</Link>
          </div>
          {socialLinks.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  aria-label={link.label}
                  title={link.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white hover:text-forest"
                >
                  <IconGlyph name={link.icon_name || link.platform} className="h-4 w-4" />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
