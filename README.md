# AssetFlow — Odoo Hackathon 2026

Enterprise Asset & Resource Management. Next.js 14 App Router + Supabase (Postgres + Auth) + Tailwind.

## Setup
1. `npm install`
2. Create a Supabase project. In the SQL editor, run `supabase/schema.sql`, then (optional, time-permitting) `supabase/rls.sql`.
3. `cp .env.local.example .env.local` and fill in your Supabase URL + anon key + service role key.
4. `npm run dev`

## What's already wired
- Design tokens in `tailwind.config.ts` (colors, fonts) — matches the design system doc exactly.
- `lib/business-logic.ts` — the CRITICAL PATH functions implemented server-side: `allocateAsset` (conflict rule), `bookResource` (overlap rule), `approveMaintenance`/`resolveMaintenance` (auto status sync), `generateAssetTag`, `requestTransfer`/`approveTransfer`, `returnAsset`, `changeEmployeeRole` (admin-only, blocks self-elevation).
- `components/ConflictModal.tsx`, `components/OverlapModal.tsx`, `components/StatusChip.tsx`, `components/AssetTagChip.tsx`, `components/KpiCard.tsx` — the components the design doc says never to cut.
- Route stubs for every P0 screen in `app/*`, each with a TODO pointing at the relevant PRD section.
- `app/api/*` route handlers wired to the business-logic functions, so the CORE rules are enforced server-side from minute one.

## Rules baked in
- No self-elevation: signup always inserts `role='employee'`. Only Admin, via Employee Directory, can change `role`.
- Server-side enforcement: every status transition happens in `lib/business-logic.ts`, not in the UI — judges may hit `/api/*` directly.
- Single branch: keep everything on `main`, commit hourly under your own GitHub account.

## Cut-scope order if behind schedule
Audit Cycles → Advanced Reports (keep plain KPI cards) → Activity Logs → RLS (fall back to the checks already in `lib/business-logic.ts`) → photo upload (URL text field) → booking timeline visual.
Never cut: allocation conflict, booking overlap, ConflictModal, OverlapModal, ApprovalStepper, StatusChip.
