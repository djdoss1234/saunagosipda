import { articles } from "@/data/articles";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  return { title: article?.title ?? "매거진" };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();

  return (
    <article className="page-wrap max-w-2xl py-10">
      <Link href="/magazine" className="text-sm text-[var(--ember-deep)]">
        매거진
      </Link>
      <h1 className="mt-3 font-serif text-4xl leading-tight">{article.title}</h1>
      <p className="mt-3 text-sm text-[var(--muted)]">
        {article.author} · {article.date} · {article.minutes}분
      </p>
      <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-2xl">
        <Image src={article.cover} alt={article.title} fill className="object-cover" />
      </div>
      <div className="mt-8 space-y-5 text-[16px] leading-8 text-[var(--ink-soft)]">
        {article.body.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </div>
    </article>
  );
}
