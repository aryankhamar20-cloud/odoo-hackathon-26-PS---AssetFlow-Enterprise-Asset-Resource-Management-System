# AssetFlow — Structure & Feature Plan (Frontend / Backend)

## Why there's one folder, not two

Next.js App Router — what this app is built on — unifies frontend and backend in one project by design: `app/api/*` route handlers and Server Actions run only on the server, `app/*` pages render as React Server/Client Components, and both talk to Supabase through server-only clients. Splitting this into two physical folders (a separate frontend app + separate backend API server) would mean rewriting every one of the 15 endpoints, every page's data-fetching, and the entire auth flow as two independently-deployed apps — a full rebuild, not a reorganization, and too risky to do on submission day with teammates still pushing.

Instead, the system below **is already cleanly split by responsibility** — this doc (and the matching section added to `README.md`) makes that split explicit so it reads clearly to judges browsing the repo.

---

## FRONTEND — UI layer (`app/*` pages, `components/*`)

**Layout & shell:** dark sidebar (AssetFlow wordmark, role-gated nav: Dashboard, Assets, Allocations & Transfers, Resource Booking, Maintenance, Organization Setup [admin-only]), signed-in employee name + role badge + sign-out in the header. Design tokens: Space Grotesk (display), IBM Plex Sans (body), IBM Plex Mono (tags/code), ink/paper/teal palette with 7 status colors.

**Auth pages:** `/login`, `/signup` (signup always creates role `employee` — no role selector, by design). `middleware.ts` redirects unauthenticated visitors to `/login` and signed-in users away from `/login`/`/signup`.

**Dashboard** (`app/dashboard`): 6 KPI cards (Total Assets, Available, Allocated, Under Maintenance, Overdue Returns, Pending Approvals), overdue-return warning banner, role-gated quick actions (Register Asset, Promote Employee, Book Resource, Raise Maintenance, Review Pending Transfers).

**Assets** (`app/assets`, `app/assets/[id]`, `app/assets/new`): searchable/filterable directory (name/tag search, status filter, category filter), asset detail page (serial/condition/location/holder, allocation history, maintenance history), Allocate form (Employee OR Department target, `ConflictModal` on double-allocation), Asset Status Control (Lost/Retired/Disposed — Asset Manager/Admin only), Registration form (Asset Manager/Admin only, auto-generated tag).

**Allocations & Transfers** (`app/allocations`): pending transfer requests with Approve/Reject (Dept Head/Asset Manager/Admin), active allocations list with department-held display, Return flow via modal (condition dropdown + check-in note — no raw browser prompts anywhere in the app).

**Resource Booking** (`app/bookings`): booking form with server-side overlap check (`OverlapModal` on conflict), Cancel and Reschedule (owner-or-manager only).

**Maintenance** (`app/maintenance`): full pipeline UI — Pending → Approved → Technician Assigned → In Progress → Resolved, each stage's actions gated to Asset Manager/Admin, inline technician-assignment input (no browser prompt).

**Organization Setup** (`app/org-setup/*`, admin-only): Departments (name/head/parent/status, Activate/Deactivate toggle), Categories (name + custom fields, duplicate-name guard), Employee Directory (role change + department assignment, self-elevation blocked).

**Status:** all of the above is built, working, and was independently re-audited this session via a full file-by-file re-read (all 14 pages, all 18 components) — no defects found.

---

## BACKEND — server layer (`app/api/*`, `lib/*`, `supabase/*`)

**Auth & session** (`lib/auth.ts`): `getCurrentEmployee()` resolves the logged-in employee from the Supabase session (never trusts client-submitted IDs); `requireRole()` gates pages and Server Actions.

**Core business rules** (`lib/business-logic.ts`) — every rule enforced server-side, not in the UI:
- `generateAssetTag` — sequential `AF-####` via RPC + count fallback
- `allocateAsset` — Employee OR Department target, conflict check against current holder
- `returnAsset`, `requestTransfer`, `approveTransfer`, `rejectTransfer`
- `bookResource`, `cancelBooking`, `rescheduleBooking`, `computeBookingStatus` — overlap check on every mutation
- `approveMaintenance`, `rejectMaintenance`, `assignTechnician`, `startMaintenanceProgress`, `resolveMaintenance`
- `setAssetStatus` — Lost/Retired/Disposed, clears holder fields
- `changeEmployeeRole` — admin-only, blocks self-elevation

**API routes** (`app/api/*`, 15 total, all session-authenticated and role-checked): `allocate`, `return`, `book`, `book/cancel`, `book/reschedule`, `transfer/request`, `transfer/approve`, `transfer/reject`, `maintenance/raise`, `maintenance/approve`, `maintenance/reject`, `maintenance/assign-technician`, `maintenance/start-progress`, `maintenance/resolve`, `assets/status`.

**Data layer** (`supabase/schema.sql`, `rls.sql`): Postgres schema for departments, employees, categories, assets, allocations, transfer_requests, bookings, maintenance_requests; `overdue_allocations` view backing the dashboard KPI; RLS policies written but not applied (app-level checks in `lib/business-logic.ts` are the documented working fallback).

**Status:** all 15 routes + business-logic.ts + auth.ts + middleware.ts re-read fresh this session — auth checks, role gates, and conflict/overlap logic all verified consistent, no defects found.

---

## Full task history (39 tracked)

Scaffold & planning (#1–7) → Core CRUD screens (#8–14) → Route protection & API hardening (#15–18) → Department allocation, reschedule, quick actions (#19–21) → Backend deep audit fixes: unauthenticated routes, missing Admin gates, self-elevation bypass, dead department field, display bug (#22–26) → Frontend deep audit fixes: asset status lifecycle, transfer reject, department status toggle, prompt→modal (#27–30) → Login/status diagnosis, full endpoint+page audit, git status check, status report (#31–34) → Single-file HTML reference doc mining teammate's stray GitHub push for Reports/Audit Cycles/Activity Log UI ideas (#35) → this plan + exhaustive file-by-file re-verification of all 51 source files + README architecture map (#36–39).

---

## Still open (not blockers — see cut-scope order)

1. **Audit Cycles** — teammate's stray commit has a working reference implementation (scope by dept/location, checklist, discrepancy report, auto-Lost on close). Not in the live app.
2. **Activity Log** — same source, one `logAction()` call per mutation. Not in the live app.
3. **Advanced Reports** — utilization/department/maintenance-frequency charts, booking heatmap. Not in the live app; plain KPI cards stand in.
4. RLS policies (optional, app-level checks already cover this).
5. Asset photo upload, booking timeline visual.

None of these block a working demo. All three UI-idea items are viewable now in `AssetFlow_Reference.html`.

## Also outstanding
- Dhruv's stray `dist/`/`src/` Vite files are still in the GitHub repo — recommend deleting before judging.
- Tasks #27–30's code (asset status lifecycle, transfer reject, department toggle, modal fixes) is local-only, not yet pushed.
