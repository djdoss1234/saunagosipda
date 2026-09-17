"use client";

import type { CatalogOverlay } from "@/lib/localdata";
import { useApp } from "@/context/AppState";
import { formatCount } from "@/lib/format";
import { useState } from "react";

function when(iso: string) {
  if (!iso) return "아직";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "아직";
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
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink-soft)]">
      <p>
        인허가 {when(data.fetchedAt)}
        {data.fetchedAt ? ` · 폐업 ${formatCount(data.closedIds.length)} · 신규 ${formatCount(data.added.length)}` : ""}
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
        {busy ? "확인 중…" : "다시 확인"}
      </button>
      {error ? <p className="mt-2 text-xs text-[var(--ember-deep)]">{error}</p> : null}
    </div>
  );
}
