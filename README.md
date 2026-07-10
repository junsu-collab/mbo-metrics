# MBO Metrics

뉴스디자인팀 업무평가 앱. Next.js(App Router) + TypeScript + Tailwind + Zustand로 재구축했고,
서버 없이 브라우저에서 동작하는 정적 사이트(`output: 'export'`)로 빌드됩니다. 데이터는
브라우저 localStorage에 저장되며(키: `mbo_metrics_v1_0`), 이전 버전(`reference/mbo_metrics_1_0.html`)이
저장한 데이터와 JSON 백업 파일을 그대로 읽을 수 있습니다.

## 개발

```bash
npm install
npm run dev       # http://localhost:3000
```

## 빌드 / 정적 검증

```bash
npm run build      # ./out 에 정적 산출물 생성
npx http-server out -p 4173 -s   # 산출물을 로컬에서 직접 서빙해 확인
```

## 배포

`main` 브랜치에 푸시되면 `.github/workflows/deploy-pages.yml`이 빌드 후 GitHub Pages로 배포합니다.
프로젝트 페이지(`https://<owner>.github.io/mbo-metrics/`) 기준으로 `NEXT_PUBLIC_BASE_PATH`를
자동으로 리포지토리 이름으로 설정합니다. 저장소 Settings → Pages에서 Source를
**GitHub Actions**로 설정해야 합니다.

커스텀 도메인이나 루트 경로에 배포하는 경우 `NEXT_PUBLIC_BASE_PATH`를 빈 문자열로 두거나
워크플로 env를 수정하세요.

## 구조

- `src/lib/calc.ts` — 점수 계산 순수 함수(기존 HTML 앱과 1:1 포팅, 결과 검증됨)
- `src/lib/defaults.ts` — MBO/난이도/기여도 기본 계수
- `src/store/useAppStore.ts` — Zustand + persist, 기존 localStorage 원시 포맷과 호환
- `src/components/` — 입력 패널 / 집계 패널 / 설정·시뮬레이터·모든업무 모달
- `reference/mbo_metrics_1_0.html` — 원본 단일 HTML 앱(참고용, 배포 대상 아님)
