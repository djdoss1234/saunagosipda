import { SearchBox } from "@/components/SearchBox";
import { VisitCard } from "@/components/VisitCard";
import { facilities } from "@/data/facilities";
import { isLicensedId } from "@/data/places";
import { regions } from "@/data/regions";
import { seedVisits } from "@/data/visits";
import { formatCount } from "@/lib/format";
import Link from "next/link";

export default function HomePage() {
  const latest = seedVisits.slice(0, 4);
  const count = facilities.filter((f) => isLicensedId(f.id)).length;
  const quick = [
    { href: "/search?region=seoul", label: "서울" },
    { href: "/search?region=busan", label: "부산" },
    { href: "/search?region=incheon", label: "인천" },
    { href: "/search?region=gwangju", label: "광주" },
    { href: "/search?region=gyeonggi", label: "경기" },
  ];

  return (
    <div>
      <section className="border-b border-[var(--border)]">
        <div className="page-wrap grid gap-10 py-16 sm:py-24 lg:grid-cols-[1fr_minmax(0,28rem)] lg:items-end">
          <div>
            <h1 className="font-serif text-5xl leading-[1.15] text-[var(--ink)] sm:text-6xl">사우나고싶다</h1>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-[var(--muted)]">전국 목욕장업 {formatCount(count)}곳</p>
          </div>
          <div>
            <SearchBox autoFocus />
            <div className="mt-4 flex flex-wrap gap-2">
              {quick.map((chip) => (
                <Link key={chip.href} href={chip.href} className="chip min-h-11 py-0 text-sm">
                  {chip.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="page-wrap grid gap-16 py-16 lg:grid-cols-[1fr_220px]">
        <section>
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-serif text-3xl">최근 방문</h2>
            <Link href="/visits" className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">
              더 보기
            </Link>
          </div>
          <div className="mt-8 grid gap-6">
            {latest.map((v) => (
              <VisitCard key={v.id} visit={v} />
            ))}
          </div>
        </section>
        <aside>
          <h2 className="font-serif text-2xl">지역</h2>
          <div className="mt-6 flex flex-col gap-1">
            {regions.map((r) => (
              <Link key={r.id} href={`/search?region=${r.id}`} className="py-1.5 text-sm text-[var(--muted)] hover:text-[var(--ink)]">
                {r.name}
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
