const hours = ["6", "8", "10", "12", "14", "16", "18", "20", "22", "0", "2", "4"];
const days = ["월", "화", "수", "목", "금", "토", "일"];

export function CrowdHeatmap({ pattern }: { pattern: number[] }) {
  return (
    <div>
      <p className="text-sm font-medium text-[var(--ink)]">혼잡 경향</p>
      <p className="mt-1 text-xs text-[var(--muted)]">이용자 사활을 바탕으로 한 시간대별 체감입니다. 당일 현장과 다를 수 있습니다.</p>
      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[520px]">
          <div className="mb-1 grid grid-cols-[40px_repeat(12,minmax(0,1fr))] gap-1 text-center text-[10px] text-[var(--muted)]">
            <span />
            {hours.map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
          {days.map((day, di) => (
            <div key={day} className="mb-1 grid grid-cols-[40px_repeat(12,minmax(0,1fr))] gap-1">
              <span className="self-center text-xs text-[var(--muted)]">{day}</span>
              {pattern.map((v, hi) => {
                const n = Math.min(5, Math.max(0, (v + ((di + hi) % 3) - 1)));
                const bg = ["#E8DFD2", "#F3D5B5", "#E8A87C", "#D85A1A", "#9A3412", "#7C2D12"][n];
                return (
                  <div
                    key={`${day}-${hi}`}
                    title={`${day} ${hours[hi]}시 · ${["한산", "여유", "보통", "혼잡", "매우 혼잡", "만원"][n]}`}
                    className="h-6 rounded-sm"
                    style={{ background: bg }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--muted)]">
        <span>한산</span>
        <span className="h-2 w-16 rounded-full bg-[linear-gradient(90deg,#E8DFD2,#9A3412)]" />
        <span>혼잡</span>
      </div>
    </div>
  );
}
