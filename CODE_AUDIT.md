# Loan Tracker — Code Audit

_Part-by-part review of the application: architecture, features, security, design, and code quality._

**Audit date:** 2026-06-15
**Stack:** Next.js 16 (App Router) · React 19 · Auth.js v5 · Prisma 7 / PostgreSQL · Tailwind 4 · shadcn/ui · Recharts · Zod · Vitest

## Health snapshot

| Check | Result |
|-------|--------|
| `tsc --noEmit` | ✅ Clean |
| `eslint .` | ✅ Clean |
| `vitest run` | ✅ 19 passing (2 files) |
| Architecture | ✅ Strong (service layer, typed errors, thin routes) |

**Severity legend:** 🔴 must fix · 🟠 should fix · 🟡 nice to have · ✅ good

> **State:** No 🔴/🟠 items remain. All correctness, privacy, scale, and metrics-integrity issues raised in prior passes are resolved. One minor maintainability note remains (a hand-rolled SQL where-builder), plus standing low-priority items.

---

## Top open items

| # | Issue | Where | Severity |
|---|-------|-------|----------|
| 1 | `buildLoanWhereSql` is a **partial mirror** of the Prisma `where` — a new loan filter would be silently dropped on the outstanding sort | `loan-where-sql.ts` | 🟡 |
| 2 | No route-integration / E2E tests (unit coverage is good) | `lib/__tests__` | 🟡 |
| 3 | Auth.js-internals coupling (`getToken({ salt })`) remains, now isolated to one module | `session-jwt.ts` | 🟡 |

---

## 1. Authentication & Sessions — ✅ Strong
DB-revalidated `getSession()`; global revocation via `sessionVersion`; `__Host-` cookies; fixed-window JWT; typed errors + `getAuthSecret()`; bcrypt 12; admin-approval model with frozen handling. The manual JWT decode is now centralized in `lib/session-jwt.ts` (`decodeSessionJwt`) — a single, documented place to update on a next-auth upgrade.
- 🟡 **Auth.js-internals coupling** (`getToken({ salt })`) still exists but is now isolated to one module with a clear upgrade note — the recommended containment. Edge (`auth()`) and server (`decodeSessionJwt`) paths must stay aligned on cookie name + secret.
- 🟡 **Per-request DB read** in `getSession()` — intentional for live revocation; revisit only if traffic grows.

---

## 2. Authorization & Admin — ✅ Good
`withUser`/`withManager`/`withAdmin` wrappers; admin pages guarded by `requireAdminOrRedirect()`, loan pages by `requireManagerOrRedirect()` (redirects, not throws); self/other-admin protection in `users-service.ts`.
- **Role separation enforced end-to-end:** admins have a fully separate area (`/admin/dashboard`, `/admin/users`, `/admin/activity`, `/admin/settings`) and no portfolio. Loan/payment/dashboard-stats APIs use `withManager` (403 for admins — not just hidden in the UI); activity tabs are role-scoped (managers: loans/payments; admins: users) via `managerOnly`/`adminOnly` flags; Settings is split (`/settings` manager-only with deleted-loans, `/admin/settings` admin-only). The activity feed decouples `admin` (role/tabs) from `orgWide` (org-wide audit endpoint + actor column).
- 🟡 Proxy `/admin` gate uses stale JWT `isAdmin`; authoritative check is server-side. Defense-in-depth, fine.

---

## 3. Loans (CRUD, status, recovered view) — ✅ Strong
Service layer with `$transaction`; derived "recovered" via field references; single-responsibility filter helpers; correct `LIKE` escaping; loan list error handling via `request()`; shared `DEFAULT_LOAN_PAGE_SIZE` (API/UI aligned). Outstanding sort now filters + sorts + paginates entirely in SQL via `buildLoanWhereSql` + `ORDER BY GREATEST(0, "totalAmount" - "amountPaid")` — no in-memory sort, no all-IDs `IN (...)` list.
- 🟡 **`buildLoanWhereSql` is a partial mirror** of the Prisma `where` (handles `userId`, `id.in`, `loanDate`, `amountPaid` field-refs, forces `deletedAt IS NULL`). It's **safe from injection** (parameterized via `Prisma.sql`) and unit-tested, but any *new* filter added to the loans API `where` would be silently ignored on the outstanding sort only. Mitigation: make it throw on unrecognized `where` keys (fail loud), or keep a parity test as new filters are added.

---

## 4. Payments — ✅ Strong
Transactional mutations; `amountPaid` derived via `syncAmountPaid`; initial-balance seeding; overpayment validation; ownership re-checked in-transaction. Detail page passes `initialPayments` so `LoanPaymentHistory` skips the redundant mount fetch.

---

## 5. Soft delete, retention & purge — ✅ Strong
30-day window for deleted loans (`listDeletedLoans`/`restoreLoan`/`purgeExpiredDeletedLoans` share `retentionCutoff()`); recovered-loans purge (`recoveredAt`, `computeRecoveredAt`, `purgeExpiredRecoveredLoans`, scoped `deletedAt: null`) **snapshots lifetime totals into `user_stats` + `purged_client_stats` inside the same transaction before deleting**; consolidated `CRON_SECRET`-guarded cron uses `Promise.allSettled` with per-outcome logging; deprecated old route is a clean shim.

---

## 6. Activity log / audit — ✅ Comprehensive
Typed action catalog + tab filtering; user-scoped vs admin-wide listing; `logActivitySafe` never throws; good indexes; retention (365d delete) + PII handling (90d anonymization) via **set-based SQL `UPDATE … regexp_replace`**; `metadata` is `Json`; `formatLoanActivitySummary` reads `clientName`/`totalAmount` from `metadata` only (regex fallback removed).

