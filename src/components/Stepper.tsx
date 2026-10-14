"use client";

import { Minus, Plus } from "lucide-react";

/** 라벨 ·  − 값 + . 엄지로 누르기 좋게 40px 원. */
export function Stepper({
  label,
  value,
  display,
  step,
  min,
  max,
  onChange,
  tone,
}: {
  label: string;
  value: number;
  display: string;
  step: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  tone?: "heat" | "cold" | "rest";
}) {
  const bar = tone ? { heat: "bg-heat", cold: "bg-cold", rest: "bg-rest" }[tone] : null;
  const btn = "flex size-10 items-center justify-center rounded-full bg-fill text-ink disabled:text-fill-2";
  return (
    <div className="flex min-h-14 items-center justify-between gap-3">
      <span className="flex items-center gap-2.5 text-[15px] text-ink-soft">
        {bar ? <i className={`h-3.5 w-1 rounded-full ${bar}`} aria-hidden /> : null}
        {label}
      </span>
      <span className="flex items-center gap-1">
        <button type="button" aria-label={`${label} 줄이기`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))} className={btn}>
          <Minus className="size-4" strokeWidth={2.2} aria-hidden />
        </button>
        <output className="num w-[4.5rem] text-center text-[16px] font-semibold" aria-live="polite">
          {display}
        </output>
        <button type="button" aria-label={`${label} 늘리기`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))} className={btn}>
          <Plus className="size-4" strokeWidth={2.2} aria-hidden />
        </button>
      </span>
    </div>
  );
}
