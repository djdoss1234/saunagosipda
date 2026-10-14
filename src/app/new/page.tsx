import { RecordFormPage } from "@/components/RecordForm";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "기록하기" };

export default function Page() {
  return (
    <Suspense>
      <RecordFormPage />
    </Suspense>
  );
}
