import { Me } from "@/components/Me";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "마이" };

export default function Page() {
  return (
    <Suspense>
      <Me />
    </Suspense>
  );
}
