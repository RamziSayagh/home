import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import SiteNavigation from "./site-navigation";

export const metadata: Metadata = {
  title: "Maison 1973",
  description: "Rénovation d’une maison familiale de 1973 : plans, travaux et photos avant/après, du premier étage aux extérieurs.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body>
        <SiteNavigation />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
