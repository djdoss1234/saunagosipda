import { ClientFacilityPage } from "@/components/ClientFacilityPage";
import { FacilityDetail } from "@/components/FacilityDetail";
import { facilities, getFacility } from "@/data/facilities";
import type { Metadata } from "next";

export function generateStaticParams() {
  return facilities.map((f) => ({ id: f.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const f = getFacility(id);
  return { title: f?.name ?? "시설" };
}

export default async function FacilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const facility = getFacility(id);
  if (!facility) return <ClientFacilityPage id={id} />;
  const related = facilities.filter((f) => f.regionId === facility.regionId && f.id !== facility.id).slice(0, 3);
  return <FacilityDetail facility={facility} related={related} />;
}
