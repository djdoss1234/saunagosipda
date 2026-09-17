import { articles } from "@/data/articles";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = { title: "매거진" };

export default function MagazinePage() {
  return (
    <div className="page-wrap py-10">
      <p className="kicker">Magazine</p>
      <h1 className="mt-2 font-serif text-3xl">매거진</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">탕을 고르는 눈을 키우는 긴 글.</p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {articles.map((a, i) => (
          <Link
            key={a.slug}
            href={`/magazine/${a.slug}`}
            className={`panel group overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)] ${i === 0 ? "md:col-span-2 md:grid md:grid-cols-2" : ""}`}
          >
            <div className={`relative aspect-[16/9] ${i === 0 ? "md:aspect-auto md:min-h-[280px]" : ""}`}>
              <Image src={a.cover} alt={a.title} fill className="object-cover transition duration-300 group-hover:scale-[1.02]" />
            </div>
            <div className="flex flex-col justify-center p-5 md:p-7">
              <h2 className={`font-serif ${i === 0 ? "text-3xl" : "text-xl"}`}>{a.title}</h2>
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
