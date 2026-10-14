"use client";

import { areaOf } from "@/components/PlacePicker";
import { RecordCard, TotonoiTag } from "@/components/RecordCard";
import { SetBar } from "@/components/SetBar";
import { useApp } from "@/context/AppState";
import { byNewest, placeStats } from "@/harness/records";
import type { Place, SessionRecord } from "@/lib/types";
import { Bookmark, Check, MapPin, PencilLine, Phone } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function fmtPhone(p: string) {
  const d = p.replace(/\D/g, "");
  if (/^02\d{7,8}$/.test(d)) return d.replace(/^(02)(\d{3,4})(\d{4})$/, "$1-$2-$3");
  if (/^0\d{9,10}$/.test(d)) return d.replace(/^(0\d{2})(\d{3,4})(\d{4})$/, "$1-$2-$3");
  return p;
}

/** 시설 = 인허가 기본정보 + 이용자 기록. 기록 직후엔 맨 위에 방금 남긴 기록. 기록 없는 숫자는 보여 주지 않는다. */
export function PlaceView({ place }: { place: Place }) {
  const { records, wants, toggleWant } = useApp();
  const savedId = useSearchParams().get("saved");
  const [publicRecs, setPublicRecs] = useState<SessionRecord[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/records?place=${encodeURIComponent(place.id)}`)
      .then((r) => (r.ok ? r.json() : { records: [] }))
      .then((b: { records?: SessionRecord[] }) => alive && setPublicRecs(b.records ?? []))
      .catch(() => alive && setPublicRecs([]));
    return () => {
      alive = false;
    };
  }, [place.id]);

  const mine = records.filter((r) => r.placeId === place.id);
  const all = [...new Map([...(publicRecs ?? []), ...mine].map((r) => [r.id, r])).values()].sort(byNewest);
  const st = placeStats(all);
  const want = wants.includes(place.id);
  const justSaved = savedId ? records.find((r) => r.id === savedId) : undefined;
  const others = all.filter((r) => r.id !== justSaved?.id);
  const map = `https://map.naver.com/p/search/${encodeURIComponent(`${place.name} ${place.district}`)}`;

  return (
    <div className="grid gap-6 pt-2">
      {justSaved ? (
        <section className="grid gap-3 rounded-2xl bg-fill p-4" aria-labelledby="saved-h" role="status">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-ink text-on-ink">
              <Check className="size-3.5" strokeWidth={3} aria-hidden />
            </span>
            <h2 id="saved-h" className="text-[16px] font-bold">
              기록했어요
            </h2>
            <Link href={`/new?edit=${justSaved.id}`} className="ml-auto text-[13px] text-muted underline underline-offset-2">
              수정
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <TotonoiTag value={justSaved.totonoi} size="md" />
            <span className="num text-[13px] text-muted">{justSaved.sets.length}세트</span>
          </div>
          <SetBar sets={justSaved.sets} />
          <p className="text-[13px] text-muted">{justSaved.public ? "피드에 올라갔어요." : "나만 볼 수 있게 저장했어요."} 아래는 이곳의 정보와 다른 사람들 기록이에요.</p>
        </section>
      ) : null}

      <header className="grid gap-1.5">
        <p className="text-[13px] text-muted">
          {areaOf(place)} · {place.type}
        </p>
        <h1 className="text-[24px] leading-tight font-bold">{place.name}</h1>
        <div className="mt-1 grid gap-1 text-[14px] text-ink-soft">
          <a href={map} target="_blank" rel="noreferrer" className="flex items-start gap-1.5">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
            <span className="underline-offset-2 hover:underline">{place.address}</span>
          </a>
          {place.phone ? (
            <a href={`tel:${place.phone}`} className="flex items-center gap-1.5">
              <Phone className="size-4 shrink-0 text-muted" aria-hidden />
              <span className="num">{fmtPhone(place.phone)}</span>
            </a>
          ) : null}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => toggleWant(place.id)} aria-pressed={want} className={want ? "btn-ink" : "btn-fill"}>
          <Bookmark className={`size-[18px] ${want ? "fill-current" : ""}`} strokeWidth={1.9} aria-hidden />
          {want ? "가고싶어요 저장됨" : "가고싶어요"}
        </button>
        <Link href={`/new?place=${place.id}&name=${encodeURIComponent(place.name)}&area=${encodeURIComponent(areaOf(place))}`} className="btn-fill">
          <PencilLine className="size-[18px]" strokeWidth={1.9} aria-hidden />
          여기 기록하기
        </Link>
      </div>

      <div className="divider" />

      <section aria-labelledby="pst" className="grid gap-3">
        <h2 id="pst" className="section-title">
          이용자 기록 {st ? <span className="num text-[15px] font-medium text-muted">{st.count}</span> : null}
        </h2>
        {st ? (
          <>
            <dl className="grid grid-cols-4 gap-2 text-center">
              {[
                { k: "사우나", v: st.saunaTempC !== null ? `${st.saunaTempC}°` : "–", c: "text-heat" },
                { k: "냉탕", v: st.plungeTempC !== null ? `${st.plungeTempC}°` : "–", c: "text-cold" },
                { k: "평균 세트", v: st.avgSets ?? "–", c: "" },
                { k: "토토노이", v: st.avgTotonoi, c: "text-rest" },
              ].map((x) => (
                <div key={x.k} className="rounded-xl bg-fill px-1 py-3">
                  <dd className={`num text-[18px] font-bold ${x.c}`}>{x.v}</dd>
                  <dt className="mt-0.5 text-[12px] text-muted">{x.k}</dt>
                </div>
              ))}
            </dl>
            <p className="text-[12px] text-muted">온도는 이용자가 체감한 기록의 중앙값이에요. 시설 공식 정보가 아니에요.</p>
          </>
        ) : publicRecs ? (
          <p className="text-[14px] leading-relaxed text-muted">아직 기록이 없어요. 온도·요금·영업시간은 인허가 자료에 없어서 비워 뒀어요.</p>
        ) : null}

        {others.length ? (
          <div className="divide-y divide-line border-t border-line">
            {others.slice(0, 30).map((r) => (
              <RecordCard key={r.id} r={r} showPlace={false} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
