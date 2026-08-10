import "../globals.css";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg">
      <body>{children}</body>
    </html>
  );
}
