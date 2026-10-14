import { PlaceSearch } from "@/components/PlaceSearch";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "사우나 찾기" };

export default function Page() {
  return (
    <Suspense>
      <PlaceSearch />
    </Suspense>
  );
}
