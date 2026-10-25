import type { Metadata } from "next";
import PanelEditor from "./components/panel-editor";
import "./panel.css";
import "./gtl-studio.css";

export const metadata: Metadata = {
  title: "TE · Maison 1973",
  description: "Composez le tableau électrique de la maison avec un éditeur visuel Schneider Resi9 XE.",
};

export default function ElectricalPanelPage() {
  return <PanelEditor />;
}
