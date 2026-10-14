import { PlaceView } from "@/components/PlaceView";
import { getPlace } from "@/data/facilities";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export async function generateMetadata({ params }: PageProps<"/saunas/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: (await getPlace(id))?.name ?? "시설" };
}

export default async function Page({ params }: PageProps<"/saunas/[id]">) {
  const { id } = await params;
  const place = await getPlace(id);
  if (!place) notFound();
  return (
    <Suspense>
      <PlaceView place={place} />
    </Suspense>
  );
}
