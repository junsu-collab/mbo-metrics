# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

뉴스디자인팀 업무평가(MBO Metrics) — a client-only React app that scores team members' work against MBO categories, difficulty, and contribution coefficients. Vite + React 18 + TypeScript + Zustand(persist), no backend: everything lives in the browser's `localStorage` and is built as a static CSR site deployed to GitHub Pages.

It is a rewrite of `reference/mbo_metrics_1_0.html`, a single-file vanilla-JS app that is kept in the repo for reference (not built/deployed). The rewrite intentionally preserves that app's data model and `localStorage` format so existing user data and JSON backups load without migration UI.

## Commands

```bash
npm install
npm run dev       # vite dev server, http://localhost:5173
npm run build     # tsc -b (typecheck) && vite build -> ./dist
npm run preview   # serve ./dist locally
```

There is no lint or test script configured — `npm run build` (via `tsc -b`) is the only automated correctness check. Run it before considering a change done.

Deployment is automatic: pushing to `main` triggers `.github/workflows/deploy-pages.yml`, which runs `npm ci && npm run build` with `BASE_PATH=/mbo-metrics/` and publishes `./dist` to GitHub Pages. CI uses `npm ci`, so `package-lock.json` must stay in sync with `package.json` — installing with `pnpm` alone will not update it and will break CI.

## Architecture

### Data model and persistence

Everything nests under a single `localStorage` key `mbo_metrics_v1_0`: `{ years: Record<string, YearData>, currentYear }`. Each `YearData` holds `members`, the currently-selected member name, per-year `settings` (MBO categories, difficulty/contribution coefficient tables, default leader/member score weights), and `gutOrder`.

`src/store/useAppStore.ts` is the single Zustand store for all app data. It does **not** use Zustand's default persist envelope — `rawStorage` (in that file) reads/writes the raw `{years, currentYear}` shape directly, because that's the format the original vanilla app and existing user backups use. If you touch persistence, preserve this raw shape.

On load, `readInitial()` in the store also falls back to reading legacy keys (`mbo_metrics_v2`, `mbo_metrics_v1`) for one-time migration into the current-year bucket, then runs everything through `src/lib/migrate.ts`.

Components never read `localStorage` directly — use the store's derived selector hooks (`useCurrentYearData`, `useSettings`, `useMembers`, `useCurrentMemberName`, etc.) exported from `useAppStore.ts`.

### Field naming is load-bearing

`src/types/index.ts` types the storage structure 1:1 with the vanilla app. `Task` and `MemberData` carry legacy fields (`diffLabel`, `diffCoef`, `taskWeights`, `slotPts`, `slotScores`, etc.) purely so `migrate.ts` can absorb old JSON backups/localStorage on read — these are not used elsewhere and should not be "cleaned up." Don't rename active fields (`difficultyId`, `mboId`, `reportId`, the `*Snap` fields) without checking `migrate.ts` and `calc.ts`, which both key off exact field names.

`*Snap` fields (`mboLabelSnap`, `difficultyCoefSnap`, ...) are snapshots of a coefficient's label/value taken when a task is created, so a task's score doesn't silently change if someone later edits or deletes that coefficient tier in Settings. `src/lib/calc.ts`'s `resolve()` prefers the live `Settings` entry by id and falls back to the snapshot only if the id no longer exists.

### Scoring engine

`src/lib/calc.ts` is the pure scoring engine (`categoryResult`, `memberSlots`, `memberTotal`), ported to match the original vanilla app's formula and rounding exactly:

```
항목 점수 = (W합계 × S ÷ 기준상한) × 항목 배점
W = 난이도 계수 × 기여도 계수         (per task)
S = 팀장점수 × wLeader% + 팀원점수 × wMember%   (per MBO category, not per task)
기준상한 = 난이도 최댓값 × 기여도 최댓값 × 5
```

When a category has multiple tasks, each task's `W` is weighted by its `P` ratio (`getP()` — user-set importance split, or equal split by default) before summing. Keep this file dependency-free (no store/React imports) — it's called from both the main app and the simulator.

### Simulator vs. real settings

`SimulatorModal` lets a user try different difficulty/contribution coefficients and leader/member weight against `calc.ts` to preview rank correlation (Spearman's ρ) against a manually felt ranking, without touching real data. Only `applySim()` in the store commits simulator values back into `Settings`.

### Component layout

- `src/components/input/` — left panel: member picker (`MemberSelector`, a searchable combobox, not a plain `<select>`, sized for 20+ members), task entry with name autocomplete (`TaskAutocomplete`) that suggests coefficients from similarly-named tasks across members (`src/lib/similarity.ts`, Levenshtein-based).
- `src/components/result/` — right panel: per-category cards (`CategoryCard`, `TaskRow`, `ImportanceSlider` for the P ratio) and the choice-category point allocator (`ChoicePointsPanel`).
- `src/components/modals/` — `SettingsModal` (MBO/difficulty/contribution tables, weights), `SimulatorModal`, `AllTasksModal` (cross-member task search/bulk coefficient edit).
- `src/store/` — `useAppStore` (data), `useThemeStore` (light/dark, drives the `.dark` class on `<html>`), `useUiStore`, `useToastStore` (stacked toast queue; call the `toast(message)` helper, not the store directly).
- `src/lib/excel.ts` — SheetJS export (per-member detail, year-wide ranking); `src/lib/utils.ts` — JSON export/import helpers.

### Design tokens (`src/index.css`)

Colors are CSS custom properties (`--color-primary`, `--color-ink`, `--color-muted`, `--color-canvas`, `--color-surface`, `--color-line`, `--color-brand-violet` for member-identity accents), redefined under `.dark` for dark mode — don't hardcode hex colors in components. Rounding follows a fixed scale: `rounded-md` for static badges, `rounded-lg` for interactive controls/popovers, `rounded-2xl` for cards/modals/panels, `rounded-full` for avatars/pill badges/meters. No shadow at rest; shadows are reserved for elevated elements (popovers, modals, primary CTA). Focus rings use `focus-visible`, not `focus`.

Custom form controls (`.m-select`, `.m-checkbox`, `.m-range`, `.m-no-spinner`) replace native browser styling — reuse these classes rather than styling `<select>`/`<input type="checkbox">`/`<input type="range">` ad hoc.

**Tailwind v4 gotcha**: a custom component class defined via `@apply` in `@layer components` (the `.m-*` classes) cannot itself be referenced inside another class's `@apply` (e.g. `@apply m-focus ...` fails with "Cannot apply unknown utility class"). Inline the underlying `focus-visible:*` utilities directly instead of composing through another custom class.

### PWA

`vite-plugin-pwa` (configured in `vite.config.ts`) generates the manifest and service worker; icons are `public/icon-192.png` / `icon-512.png`. `BASE_PATH` (set by CI, default `/` locally) controls the Vite `base` and the PWA `navigateFallback` path since GitHub Pages serves this as a project site under `/mbo-metrics/`.
