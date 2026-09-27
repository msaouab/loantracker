# Unique Client Names + Reopening Recovered Clients — Analysis & Plan

## Goal

Make a **client name unique per user account** (no duplicates). When a user enters a
client name for a new loan:

- If the name is **new** → create the loan as today.
- If the client **already has an active (open) loan** → reject as a duplicate.
- If the client exists **only in the recovered list** (they fully repaid) → **bring them
  back to the loans list and keep their old data** (payment history), instead of creating a
  separate duplicate client.

---

## 1. Current State (verified against the code)

The app is **loan-centric**, not client-centric:

- `clientName` is a **free-text string on each `Loan`** — there is no `Client` entity and
  nothing enforces uniqueness.
- **Recovery is per-loan**, derived (not stored as a list):
  - `OPEN_LOAN_SQL` = `"amountPaid" < "totalAmount"`
  - `RECOVERED_LOAN_SQL` = `"amountPaid" >= "totalAmount"`
  - A "recovered" loan is still a row in `loans` with `deletedAt: null`; it's just filtered
    by status. The "recovered list" is a view over the same table.
- `recoveredAt` timestamps when a loan became fully paid.
- `createLoan` inserts a new `Loan` row with the raw `clientName`, no uniqueness check.
- `updateLoan` allows changing `clientName` freely.

### Two facts that make this feasible

1. **Zero duplicate `(userId, clientName)` groups exist today** — a uniqueness constraint can
   be added **without a data-cleanup migration**.
2. **`PurgedClientStat` is already keyed on `@@id([userId, clientName])`** — the system already
   half-treats client name as an identity, so this change is a natural evolution.

### Key files

| Area | Path |
|------|------|
| Schema | `prisma/schema.prisma` |
| Create/update/reopen logic | `lib/loans-service.ts` |
| Open/recovered predicates | `lib/loan-status.ts` |
| Loans list + create API | `app/api/loans/route.ts` |
| Case-insensitive client search | `lib/loan-search.ts` |
| New/edit loan form | `components/forms/loan-form.tsx` |
| Recovered list page | `app/(app)/loans/recovered/page.tsx` |
| Validation messages | `lib/validations.ts`, `messages/{en,fr,ar}.json` |

---

## 2. The Core Design Decision

"Unique client name" + "recovered client returns keeping old data" can be modeled two ways:

| Option | Model | Reopen behavior | Cost |
|--------|-------|-----------------|------|
| **A — Running client account** ✅ chosen | One loan record **per client** = their ledger (`totalAmount` = total ever lent, `amountPaid` = total ever repaid) | Top up the same row: `totalAmount += newPrincipal`, clear `recoveredAt`, keep payments → back to active | **Small** — fits current schema, no new tables |
| B — Client entity | New `Client` model; clients own many loans | New loan added under the existing client | **Large** — refactor every query, dashboard, search, PDF, purge from `clientName` → `clientId` |

**Decision: Option A.** It matches "keep his old data" (same row, same history), enforces the
"one client, no duplicates" intent directly, and requires no new tables.

### Locked decisions

- **Model:** A — running client account (one loan per client).
- **Reopen behavior:** top-up the existing recovered loan and keep history; no separate
  disbursement marker row; no confirmation dialog (the top-up just happens).
- **Uniqueness matching:** case-insensitive (trim → collapse whitespace → lowercase).

---

## 3. Implementation Plan (Option A)

### 3.1 Normalization + uniqueness (foundation)

Uniqueness is meaningless without normalization, or `"Ahmed"`, `"ahmed"`, `" Ahmed "` all slip
through.

- Add a stored **`clientNameKey`** column on `Loan` = normalized name (trim, collapse internal
  whitespace, lowercase; Arabic normalization optional). Keep `clientName` for display.
- Add a **partial unique index**: `UNIQUE (userId, clientNameKey) WHERE deletedAt IS NULL`.
  - Soft-deleted clients free up the name; active/recovered ones stay unique.
  - ⚠️ Prisma `@@unique` **cannot express a partial index** → this needs a **raw-SQL migration**
    (`CREATE UNIQUE INDEX … WHERE "deletedAt" IS NULL`). The `clientNameKey` column goes in the
    schema with a backfill for existing rows.
