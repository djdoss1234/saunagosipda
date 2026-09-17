"use client";

import { FacilityCard } from "@/components/FacilityCard";
import { VisitCard } from "@/components/VisitCard";
import { useApp } from "@/context/AppState";
import Link from "next/link";

export default function MePage() {
  const { user, wants, visits, logout, catalog } = useApp();
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-serif text-3xl">내 기록</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">가고싶어요와 방문 기록을 보려면 로그인하세요.</p>
        <Link href="/login?next=/me" className="btn-primary btn mt-6">
          로그인
        </Link>
      </div>
    );
  }

  const mine = visits.filter((v) => v.userId === user.id);
  const saved = wants.map((id) => catalog.find((f) => f.id === id)).filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl">{user.name}</h1>
          <p className="text-sm text-[var(--muted)]">{user.email}</p>
        </div>
        <button type="button" className="min-h-11 text-sm text-[var(--muted)]" onClick={logout}>
          로그아웃
        </button>
      </div>
      <section className="mt-10">
        <h2 className="font-serif text-2xl">가고싶어요</h2>
        <div className="mt-4 grid gap-4">
          {saved.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">아직 저장한 탕이 없습니다.</p>
          ) : (
            saved.map((f) => f && <FacilityCard key={f.id} facility={f} />)
          )}
        </div>
      </section>
      <section className="mt-10">
        <h2 className="font-serif text-2xl">내가 쓴 방문</h2>
        <div className="mt-4 grid gap-4">
          {mine.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">첫 방문 기록을 남겨 보세요.</p>
          ) : (
            mine.map((v) => <VisitCard key={v.id} visit={v} />)
          )}
        </div>
      </section>
    </div>
  );
}
