import { LockerTimer } from "@/components/LockerTimer";
import { PhaseTimer } from "@/components/PhaseTimer";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "타이머" };

export default async function Page({ searchParams }: PageProps<"/live">) {
  const { mode } = await searchParams;
  return mode === "phases" ? <PhaseTimer /> : <LockerTimer />;
}
