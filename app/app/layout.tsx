import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maison 1973",
  description: "Rénovation d’une maison familiale de 1973 : plans, travaux et photos avant/après, du premier étage aux extérieurs.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
