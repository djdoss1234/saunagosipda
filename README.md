# 사우나고싶다

한국 찜질방·온천·호텔스파를 검색하고, 가고싶어요·사활·토토노이 점수로 비교하는 커뮤니티 프로토타입입니다.

## 명령

```bash
npm install
npm run dev          # http://127.0.0.1:3000
npm test             # 하네스 (데이터 정합 + 제보/검수 규칙)
npm run check        # test + lint + build
```

GitHub Actions(`.github/workflows/check.yml`)가 `main` 푸시/PR에서 같은 검사를 돌립니다.

## 규칙이 사는 곳

UI는 규칙을 다시 만들지 않습니다. React는 `src/harness/community.ts`만 호출합니다.

| 경로 | 역할 |
| --- | --- |
| `src/harness/community.ts` | 제보·승인·반려·카탈로그 병합·스토리지 마이그레이션·지도 투영 |
| `src/harness/integrity.ts` | 시설 id / 지역 / 토토노이 프로필이 한 세트인지 |
| `src/harness/community.test.ts` | 위 규칙의 테스트 |
| `src/data/facilities.ts` | 시드 시설 |
| `src/data/totonoiProfiles.ts` | 시드 토토노이 프로필 (id가 시설과 1:1) |
| `src/lib/totonoi.ts` | 점수 루브릭 |
| `src/lib/search.ts` | 검색 (카탈로그를 인자로 받음) |
| `src/context/AppState.tsx` | localStorage 접착제 |

시설을 코드에 넣을 때: `facilities.ts` + **같은 id**로 `totonoiProfiles.ts`. 프로필이 빠지면 `npm test`가 실패합니다.

이용자 제보는 `/submit` → `/queue` 승인 후에만 검색·지도에 붙습니다.

## 주의

- 요금·시간·온도는 데모 값입니다.
- 토토노이 점수는 의학 조언이 아닙니다.
- `.env*` 는 커밋하지 않습니다.
