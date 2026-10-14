import { fmtDur } from "@/harness/records";
import type { SaunaSet } from "@/lib/types";

/** 세트 = 사우나·냉탕·외기욕 시간 비율 막대. 기록 앱의 시그니처. */
export function SetBar({ sets, compact = false }: { sets: SaunaSet[]; compact?: boolean }) {
  if (!sets.length) return compact ? null : <p className="text-[12px] text-muted">세트 기록 없음</p>;
  const max = Math.max(...sets.map((s) => s.saunaSec + s.plungeSec + s.restSec), 1);
  return (
    <ol className={compact ? "flex gap-[3px]" : "grid gap-1"} aria-label={`${sets.length}세트`}>
      {sets.map((s, i) => {
        const total = s.saunaSec + s.plungeSec + s.restSec;
        const label = `${i + 1}세트: 사우나 ${fmtDur(s.saunaSec)}, 냉탕 ${fmtDur(s.plungeSec)}, 외기욕 ${fmtDur(s.restSec)}`;
        return (
          <li key={i} className={compact ? "w-5" : ""} title={label} aria-label={label}>
            <span className="flex h-1.5 gap-px overflow-hidden rounded-full" style={{ width: compact ? "100%" : `${Math.max(20, (total / max) * 100)}%` }}>
              <span className="bg-heat" style={{ flexGrow: s.saunaSec }} />
              <span className="bg-cold" style={{ flexGrow: s.plungeSec }} />
              <span className="bg-rest" style={{ flexGrow: s.restSec }} />
            </span>
          </li>
        );
      })}
    </ol>
  );
}
