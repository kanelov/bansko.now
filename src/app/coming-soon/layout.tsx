import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    absolute: "Bansko NOW — очаквайте скоро"
  },
  description: "Фотография от Пирин и животът в Банско — отблизо, през цялата година.",
  /* Поканата се обхожда свободно, но изрично казва да не се вписва. Така Google
     я вижда, прочита забраната и не остава с нищо в индекса. */
  robots: {
    index: false,
    follow: false,
    nocache: true
  }
};

export default function ComingSoonLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg">
      <body>{children}</body>
    </html>
  );
}
