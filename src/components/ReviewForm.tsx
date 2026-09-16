"use client";

import { getFacility } from "@/data/facilities";
import { useApp } from "@/context/AppState";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReviewForm({ facilityId }: { facilityId: string }) {
  const facility = getFacility(facilityId);
  const { user, addVisit } = useApp();
  const router = useRouter();
  const [body, setBody] = useState("");
  const [food, setFood] = useState("");
  const [sauna, setSauna] = useState(facility?.saunas[0]?.tempC.toString() ?? "90");
  const [plunge, setPlunge] = useState(facility?.plunges[0]?.tempC.toString() ?? "16");
  const [visitNumber, setVisitNumber] = useState("1");
  const [outdoor, setOutdoor] = useState("있음");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!facility) return null;

  return (
    <form
      className="mx-auto max-w-xl space-y-5 px-4 py-10"
      onSubmit={(e) => {
        e.preventDefault();
        if (!user) {
          router.push(`/login?next=/saunas/${facilityId}/review`);
          return;
        }
        if (body.trim().length < 20) {
          setError("사활은 20자 이상 적어 주세요. 온도 체감이나 동선을 남기면 다른 사람에게 도움이 됩니다.");
          return;
        }
        setSaving(true);
        const outdoorLine = `외기욕: ${outdoor}`;
        addVisit({
          facilityId,
          visitNumber: Number(visitNumber) || 1,
          body: `${body.trim()}\n\n${outdoorLine}`,
          food: food.trim() || undefined,
          saunaTemps: [Number(sauna) || 0],
          plungeTemps: [Number(plunge) || 0],
          photo: facility.cover,
        });
        router.push(`/saunas/${facilityId}`);
      }}
    >
      <h1 className="font-serif text-3xl">{facility.name} 사활</h1>
      <p className="text-sm text-[var(--muted)]">다녀온 날의 온도, 물, 먹은 것까지. 짧은 일기처럼 남겨도 됩니다.</p>

      <div>
        <label htmlFor="visit-n" className="text-sm font-medium">
          몇 번째 방문인가요? <span className="text-[var(--ember)]">*</span>
        </label>
        <input
          id="visit-n"
          type="number"
          min={1}
          inputMode="numeric"
          value={visitNumber}
          onChange={(e) => setVisitNumber(e.target.value)}
          className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="sauna-t" className="text-sm font-medium">
            사우나 °C
          </label>
          <input
            id="sauna-t"
            type="number"
            inputMode="numeric"
            value={sauna}
            onChange={(e) => setSauna(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3"
          />
        </div>
        <div>
          <label htmlFor="plunge-t" className="text-sm font-medium">
            냉탕 °C
          </label>
          <input
            id="plunge-t"
            type="number"
            inputMode="numeric"
            value={plunge}
            onChange={(e) => setPlunge(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3"
          />
          <p className="mt-1 text-xs text-[var(--muted)]">참고: 토토노이 권장 냉탕은 16–18°C</p>
        </div>
      </div>
      <div>
        <label htmlFor="outdoor" className="text-sm font-medium">
          외기욕은 어땠나요?
        </label>
        <select
          id="outdoor"
          value={outdoor}
          onChange={(e) => setOutdoor(e.target.value)}
          className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3"
        >
          <option>없음</option>
          <option>내기욕만</option>
          <option>있음</option>
          <option>누워서 5분 이상 가능</option>
          <option>바람·전망이 좋음</option>
        </select>
      </div>
      <div>
        <label htmlFor="body" className="text-sm font-medium">
          기록 <span className="text-[var(--ember)]">*</span>
        </label>
        <textarea
          id="body"
          rows={7}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            setError("");
          }}
          className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm leading-relaxed"
          placeholder="몇 세트를 돌렸는지, 외기욕은 어땠는지, 다음에 다시 올지."
        />
        {error ? <p className="mt-1 text-sm text-[var(--ember-deep)]">{error}</p> : null}
      </div>
      <div>
        <label htmlFor="food" className="text-sm font-medium">
          오늘 먹은 것
        </label>
        <input
          id="food"
          value={food}
          onChange={(e) => setFood(e.target.value)}
          className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3"
          placeholder="식혜, 온면, 온천죽…"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full bg-[var(--ember)] text-sm font-semibold text-white hover:bg-[var(--ember-deep)] disabled:opacity-70"
      >
        {saving ? "저장 중…" : "사활 등록"}
      </button>
    </form>
  );
}
