# 사우나고싶다

한국 찜질방·온천·호텔스파를 검색하고, 가고싶어요·사활·토토노이 점수로 비교하는 커뮤니티입니다.

## 명령

```bash
npm install
npm run dev          # http://127.0.0.1:3000
npm test             # 하네스 (데이터 정합 + 제보/검수 규칙)
npm run check        # test + lint + build
npx vercel login && npx vercel   # 배포. 로그인 필요
```

GitHub Actions(`.github/workflows/check.yml`)가 `main` 푸시/PR에서 같은 검사를 돌립니다. 원격 `main`은 아직 예전 커밋이라, 이 작업 트리를 푸시하기 전에는 CI가 전국 목록·락파일 수정을 모릅니다.

## 규칙이 사는 곳

UI는 규칙을 다시 만들지 않습니다. React는 `src/harness/community.ts`만 호출합니다.

| 경로 | 역할 |
| --- | --- |
| `src/harness/community.ts` | 제보·승인·반려·카탈로그 병합·스토리지 마이그레이션·지도 투영 |
| `src/harness/integrity.ts` | 시설 id / 지역 / 토토노이 프로필이 한 세트인지 |
| `src/harness/community.test.ts` | 위 규칙의 테스트 |
| `src/data/facilities.ts` | 대표 시드 + 인허가 목록 병합 |
| `src/data/licensed-baths.json` | LOCALDATA 목욕장업 · 영업중 |
| `src/data/places.ts` | 인허가 행 → Facility (온도·요금 없음) |
| `src/data/totonoiProfiles.ts` | 대표 시설 토토노이 오버라이드 |
| `src/lib/totonoi.ts` | 점수 루브릭 |
| `src/lib/search.ts` | 검색 (카탈로그를 인자로 받음) |
| `src/context/AppState.tsx` | localStorage 접착제 |

전국 목욕장업 목록은 `npm run import:baths` 로 다시 받습니다. 원천은 행정안전부 LOCALDATA입니다. 폐업·휴업은 빼고, 온도·영업시간은 원천에 없어서 비웁니다.

시군구·광주/전남 ALL CSV는 LOCALDATA가 HTTP 400입니다. 전국 다운로드(`file.localdata.go.kr/file/download/public_baths/info`, orgCode 없음)가 그 구멍을 메웁니다. `/file/public_baths/info`는 HTML이라 쓰지 않습니다. 공공데이터포털 OpenAPI는 `DATA_GO_KR_KEY`가 있을 때만 추가로 붙습니다.

커뮤니티 상태(가고싶어요·사활·제보)는 `/api/community`가 `.data/community.json`에 저장합니다. 브라우저는 localStorage를 캐시로 씁니다. Vercel에서는 기본이 `/tmp`라 인스턴스가 바뀌면 날아갑니다. 대시보드에서 Vercel KV를 붙이거나 `COMMUNITY_STORE_URL`을 넣으면 그쪽으로 갑니다.

배포는 GitHub `djdoss1234/saunagosipda`의 현재 작업 트리를 커밋·푸시한 뒤 `npx vercel login && npx vercel`이 필요합니다. 원격 `main`만 올리면 예전 시드 초안이 나갑니다. Vercel 환경 변수에 `NEXT_PUBLIC_SITE_URL`(공개 도메인)과, 커뮤니티가 안 날아가게 `KV_REST_API_*` 또는 `COMMUNITY_STORE_URL`을 넣습니다.

이용자 제보는 `/submit` → `/queue` 승인 후에만 검색·지도에 붙습니다.

## 주의

- 인허가 목록의 요금·시간·온도·성별은 원천에 없으면 비웁니다. 대표 시드 몇 곳은 데모 값입니다.
- 토토노이 점수는 의학 조언이 아닙니다.
- `.env*` 는 커밋하지 않습니다.
- 로그인·검수는 데모입니다. 누구나 닉네임만 넣으면 승인할 수 있습니다.
