import { articles } from "@/data/articles";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "매거진" };

export default function MagazinePage() {
  return (
    <div className="page-wrap py-10">
      <h1 className="font-serif text-3xl">매거진</h1>
      <div className="mt-8 grid gap-4">
        {articles.map((a) => (
          <Link key={a.slug} href={`/magazine/${a.slug}`} className="panel p-5">
            <h2 className="font-serif text-xl">{a.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{a.excerpt}</p>
            <p className="mt-3 text-xs text-[var(--muted)]">
              {a.author} · {a.date} · {a.minutes}분
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
