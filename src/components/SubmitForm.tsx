"use client";

import { useApp } from "@/context/AppState";
import { regions } from "@/data/regions";
import type { SubmitDraft } from "@/harness/community";
import { TOTONOI_GUIDE } from "@/lib/totonoi";
import type { FacilityType, GenderPolicy, HumidityStyle, LoopQuality, OutdoorRest, PlungeDepth } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

const input = "mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm";

export function SubmitForm() {
  const { user, submitFacility } = useApp();
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<SubmitDraft>({
    name: "",
    regionId: "seoul",
    district: "",
    address: "",
    type: "사우나",
    phone: "",
    priceFrom: 10000,
    hours: "",
    genderPolicy: "남녀분리",
    saunaTemp: 90,
    plungeTemp: 16,
    outdoorRest: "있음",
    loop: "보통",
    humidity: "건식",
    plungeDepth: "어깨",
    restLieDown: true,
    natureView: false,
    tvInSauna: false,
    description: "",
    source: "",
  });

  function set<K extends keyof SubmitDraft>(key: K, value: SubmitDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setError("");
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-serif text-3xl">시설 제보</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">검수 큐에 올리려면 로그인이 필요합니다.</p>
        <button
          type="button"
          className="mt-6 inline-flex min-h-12 items-center rounded-full bg-[var(--ember)] px-5 text-sm font-semibold text-white"
          onClick={() => router.push("/login?next=/submit")}
        >
          로그인
        </button>
      </div>
    );
  }

  return (
    <form
      className="mx-auto max-w-xl space-y-5 px-4 py-10"
      onSubmit={(e) => {
        e.preventDefault();
        setSaving(true);
        const result = submitFacility(draft);
        setSaving(false);
        if (!result.ok) {
          setError(result.message);
          return;
        }
        router.push("/queue");
      }}
    >
      <h1 className="font-serif text-3xl">시설 제보</h1>
      <p className="text-sm text-[var(--muted)]">
        바로 공개되지 않습니다. 검수 대기 큐에서 확인한 뒤 검색·지도에 올라갑니다. 온도는 그날 체감이어도 됩니다.
      </p>

      <fieldset className="space-y-4">
        <legend className="font-medium">기본</legend>
        <div>
          <label htmlFor="name" className="text-sm font-medium">
            시설명 <span className="text-[var(--ember)]">*</span>
          </label>
          <input id="name" className={input} value={draft.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="region" className="text-sm font-medium">
              시·도 <span className="text-[var(--ember)]">*</span>
            </label>
            <select id="region" className={input} value={draft.regionId} onChange={(e) => set("regionId", e.target.value)}>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="district" className="text-sm font-medium">
              구·군 <span className="text-[var(--ember)]">*</span>
            </label>
            <input id="district" className={input} value={draft.district} onChange={(e) => set("district", e.target.value)} />
          </div>
        </div>
        <div>
          <label htmlFor="address" className="text-sm font-medium">
            주소 <span className="text-[var(--ember)]">*</span>
          </label>
          <input id="address" className={input} value={draft.address} onChange={(e) => set("address", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="type" className="text-sm font-medium">
              유형
            </label>
            <select
              id="type"
              className={input}
              value={draft.type}
              onChange={(e) => set("type", e.target.value as FacilityType)}
            >
              {(["찜질방", "온천", "호텔스파", "사우나", "워터파크스파"] as FacilityType[]).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="gender" className="text-sm font-medium">
              입장
            </label>
            <select
              id="gender"
              className={input}
              value={draft.genderPolicy}
              onChange={(e) => set("genderPolicy", e.target.value as GenderPolicy)}
            >
              {(["남녀분리", "혼성", "남성전용", "여성전용"] as GenderPolicy[]).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="price" className="text-sm font-medium">
              입장료(원)
            </label>
            <input
              id="price"
              type="number"
              inputMode="numeric"
              className={input}
              value={draft.priceFrom}
              onChange={(e) => set("priceFrom", Number(e.target.value))}
            />
          </div>
          <div>
            <label htmlFor="hours" className="text-sm font-medium">
              영업시간
            </label>
            <input
              id="hours"
              className={input}
              placeholder="예: 24시간, 06:00–22:00"
              value={draft.hours}
              onChange={(e) => set("hours", e.target.value)}
            />
          </div>
        </div>
        <div>
          <label htmlFor="phone" className="text-sm font-medium">
            전화
          </label>
          <input id="phone" type="tel" className={input} value={draft.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-medium">토토노이 루프</legend>
        <p className="text-xs text-[var(--muted)]">
          권장 냉탕 {TOTONOI_GUIDE.plungeTemp.min}–{TOTONOI_GUIDE.plungeTemp.max}°C · 외기욕 {TOTONOI_GUIDE.restMinutes.min}–{TOTONOI_GUIDE.restMinutes.max}분
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="sauna" className="text-sm font-medium">
              사우나 °C <span className="text-[var(--ember)]">*</span>
            </label>
            <input
              id="sauna"
              type="number"
              inputMode="numeric"
              className={input}
              value={draft.saunaTemp}
              onChange={(e) => set("saunaTemp", Number(e.target.value))}
            />
          </div>
          <div>
            <label htmlFor="plunge" className="text-sm font-medium">
              냉탕 °C <span className="text-[var(--ember)]">*</span>
            </label>
            <input
              id="plunge"
              type="number"
              inputMode="numeric"
              className={input}
              value={draft.plungeTemp}
              onChange={(e) => set("plungeTemp", Number(e.target.value))}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="outdoor" className="text-sm font-medium">
              외기욕
            </label>
            <select
              id="outdoor"
              className={input}
              value={draft.outdoorRest}
              onChange={(e) => set("outdoorRest", e.target.value as OutdoorRest)}
            >
              {(["없음", "내기욕만", "있음", "우수"] as OutdoorRest[]).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="loop" className="text-sm font-medium">
              동선
            </label>
            <select id="loop" className={input} value={draft.loop} onChange={(e) => set("loop", e.target.value as LoopQuality)}>
              {(["끊김", "보통", "좋음"] as LoopQuality[]).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="humidity" className="text-sm font-medium">
              습도
            </label>
            <select
              id="humidity"
              className={input}
              value={draft.humidity}
              onChange={(e) => set("humidity", e.target.value as HumidityStyle)}
            >
              {(["건식", "습식가능", "로우류"] as HumidityStyle[]).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="depth" className="text-sm font-medium">
              냉탕 수심
            </label>
            <select
              id="depth"
              className={input}
              value={draft.plungeDepth}
              onChange={(e) => set("plungeDepth", e.target.value as PlungeDepth)}
            >
              {(["얕음", "어깨", "깊음"] as PlungeDepth[]).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-[var(--ember)]"
            checked={draft.restLieDown}
            onChange={(e) => set("restLieDown", e.target.checked)}
          />
          누워서 쉴 수 있음
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-[var(--ember)]"
            checked={draft.natureView}
            onChange={(e) => set("natureView", e.target.checked)}
          />
          바람·전망이 있음
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-[var(--ember)]"
            checked={draft.tvInSauna}
            onChange={(e) => set("tvInSauna", e.target.checked)}
          />
          사우나에 TV가 있음
        </label>
      </fieldset>

      <div>
        <label htmlFor="desc" className="text-sm font-medium">
          소개 <span className="text-[var(--ember)]">*</span>
        </label>
        <textarea
          id="desc"
          rows={5}
          className={input}
          value={draft.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="루프가 어떻게 이어지는지, 냉탕·외기욕 체감."
        />
      </div>
      <div>
        <label htmlFor="source" className="text-sm font-medium">
          출처 <span className="text-[var(--ember)]">*</span>
        </label>
        <input
          id="source"
          className={input}
          value={draft.source}
          onChange={(e) => set("source", e.target.value)}
          placeholder="직접 방문 / 홈페이지 / 간판"
        />
      </div>

      {error ? <p className="text-sm text-[var(--ember-deep)]">{error}</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--ember)] text-sm font-semibold text-white disabled:opacity-70"
      >
        {saving ? "접수 중…" : "검수 큐로 보내기"}
      </button>
    </form>
  );
}
