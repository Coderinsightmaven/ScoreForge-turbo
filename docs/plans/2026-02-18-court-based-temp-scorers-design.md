# Court-Based Temporary Scorers with QR Login

**Date:** 2026-02-18
**Status:** Approved

## Problem

Temporary scorers are currently created independently of courts. Tournament owners must manually create each scorer, assign usernames, and communicate PINs. There's no direct link between a scorer and the court they're responsible for.

## Solution

Replace standalone temporary scorers with **court-bound scorers** that are auto-generated when courts are defined. Each court gets exactly one temp scorer with a unique PIN. A QR code per court enables fast mobile login via deep link — scan + PIN = authenticated and scoped to that court's matches only.

## Decisions

- **Approach:** Extend existing `temporaryScorers` table (add `assignedCourt` field) rather than creating a new table. Reuses all existing auth infra (bcrypt PINs, sessions, rate limiting, cleanup crons).
- **Auto-generation:** When courts are defined/updated, auto-generate one temp scorer per court. No manual creation flow.
- **QR target:** Expo deep link (`scoreforge://scorer?code={code}&court={slug}`). Requires mobile app installed.
- **Court scoping:** Scorers only see matches on their assigned court. No cross-court visibility.
- **Legacy removal:** Remove the old "Create Temporary Scorer" modal and standalone temp scorer flow entirely.

## Data Model Changes

### `temporaryScorers` table — modified

```typescript
temporaryScorers: defineTable({
  tournamentId: v.id("tournaments"),
  username: v.string(), // Slug of court name (e.g., "court-1", "center-court")
  pinHash: v.string(), // bcrypt hash of 6-char alphanumeric PIN
  displayName: v.string(), // Court display name (e.g., "Court 1")
  assignedCourt: v.string(), // NEW: exact court name from tournaments.courts[]
  createdBy: v.id("users"),
  createdAt: v.number(),
  isActive: v.boolean(),
})
  .index("by_tournament", ["tournamentId"])
  .index("by_tournament_and_username", ["tournamentId", "username"]);
```

The `assignedCourt` field stores the exact court string from `tournaments.courts[]`. This is the binding between scorer and court.

### PIN Format

6-character alphanumeric using ambiguity-free charset: `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (excludes 0/O/1/I/L). Generated with `crypto.getRandomValues()`. This matches the clubscore implementation.

### No new tables

Existing `temporaryScorerSessions`, `loginRateLimits` tables remain unchanged.

## Auto-Generation Flow

### When courts change (create/update tournament)

1. Fetch all existing temp scorers for the tournament
2. For each court in `tournaments.courts[]`:
   - If a scorer with `assignedCourt === court` already exists → skip
   - Otherwise → create new temp scorer:
     - `username`: slugified court name (lowercase, spaces → hyphens, special chars removed)
     - `displayName`: court name as-is
     - `assignedCourt`: court name as-is
     - `pinHash`: bcrypt hash of new 6-char PIN
     - `isActive`: true
3. For each existing scorer whose `assignedCourt` is no longer in `courts[]`:
   - Set `isActive: false`
   - Delete all their sessions (immediate invalidation)

### New Convex function: `generateCourtScorers`

Internal mutation called when courts are updated. Returns the generated PINs (plaintext) so the UI can display them once. PINs are only available at generation time — after that, only the hash is stored.

### New Convex function: `regenerateCourtPin`

Mutation for tournament owner to reset a specific court's PIN. Invalidates all existing sessions for that court's scorer. Returns the new plaintext PIN.

## QR Code Flow

### Generation (Web — ScorersTab)

- Library: `qrcode.react` (SVG, 200x200, medium error correction)
- QR content: `scoreforge://scorer?code={scorerCode}&court={courtSlug}`
  - `scorerCode`: tournament's 6-char scorer code (already exists on tournaments)
  - `courtSlug`: URL-encoded court slug matching the temp scorer's username
- UI: "Show QR" button per court row → opens dialog with QR code, PIN in large text, copy button

### Login (Mobile — Deep Link)

1. Scorer scans QR code → mobile app opens at scorer login
2. Deep link params pre-fill: tournament code + court (username)
3. Scorer enters 6-char PIN
4. `temporaryScorers.signIn` authenticates (existing flow, code + username + PIN)
5. Session created, stored in `expo-secure-store`
6. App navigates to `/(scorer)` — shows only matches for their assigned court

### Fallback: Manual Entry

If QR scanning isn't available, scorer can still manually enter:

1. Tournament code (6 chars)
2. Court name / username
3. PIN (6 chars)

The existing sign-in screen fields remain, just the PIN format changes from 4-digit numeric to 6-char alphanumeric.

## ScorersTab UI Redesign

### Before (current)

