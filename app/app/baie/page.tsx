import type { Metadata } from "next";
import Rack from "./rack";
import "./rack.css";
import "./cabinet.css";

export const metadata: Metadata = { title: "Baie informatique · Maison 1973", description: "Configuration de la baie informatique." };
export default function Page() { return <Rack />; }
