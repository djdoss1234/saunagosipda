import { ReviewForm } from "@/components/ReviewForm";
import { getFacility } from "@/data/facilities";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `${getFacility(id)?.name ?? ""} 사활 작성` };
}

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getFacility(id)) notFound();
  return <ReviewForm facilityId={id} />;
}
