import type { Metadata } from "next";
import Experience from "./experience";
import "./scene.css";

export const metadata: Metadata = {
  title: "3D — Maison 1973",
  description: "Une promenade en 3D autour de la maison, du jour à la nuit, à Ormesson-sur-Marne.",
};

export default function ThreeDPage() {
  return <Experience />;
}
