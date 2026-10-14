import { Feed } from "@/components/Feed";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "피드" };

export default function Page() {
  return <Feed />;
}