```
ScorersTab
├─ ScorerCodeSection (tournament code)
├─ TemporaryScorersSection
│  ├─ List of manually created temp scorers
│  └─ "+ Create Temporary Scorer" button → modal
├─ AccountScorersSection
│  └─ List of email-assigned scorers
```

### After (new)

```
ScorersTab
├─ ScorerCodeSection (tournament code — unchanged)
├─ CourtScorersSection
│  ├─ Empty state: "Add courts in tournament settings to generate court scorers"
│  └─ Court scorer table:
│     - Court name
│     - Status badge (Active / Inactive)
│     - PIN (copyable, shown to owner)
│     - Actions: [Show QR] [Reset PIN] [Deactivate/Reactivate]
├─ CourtPinQRDialog
│  ├─ QR code (SVG)
│  ├─ PIN in large monospace text
│  ├─ Copy PIN button
│  └─ Court name + tournament code
├─ AccountScorersSection (unchanged)
```

### Removed

- `CreateTempScorerModal` — no longer needed
- Manual temp scorer creation button
- Username/display name inputs for temp scorers

## Mobile Changes

### Sign-in screen (`apps/mobile/app/(auth)/sign-in.tsx`)

- PIN input: change from numeric 4-6 digits to alphanumeric 6 chars
- Remove `secureTextEntry` on PIN (alphanumeric PINs are harder to enter blind)
- Add deep link handling: if app opened via `scoreforge://scorer?code=X&court=Y`, pre-fill fields
- Court/username field: could be pre-filled from QR or entered manually

### Scorer home screen (`apps/mobile/app/(scorer)/index.tsx`)

- Filter matches by `scorer.assignedCourt`: only show matches where `match.court === assignedCourt`
- Header: show court name prominently (e.g., "Court 1 — Tournament Name")

### Session data

Add `assignedCourt` to the session object returned by `signIn` and stored in `TempScorerContext`:

```typescript
{
  token: string;
  scorerId: string;
  tournamentId: string;
  displayName: string; // Court display name
  assignedCourt: string; // Court name for match filtering
  tournamentName: string;
  sport: string;
  expiresAt: number;
}
```

## Convex Function Changes

### Modified functions

| Function                                            | Change                                             |
| --------------------------------------------------- | -------------------------------------------------- |
| `temporaryScorers.signIn`                           | Return `assignedCourt` in session response         |
| `temporaryScorers.listTemporaryScorers`             | Return `assignedCourt` field                       |
| `temporaryScorers.createTemporaryScorer`            | Replace with `generateCourtScorers` (internal)     |
| `temporaryScorers.listMatchesForTemporaryScorer`    | Add filter: `match.court === scorer.assignedCourt` |
| `tournaments.createTournament` / `updateTournament` | Call `generateCourtScorers` when courts change     |

### New functions

| Function                                   | Type             | Purpose                                                     |
| ------------------------------------------ | ---------------- | ----------------------------------------------------------- |
| `temporaryScorers.generateCourtScorers`    | internalMutation | Auto-generate scorers for courts, deactivate removed courts |
| `temporaryScorers.regenerateCourtPin`      | mutation         | Reset a court's PIN, invalidate sessions                    |
| `temporaryScorers.getCourtScorersWithPins` | query            | Return court scorers for the ScorersTab (owner only)        |

### Removed functions

| Function                                 | Reason                                     |
| ---------------------------------------- | ------------------------------------------ |
| `temporaryScorers.createTemporaryScorer` | Replaced by auto-generation                |
| `temporaryScorers.deleteTemporaryScorer` | Court scorers are deactivated, not deleted |

## Access Control

- **Tournament owner** (`createdBy`): full control — view PINs, reset PINs, deactivate/reactivate, view QR codes
- **Court scorer**: can only see and score matches where `match.court === assignedCourt`
- **Rate limiting**: existing rate limiting on `signIn` applies unchanged (5 attempts / 15 min, 30 min lockout)
- **Session expiry**: unchanged (24 hours)
- **PIN reset**: invalidates all sessions for that court scorer immediately

## Migration

Existing `temporaryScorers` records (created before this change) lack `assignedCourt`. Options:

1. **Backfill**: Set `assignedCourt` to empty string and `isActive: false` for all existing temp scorers without the field
2. **Schema**: Make `assignedCourt` required — existing records will fail validation on next deploy. Preferred approach: add the field as required and backfill in a migration before deploy.

Given this is a replacement of the feature (not an extension), a clean migration that deactivates all existing standalone temp scorers is appropriate.

## Dependencies

- `qrcode.react` — new dependency for `apps/web` (QR code generation)
- No new mobile dependencies (deep links already supported via `scoreforge://` scheme)

## Out of Scope

- Web-based scorer login page (QR targets mobile app only)
- Multiple scorers per court
- Court scorer scheduling/rotation
- QR code printing/export to PDF
