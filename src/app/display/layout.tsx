import type { Metadata, Viewport } from "next";
import "@/styles/fonts.css";
import "@/styles/display.css";

/**
 * Телевизорът има собствен root layout: без globals.css (Tailwind 4 не работи на
 * Chromium 85 на Samsung Tizen), без хедър и футър на сайта, без индексиране.
 */
export const metadata: Metadata = {
  title: "Екран | Bansko NOW",
  robots: { index: false, follow: false, nocache: true }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default function DisplayRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg">
      <body className="display">{children}</body>
    </html>
  );
}
