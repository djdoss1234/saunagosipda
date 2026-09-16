import { ReviewForm } from "@/components/ReviewForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "사활 작성" };

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReviewForm facilityId={id} />;
}
