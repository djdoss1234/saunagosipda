"use client";

import type { CatalogOverlay } from "@/lib/localdata";
import { useApp } from "@/context/AppState";
import { formatCount } from "@/lib/format";
import { useState } from "react";

function when(iso: string) {
  if (!iso) return "아직 재확인 전";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "아직 재확인 전";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function CatalogStatus({ overlay: given }: { overlay?: CatalogOverlay }) {
  const app = useApp();
  const overlay = given?.fetchedAt ? given : app.overlay;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [live, setLive] = useState<CatalogOverlay | null>(null);
  const data = live ?? overlay;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm leading-relaxed text-[var(--ink-soft)]">
      <p>
        인허가 마지막 확인 <strong className="text-[var(--ink)]">{when(data.fetchedAt)}</strong>
        {data.fetchedAt ? (
          <>
            {" "}
            · 원천 영업 {formatCount(data.nationwideOpen)} · 폐업으로 내림 {formatCount(data.closedIds.length)} · 새로 올림{" "}
            {formatCount(data.added.length)}
          </>
        ) : (
          " · 지금은 빌드에 넣은 목록입니다."
        )}
      </p>
      <p className="mt-1 text-xs text-[var(--muted)]">
        행정안전부 목욕장업 CSV 기준입니다. 문 앞 영업·임시휴무는 인허가보다 늦거나 빠를 수 있습니다.
      </p>
      <button
        type="button"
        className="btn mt-3 min-h-11 text-sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const res = await fetch("/api/catalog/sync", { method: "POST" });
            const body = (await res.json()) as { overlay?: CatalogOverlay; error?: string };
            if (body.overlay) setLive(body.overlay);
            if (!res.ok) setError(body.error || "확인에 실패했습니다.");
          } catch {
            setError("확인에 실패했습니다.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "확인 중…" : "지금 인허가 다시 보기"}
      </button>
      {error ? <p className="mt-2 text-xs text-[var(--ember-deep)]">{error}</p> : null}
    </div>
  );
}
