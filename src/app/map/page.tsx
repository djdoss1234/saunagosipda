import { MapExplorer } from "@/components/MapExplorer";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "지도" };

export default function MapPage() {
  return <MapExplorer />;
}