- A shared `normalizeClientName()` helper is used by create, update, and lookups.

### 3.2 `createLoan` flow (the heart of the feature)

```
key = normalizeClientName(input.clientName)
existing = find non-deleted loan for (userId, key)

  • none                              → create new loan (current behaviour)
  • exists AND open (paid < total)    → REJECT: "You already have an active loan for this client"
                                        (localized 409 / field error)
  • exists AND recovered (paid >= total) → REOPEN (top-up):
        totalAmount += input.newPrincipal
        recoveredAt = null
        keep all existing payments
     → loan returns to the active list with full history
```

- Wrap in a transaction.
- Treat the **DB unique index as the race backstop**: catch Prisma `P2002` and return the same
  friendly duplicate error (handles two concurrent submits of the same new name).

### 3.3 `updateLoan`

- Recompute `clientNameKey` on rename **and** run the same uniqueness guard — you cannot rename
  client B onto an existing client A's name.

### 3.4 Migration & data

- Backfill `clientNameKey` for all existing rows (safe — 0 duplicates today).
- Write the migration defensively; apply via `prisma migrate deploy` (no seed), same pattern as
  the presence migration.
- Follow-up (optional): normalize the key used by `PurgedClientStat` so a purged `"Ahmed"` and a
  new `"ahmed"` reconcile.

### 3.5 UI / UX

- **New-loan form** — look up the client name as the user types and show inline states:
  - matches a **recovered** client → info hint: *"This client exists and was recovered. Saving
    will reopen their account and keep their history."*
  - matches an **active** client → inline error: *"You already have an active loan for this
    client."* (block submit).
- **Client-name autocomplete/typeahead** from existing names — the best way to *prevent*
  near-duplicates (`"Ahmed Ali"` vs `"Ahmed  Ali"`) rather than only reject them. `getLoanSearchWhere`
  (case-insensitive) can power it.

### 3.6 i18n

- New EN/FR/AR strings: duplicate-active error, recovered-reopen hint — following the existing
  `validation` / `errors` namespace pattern.

### 3.7 Dashboard / lists interaction — **no changes needed**

Reopening a recovered loan flips it recovered → open, so it leaves the recovered list, rejoins
active, and the dashboard's open-only KPIs + whole-book recovery metrics recompute from live
state. The recent open-vs-whole-book split already handles this correctly.

### 3.8 Tests

- `normalizeClientName()` (trim/case/whitespace).
- `createLoan` branches: new → create; open → reject; recovered → reopen/top-up.
- `updateLoan` rename uniqueness guard.

---

## 4. Edge Cases

1. **Purged recovered client** — recovered loans are purged after retention; only the aggregate
   `PurgedClientStat` survives (the loan row is gone). Reopening such a client **cannot** restore
   per-loan history, so it starts fresh. Plan: treat as "create new" (optionally warn).
2. **Reopen accounting** — after top-up, old payments count toward the new larger total
   (running-ledger semantics): `outstanding = newTotal − oldPaid`. This is the intended reading.
3. **Soft-deleted name reuse** — the partial index intentionally lets a deleted client's name be
   reused. Confirmed desired.
4. **Concurrency** — two simultaneous creates of the same new name are stopped by the unique
   index (`P2002` → friendly error).

---

## 5. Effort & Risk

| Piece | Effort |
|-------|--------|
| Schema + raw-SQL partial-index migration | Small |
| `normalizeClientName` + `createLoan` reopen logic | Medium |
| `updateLoan` rename guard | Small |
| Form lookup + autocomplete UX | Medium |
| i18n strings | Small |
| Tests | Small |

**Overall: medium effort, low risk** — no duplicates to clean up, dashboard already compatible,
migration is additive (nullable column + partial index).

---

## 6. What This Changes for Users

- A user can no longer create two clients with the same name (case-insensitively).
- Re-lending to a client who already paid off simply **reopens their account** with the new
  amount added on top — their full payment history is preserved, and they move from the recovered
  list back to the active loans list.
- Trying to add a loan for a client who still has an open balance is blocked as a duplicate
  (they should edit/extend the existing loan instead).
