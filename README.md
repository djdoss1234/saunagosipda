# 사우나고싶다

한국 찜질방·온천·호텔스파를 검색하고, **가고싶어요**로 저장하고, **사활**로 남기는 커뮤니티입니다. 일본 [사우나이키타이](https://sauna-ikitai.com/)의 정보 구조(검색·저장·방문기록·랭킹)를 한국 시설 문법에 맞춰 옮긴 프로토타입입니다.

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://127.0.0.1:3000`

## 구조 (유지보수)

| 경로 | 역할 |
| --- | --- |
| `src/data/facilities.ts` | 시설 마스터 (이름, 요금, 온도, 주소) |
| `src/data/totonoiProfiles.ts` | 토토노이 루프 프로필 (외기욕, 동선, 습도) |
| `src/data/visits.ts` | 샘플 사활 |
| `src/lib/totonoi.ts` | 냉탕 16–18°C 등 채점 루브릭 |
| `src/lib/search.ts` | 검색·필터 |
| `src/context/AppState.tsx` | 로그인·가고싶어요·사활 (브라우저 localStorage) |

시설을 추가할 때는 `facilities.ts`에 한 건 넣고, 같은 `id`로 `totonoiProfiles.ts`에 외기욕·동선을 적으면 됩니다.

## 주의

- 영업시간·요금·온도는 데모 값이며 실제와 다를 수 있습니다.
- 토토노이 점수는 의학 조언이 아닙니다.
- `.env*` 는 커밋하지 않습니다.
