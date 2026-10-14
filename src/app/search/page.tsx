import { redirect } from "next/navigation";

// 예전 링크(/search?q=…) 호환
export default async function Page({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  redirect(q ? `/saunas?q=${encodeURIComponent(q)}` : "/saunas");
}
