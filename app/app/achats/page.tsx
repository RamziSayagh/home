import type { Metadata } from "next";
import Purchases from "./purchases";
import "./purchases.css";

export const metadata: Metadata = {
  title: "Achats · Maison 1973",
  description: "Articles, matériaux et suivi des achats pour les travaux de la maison.",
};

export default function PurchasesPage() {
  return <Purchases />;
}
