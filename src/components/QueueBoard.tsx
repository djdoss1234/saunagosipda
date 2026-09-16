"use client";

import { useApp } from "@/context/AppState";
import { regions } from "@/data/regions";
import type { SubmissionStatus } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export function QueueBoard() {
  const { user, submissions, approveSubmission, rejectSubmission, pendingCount } = useApp();
  const router = useRouter();
  const [tab, setTab] = useState<SubmissionStatus | "all">("pending");
  const [reason, setReason] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState("");

  const list = useMemo(
    () => (tab === "all" ? submissions : submissions.filter((s) => s.status === tab)),
    [submissions, tab],
  );

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-serif text-3xl">검수 큐</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">대기열을 보려면 로그인하세요. 데모에서는 로그인한 사람이 검수합니다.</p>
        <button
          type="button"
          className="mt-6 inline-flex min-h-12 items-center rounded-full bg-[var(--ember)] px-5 text-sm font-semibold text-white"
          onClick={() => router.push("/login?next=/queue")}
        >
          로그인
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-3xl">검수 큐</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        대기 {pendingCount}건. 승인하면 검색·지도에 바로 붙습니다. 운영 단계에서는 스태프 권한으로 분리하세요.
      </p>
      {banner ? <p className="mt-3 text-sm text-[var(--ember-deep)]">{banner}</p> : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={`min-h-11 rounded-full px-4 text-sm ${
              tab === t ? "bg-[var(--ink)] text-[var(--cream)]" : "border border-[var(--border)] bg-[var(--surface)]"
            }`}
            onClick={() => setTab(t)}
          >
            {t === "pending" ? "대기" : t === "approved" ? "승인" : t === "rejected" ? "반려" : "전체"}
          </button>
        ))}
      </div>

      <ul className="mt-6 space-y-4">
        {list.length === 0 ? (
          <li className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">
            이 상태의 제보가 없습니다. <Link href="/submit" className="text-[var(--ember-deep)]">시설 제보</Link>
          </li>
        ) : (
          list.map((s) => {
            const region = regions.find((r) => r.id === s.regionId)?.name;
            return (
              <li key={s.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-serif text-xl">{s.name}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {region} {s.district} · {s.type} · {s.submitterName} · {s.createdAt.slice(0, 10)}
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--cream-2)] px-2.5 py-1 text-xs">
                    {s.status === "pending" ? "대기" : s.status === "approved" ? "승인" : "반려"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">{s.description}</p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  사우나 {s.saunaTemp}°C · 냉탕 {s.plungeTemp}°C · 외기욕 {s.outdoorRest} · 동선 {s.loop} · 출처 {s.source}
                </p>
                {s.rejectReason ? <p className="mt-2 text-sm text-[var(--ember-deep)]">반려: {s.rejectReason}</p> : null}
                {s.status === "approved" && s.facilityId ? (
                  <Link href={`/saunas/${s.facilityId}`} className="mt-3 inline-flex min-h-11 text-sm text-[var(--ember-deep)]">
                    카탈로그에서 보기
                  </Link>
                ) : null}
                {s.status === "pending" ? (
                  <div className="mt-4 space-y-2">
                    <label htmlFor={`reason-${s.id}`} className="text-sm font-medium">
                      반려 사유
                    </label>
                    <input
                      id={`reason-${s.id}`}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--cream)] px-3 py-3 text-sm"
                      value={reason[s.id] ?? ""}
                      onChange={(e) => setReason((prev) => ({ ...prev, [s.id]: e.target.value }))}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="inline-flex min-h-11 items-center rounded-full bg-[var(--ink)] px-4 text-sm font-semibold text-[var(--cream)]"
                        onClick={() => {
                          const r = approveSubmission(s.id);
                          setBanner(r.message);
                        }}
                      >
                        승인
                      </button>
                      <button
                        type="button"
                        className="inline-flex min-h-11 items-center rounded-full border border-[var(--border)] px-4 text-sm"
                        onClick={() => {
                          const r = rejectSubmission(s.id, reason[s.id] ?? "");
                          setBanner(r.message);
                        }}
                      >
                        반려
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
