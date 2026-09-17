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
      <section className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="page-wrap py-12 sm:py-16">
          <h1 className="font-serif text-4xl leading-tight text-[var(--ink)] sm:text-5xl">사우나고싶다</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">전국 목욕장업 {formatCount(count)}곳</p>
          <div className="mt-8 max-w-xl">
            <SearchBox autoFocus />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {quick.map((chip) => (
              <Link key={chip.href} href={chip.href} className="chip min-h-11 py-0 text-sm">
                {chip.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="page-wrap grid gap-12 py-12 lg:grid-cols-[1fr_280px]">
        <section>
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-serif text-2xl">최근 방문</h2>
            <Link href="/visits" className="text-sm text-[var(--ember-deep)]">
              더 보기
            </Link>
          </div>
          <div className="mt-6 grid gap-6">
            {latest.map((v) => (
              <VisitCard key={v.id} visit={v} />
            ))}
          </div>
        </section>
        <aside>
          <h2 className="font-serif text-xl">지역</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {regions.map((r) => (
              <Link key={r.id} href={`/search?region=${r.id}`} className="chip min-h-10 py-0">
                {r.name}
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
