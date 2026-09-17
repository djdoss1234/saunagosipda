"use client";

import { useApp } from "@/context/AppState";
import { formatCount } from "@/lib/format";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";

export function WantButton({ facilityId, baseCount }: { facilityId: string; baseCount: number }) {
  const { user, wants, toggleWant } = useApp();
  const router = useRouter();
  const on = wants.includes(facilityId);
  const count = baseCount + (on ? 1 : 0);

  return (
    <button
      type="button"
      aria-pressed={on}
      className={`inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-full px-5 text-sm font-semibold transition ${
        on
          ? "bg-[var(--ember)] text-white"
          : "border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--ember)]"
      }`}
      onClick={() => {
        const ok = toggleWant(facilityId);
        if (!ok) router.push(`/login?next=/saunas/${facilityId}`);
      }}
    >
      <Heart className={`size-4 ${on ? "fill-current" : ""}`} aria-hidden />
      가고싶어요 {formatCount(count)}
      {!user ? <span className="text-xs font-normal opacity-80">로그인</span> : null}
    </button>
  );
}
