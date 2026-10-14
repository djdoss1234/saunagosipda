import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "데이터 출처와 원칙" };

export default function AboutPage() {
  return (
    <article className="grid gap-5 text-[15px] leading-relaxed text-ink-soft">
      <h1 className="text-2xl font-bold text-ink">데이터 출처와 원칙</h1>
      <section className="grid gap-2">
        <h2 className="font-semibold text-ink">기록이 먼저</h2>
        <p>
          사우나고싶다는 사우나 → 냉탕 → 외기욕 세트를 남기는 기록 앱이에요. 시간·온도·토토노이를 쌓으면 내 루틴과 잘 맞는 날의
          패턴이 보여요.
        </p>
      </section>
      <section className="grid gap-2">
        <h2 className="font-semibold text-ink">시설 정보</h2>
        <p>
          시설 목록은 행정안전부 LOCALDATA 목욕장업 인허가(영업중)예요. 원천에 없는 온도·요금·영업시간은 지어내지 않고 비워 둬요.
          시설 화면의 숫자는 이용자 기록의 중앙값이고, 공식 정보가 아니에요.
        </p>
      </section>
      <section className="grid gap-2">
        <h2 className="font-semibold text-ink">저장</h2>
        <p>내 기록은 이 기기(브라우저)에 저장돼요. &lsquo;피드에 공개&rsquo;를 켠 기록만 서버로 가요. 언제든 나 → CSV로 받을 수 있어요.</p>
      </section>
      <section className="grid gap-2">
        <h2 className="font-semibold text-ink">안내값</h2>
        <p>
          권장 시간은 『의사가 가르쳐 주는 사우나 교과서』(가토 야스타카)를 따랐어요. 의학 조언이 아니에요. 고혈압·심혈관 질환이
          있거나 음주·감기 중이면 사우나를 피하세요.
        </p>
      </section>
      <Link href="/" className="btn-ink">
        기록으로
      </Link>
    </article>
  );
}