---

## 7. API layer & architecture — ✅ Strong
Thin routes → services; `parseOrThrow` + `ValidationError` → 400; shared serializers; read routes return 500 (not 401) on real failures; pagination parsing centralized in `lib/pagination.ts`; cron purge errors isolated via `Promise.allSettled`.
- **Unified response envelope.** Every endpoint returns `{ success: true, data }` (via `apiOk`, `lib/api-response.ts`) or `{ success: false, error: { message, code, fields? } }` (via `apiError`/`toErrorResponse`, `lib/error-response.ts`). The client `request()` helper unwraps `data` on success and throws `ApiRequestError` (message + field errors) on failure, so call sites and form field-error handling are unchanged.
- **No dead endpoints.** Removed unused `GET /api/auth/me` and `GET /api/dashboard/stats` (no consumers; `getDashboardStats` itself remains, used by the admin user detail route) and the deprecated `cron/purge-deleted-loans` alias; also pruned empty scaffolding dirs (`api/auth/{login,activate,…}`, `(app)/{activity,completed-loans}`, etc.).

---

## 8. Dashboard — ✅ Strong
Role-aware (`getAdminDashboardStats` + `isAdminView`/`activeUserCount`); SQL aggregation via parameterized `$queryRaw`; working `DashboardRefreshButton`.
- **Recovery-metrics integrity:** KPIs merge live rows with snapshot totals (`user_stats` + `purged_client_stats`). Recovery rate stays accurate (purged fully-paid loans contribute equally to numerator and denominator — covered by a unit test); `totalClients` unions live + purged client names via a `Set` (admin keys by `userId|clientName`) — no double-count.
- **Admin client counting:** admin view uses `COUNT(DISTINCT ("userId","clientName"))` and prefixes top-clients with the owner's name.

---

## 9. Settings — ✅ Good
Profile + password change + activity feed + deleted-loans section, all behind a null-session redirect. Forms use shared client modules (no inline `fetch`).

---

## 10. Data model / Prisma — ✅ Clean
- ✅ `user_stats` snapshot is now **normalized**: scalar lifetime counters on `UserStats`, per-client totals in a dedicated `PurgedClientStat` table (`@@id([userId, clientName])`, indexed) — no more unbounded JSON columns.
- 🟢 Money stored as `Int` (MAD, no cents) — deliberate; document the assumption for future currencies.

---

## 11. Frontend, forms & UX — ✅ Good
Lint clean; manual forms (no `react-hook-form` dependency); loan DTOs centralized; all data flows through shared client modules + `request()`; theme/mounted hooks use `useSyncExternalStore` — no `setState`-in-effect.

---

## 12. Design, styling, theme, accessibility — ✅ Good
Tailwind 4 + shadcn/ui; no-flash theme init; responsive mobile/desktop layouts; loading skeletons; `aria-label`s on icon buttons.

---

## 13. Testing — ✅ Good (unit), ⚠️ no integration/E2E
Vitest configured (`npm test` → `vitest run`); **19 passing across 2 files**. Coverage includes API error mapping (`toErrorResponse`/`apiOk` envelope), the `buildLoanWhereSql` builder, role-scoped activity tabs, and the purge→snapshot→dashboard recovery-rate invariant — the highest-value logic paths.
- 🟡 Still unit-only: no route-integration tests (hitting handlers with a DB) or E2E. Add a thin integration layer for auth + loan/payment flows when practical.

---

## 14. API documentation (OpenAPI / Swagger) — ✅ Good, secured
Full OpenAPI 3.0 spec (`lib/openapi/`) served at `/api/openapi`, rendered by self-hosted Swagger UI at `/docs`. Covers every backend route+method; documents the unified envelope and `sessionCookie`/`cronBearer` security schemes.
- **Self-hosted UI:** assets are copied from `swagger-ui-dist` into `public/swagger/` on install/build (`scripts/copy-swagger-assets.mjs`) — no external CDN / supply-chain risk, no SRI needed.
- **Access-gated:** `/api/openapi` returns 404 for non-admins; `/docs` is admin-only (`requireAdminOrRedirect` + proxy matcher + edge `authorized` check). The spec is no longer publicly readable.
- **Security headers:** `next.config.ts` sets CSP (`default-src 'self'`, no external origins), `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.
- **Dark mode:** the Swagger container forces a light color-scheme + solid background so docs stay readable while the app is in dark mode.
- 🟡 Cookie `apiKey` schemes can't encode roles, so manager-vs-admin requirements live in each operation's description.

---

## Prioritized action plan

**P2 — polish**
1. Make `buildLoanWhereSql` throw on unrecognized `where` keys (or keep a parity test) so a future filter can't be silently dropped on the outstanding sort (item 1).

**Backlog**
2. Add route-integration / E2E coverage for auth + loan/payment flows (item 2).
3. Implement password reset or keep it out of scope (token columns already removed).

---

## What's solid (keep)
- Session security model (DB revalidation, `sessionVersion`, `__Host-`, fixed-window JWT, JWT decode centralized in `session-jwt.ts`).
- Service layer + typed errors + thin routes + transactional payment integrity.
- Soft-delete/recovered retention + purge + **normalized lifetime-stats snapshot** so dashboard KPIs survive purges.
- SQL-based dashboard aggregation and outstanding sort, activity-audit with PII retention, responsive UI, theming via `useSyncExternalStore`, shared serializers/DTOs, and a focused unit-test suite.
