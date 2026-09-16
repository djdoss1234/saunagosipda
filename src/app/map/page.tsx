import { facilities } from "@/data/facilities";
import { regionGroups, regions } from "@/data/regions";
import { formatCount } from "@/lib/format";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "지역" };

export default function MapPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-3xl">지역으로 찾기</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">17개 시·도. 가고싶어요가 모인 곳부터 둘러보세요.</p>
      <div className="mt-10 space-y-10">
        {regionGroups.map((group) => (
          <section key={group}>
            <h2 className="font-serif text-xl">{group}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {regions
                .filter((r) => r.group === group)
                .map((r) => {
                  const list = facilities.filter((f) => f.regionId === r.id);
                  const wants = list.reduce((s, f) => s + f.wantCount, 0);
                  return (
                    <Link
                      key={r.id}
                      href={`/search?region=${r.id}`}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] transition hover:-translate-y-0.5"
                    >
                      <p className="font-serif text-2xl">{r.name}</p>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        {list.length}개 시설 · 가고싶어요 {formatCount(wants)}
                      </p>
                    </Link>
                  );
                })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
