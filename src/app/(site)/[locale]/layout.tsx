import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../../globals.css";
import { siteUrl } from "@/lib/env";
import { getDictionary, getOpenGraphLocale, isLocale, locales } from "@/lib/i18n";

type Params = Promise<{ locale: string }>;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  const dictionary = getDictionary(locale);

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: locale === "en" ? "Bansko NOW | Life in Bansko, up close" : "Bansko NOW | Животът в Банско отблизо",
      template: "%s | Bansko NOW"
    },
    description: dictionary.heroText,
    openGraph: {
      type: "website",
      locale: getOpenGraphLocale(locale),
      alternateLocale: getOpenGraphLocale(locale === "bg" ? "en" : "bg"),
      siteName: "Bansko NOW"
    },
    twitter: {
      card: "summary_large_image"
    }
  };
}

export default async function LocaleLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Params }>) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
