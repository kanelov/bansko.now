import Link from "next/link";
import { getSocialLinks } from "@/lib/content";
import type { Locale, SiteSettings, SocialLink } from "@/lib/types";
import { IconGlyph } from "./icon-glyph";
import { getDictionary, getSocialLabel, localePath } from "@/lib/i18n";
import type { Route } from "next";

function SocialFooterLink({ link, locale }: { link: SocialLink; locale: Locale }) {
  const label = getSocialLabel(link.platform, link.label, locale);

  return (
    <a
      href={link.url}
      aria-label={label}
      title={label}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white hover:text-forest"
    >
      <IconGlyph name={link.icon_name || link.platform} className="h-4 w-4" />
    </a>
  );
}

export async function SiteFooter({ settings, locale = "bg" }: { settings: SiteSettings; locale?: Locale }) {
  const dictionary = getDictionary(locale);
  const socialLinks = await getSocialLinks(settings);

  return (
    <footer className="border-t border-stone-200 bg-forest text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
        <div>
          <p className="font-serif text-3xl font-semibold">Bansko NOW</p>
          <p className="mt-4 max-w-md text-sm leading-6 text-stone-200">
            {settings.site_description ||
              dictionary.heroText}
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase text-stone-300">{dictionary.project}</p>
          <div className="mt-4 grid gap-2 text-sm text-stone-100">
            <Link href={localePath(locale, "/about") as Route}>{dictionary.about}</Link>
            <Link href={localePath(locale, "/contact") as Route}>{dictionary.contact}</Link>
            <Link href={localePath(locale, "/businesses") as Route}>{dictionary.localBusinesses}</Link>
            <Link href={localePath(locale, "/art-studio") as Route}>Art Studio</Link>
            <Link href={localePath(locale, "/bansko-collection") as Route}>Bansko Collection</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase text-stone-300">{dictionary.links}</p>
          <div className="mt-4 grid gap-2 text-sm text-stone-100">
            <Link href={localePath(locale, "/privacy") as Route}>{dictionary.privacy}</Link>
            <Link href={localePath(locale, "/terms") as Route}>{dictionary.terms}</Link>
            <Link href="/admin" className="group inline-flex w-fit items-center gap-2 text-stone-100 transition hover:text-white">
              <IconGlyph name="user-shield" className="h-4 w-4 text-current" />
              <span>{dictionary.adminPanel}</span>
            </Link>
          </div>
          {socialLinks.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {socialLinks.map((link) => (
                <SocialFooterLink key={link.id} link={link} locale={locale} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
