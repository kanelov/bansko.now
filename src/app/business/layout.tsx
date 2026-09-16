import type { Metadata } from "next";
import "../globals.css";
import "@/styles/fonts.css";

/* Порталът е за собствениците на бизнеси: не се индексира и няма нищо общо с
   езиковите адреси на сайта. Собствен root layout, както админът. */
export const metadata: Metadata = {
  title: {
    default: "Бизнес портал | Bansko NOW",
    template: "%s | Bansko NOW Бизнес"
  },
  robots: {
    index: false,
    follow: false,
    nocache: true
  }
};

export default function BusinessRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg">
      <body className="font-portal bg-paper text-[var(--ink)] antialiased">{children}</body>
    </html>
  );
}
