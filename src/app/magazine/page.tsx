import { articles } from "@/data/articles";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = { title: "매거진" };

export default function MagazinePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-3xl">매거진</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">탕을 고르는 눈을 키우는 긴 글.</p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {articles.map((a) => (
          <Link key={a.slug} href={`/magazine/${a.slug}`} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
            <div className="relative aspect-[16/9]">
              <Image src={a.cover} alt="" fill className="object-cover" />
            </div>
            <div className="p-5">
              <h2 className="font-serif text-xl">{a.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{a.excerpt}</p>
              <p className="mt-3 text-xs text-[var(--muted)]">
                {a.author} · {a.date} · {a.minutes}분
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
