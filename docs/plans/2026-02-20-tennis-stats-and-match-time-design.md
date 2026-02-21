# Tennis Stats (Ace/Fault) & Match Time Tracking — Design

**Date:** 2026-02-20
**Status:** Approved

## Overview

Add ace tracking, fault/double fault logic, and match time tracking across the web app, mobile app, and Rust display app.

## Features

### 1. Ace Button

- Tapping "Ace" auto-awards the point to the serving participant
- Increments per-player ace count
- Resets any pending fault state
- Available in center strip of scoring UIs (web FullScreenScoring + mobile scoring screen)

### 2. Fault / Double Fault Button

- **Two-tap flow**: first tap marks a first fault (visual indicator, no point change), second tap triggers double fault (auto-awards point to receiver)
- Fault state (`0` or `1`) persisted in `tennisState` so it survives page refreshes
- Any non-fault action (ace, normal point) resets fault state to 0
- Per-player double fault count tracked

### 3. Match Time Tracking

- `matchStartedTimestamp` set on the **first point scored** (not on match start)
- Timer is continuous — no pausing between sets
- Elapsed time computed client-side: `now - matchStartedTimestamp` (live) or `completedAt - matchStartedTimestamp` (finished)
- No periodic DB writes needed

### 4. Display App Timer Component

- New `TennisMatchTime` component type in the Rust display app
- Follows existing component pattern (draggable from component library, styleable)
- Reads `match_started_timestamp` from `TennisLiveData`, computes elapsed time

### 5. Bracket Time Display

- Live matches: small muted ticking timer below the score on bracket match cards
- Completed matches: static final duration
- Pending/scheduled: no time shown

## Data Model Changes

### tennisState additions (schema.ts + tennisScoring.ts)

```typescript
aces: v.array(v.number()),              // [p1Count, p2Count]
doubleFaults: v.array(v.number()),      // [p1Count, p2Count]
faultState: v.number(),                 // 0 = no fault, 1 = first fault pending
matchStartedTimestamp: v.optional(v.number()),  // Epoch ms, set on first point
```

### tennisStateSnapshot additions

Must include `aces`, `doubleFaults`, and `faultState` so undo restores them.

### TennisLiveData additions (Rust display app)

```rust
match_started_timestamp: Option<u64>,
aces: [u32; 2],
double_faults: [u32; 2],
match_completed_at: Option<u64>,
```

### Public API changes

`publicApi:watchCourt` response includes `matchStartedTimestamp`, `aces`, `doubleFaults` from tennisState.

## Convex Mutations

### New: `scoreTennisAce(matchId, tempScorerToken?)`

1. Validate match is live, tennisState initialized
2. Snapshot state to history (including new fields)
3. Increment `aces[serverIndex]`
4. Reset `faultState` to 0
5. Award point to `servingParticipant` (reuse existing point-scoring logic)
6. Set `matchStartedTimestamp` if not yet set
7. Log action as `"ace"`

### New: `scoreTennisFault(matchId, tempScorerToken?)`

1. Validate match is live
2. If `faultState === 0`:
   - Snapshot to history
   - Set `faultState = 1`
   - Log as `"fault"`
   - No point awarded
3. If `faultState === 1` (double fault):
   - Snapshot to history
   - Increment `doubleFaults[serverIndex]`
   - Reset `faultState = 0`
   - Award point to receiver
   - Log as `"double_fault"`

### Modified: `scoreTennisPoint`

- Reset `faultState` to 0 on any normal point
- Set `matchStartedTimestamp` if not yet set
- Snapshot now includes new stat fields

### Modified: `undoTennisPoint`

- No logic changes needed — snapshots now include aces/doubleFaults/faultState, undo restores them automatically

### Modified: `initTennisMatch`

- Initialize `aces: [0, 0]`, `doubleFaults: [0, 0]`, `faultState: 0`, `matchStartedTimestamp: undefined`

## Edge Cases

| Edge Case                           | Solution                                                                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Scorer refreshes mid-fault          | `faultState` persisted in DB, UI reads it on load                                                                          |
| Undo after ace                      | Snapshot restores ace count and faultState                                                                                 |
| Undo after double fault             | Snapshot restores doubleFault count and faultState=1                                                                       |
| Undo after single fault             | Snapshot restores faultState=0                                                                                             |
| Ace on match point                  | Same confirmation dialog as normal point                                                                                   |
| Double fault on match point         | Same confirmation dialog                                                                                                   |
| Fault then ace                      | Ace resets faultState to 0 (valid: first serve fault, second serve ace)                                                    |
| Fault then normal point             | Normal point resets faultState to 0                                                                                        |
| Timer on undo of first point        | `matchStartedTimestamp` is set-once, not in snapshot — timer keeps running                                                 |
| Multiple clients viewing timer      | All compute from same `matchStartedTimestamp`                                                                              |
| Match completed then undo           | Timer resumes from `matchStartedTimestamp` (completedAt cleared by existing undo)                                          |
| Existing matches without new fields | `matchStartedTimestamp` is optional; aces/doubleFaults/faultState initialized on first interaction or defaulted to 0 in UI |

## UI Changes

### Web — FullScreenScoring.tsx (center strip)

- "ACE" button (brand-colored, prominent)
- "FAULT" button — shows "FAULT" normally, changes to "2ND SERVE" or similar after first fault
- Fault state indicator (visual badge when faultState=1)
- Match elapsed time in scoreboard overlay

### Web — TennisScoreboard.tsx (match detail)

- Ace/fault counts shown in match stats
- Match elapsed time displayed

### Web — Bracket match cards

- Live matches: small muted ticking timer below score
- Completed matches: static final duration

### Mobile — scoring/[id].tsx (center scoreboard area)

- Same ace/fault buttons adapted for mobile touch
- Fault state indicator
- Match time in scoreboard component

### Display App (Rust)

- New `TennisMatchTime` component type in component library
- Properties: font size, color, alignment (text component pattern)
- Renders `H:MM:SS` or `MM:SS`
