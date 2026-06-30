import type { Metadata } from "next";
import "./globals.css";
import { siteUrl } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Bansko NOW | Животът в Банско отблизо",
    template: "%s | Bansko NOW"
  },
  description: "Събития, култура, природа, хора и истории от Банско и Пирин.",
  openGraph: {
    type: "website",
    locale: "bg_BG",
    siteName: "Bansko NOW"
  },
  twitter: {
    card: "summary_large_image"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bg">
      <body>{children}</body>
    </html>
  );
}
