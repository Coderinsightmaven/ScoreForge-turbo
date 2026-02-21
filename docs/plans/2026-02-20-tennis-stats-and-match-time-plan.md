# Tennis Stats (Ace/Fault) & Match Time Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add ace tracking, fault/double fault logic, match time tracking, and a display app timer component across the full stack.

**Architecture:** New fields (`aces`, `doubleFaults`, `faultState`, `matchStartedTimestamp`) added to `tennisState` in the Convex schema. Two new mutations (`scoreTennisAce`, `scoreTennisFault`) handle ace/fault logic. Elapsed time computed client-side from the stored timestamp. A new `TennisMatchTime` Rust component renders time in the display app.

**Tech Stack:** Convex (backend), Next.js/React (web), Expo/React Native (mobile), Rust/eframe/egui (display app)

---

## Task 1: Add new fields to tennisState schema and types

**Files:**

- Modify: `packages/convex/convex/schema.ts:69-116`
- Modify: `packages/convex/convex/lib/tennisScoring.ts:1-50`

**Step 1: Add fields to `tennisStateSnapshot` validator in schema.ts**

In `packages/convex/convex/schema.ts`, add three new fields to the `tennisStateSnapshot` object (after `isMatchComplete` on line 79):

```typescript
export const tennisStateSnapshot = v.object({
  sets: v.array(v.array(v.number())),
  currentSetGames: v.array(v.number()),
  currentGamePoints: v.array(v.number()),
  servingParticipant: v.number(),
  firstServerOfSet: v.number(),
  isTiebreak: v.boolean(),
  tiebreakPoints: v.array(v.number()),
  tiebreakTarget: v.optional(v.number()),
  tiebreakMode: v.optional(v.union(v.literal("set"), v.literal("match"))),
  isMatchComplete: v.boolean(),
  // Stat tracking
  aces: v.optional(v.array(v.number())),
  doubleFaults: v.optional(v.array(v.number())),
  faultState: v.optional(v.number()),
});
```

Note: These are `v.optional()` so existing snapshots in history still validate.

**Step 2: Add fields to `tennisState` validator in schema.ts**

In `packages/convex/convex/schema.ts`, add four new fields to the `tennisState` object (after `history` on line 115):

```typescript
export const tennisState = v.object({
  // ... existing fields ...
  history: v.optional(v.array(tennisStateSnapshot)),
  // Stat tracking
  aces: v.optional(v.array(v.number())), // [p1Count, p2Count]
  doubleFaults: v.optional(v.array(v.number())), // [p1Count, p2Count]
  faultState: v.optional(v.number()), // 0 = no fault, 1 = first fault pending
  matchStartedTimestamp: v.optional(v.number()), // Epoch ms, set on first point
});
```

**Step 3: Add new scoring log action types in schema.ts**

In `packages/convex/convex/schema.ts`, extend the `scoringLogAction` union (line 126-131):

```typescript
export const scoringLogAction = v.union(
  v.literal("init_match"),
  v.literal("score_point"),
  v.literal("undo"),
  v.literal("set_server"),
  v.literal("ace"),
  v.literal("fault"),
  v.literal("double_fault")
);
```

**Step 4: Update `TennisStateSnapshot` type in tennisScoring.ts**

In `packages/convex/convex/lib/tennisScoring.ts`, add fields to the `TennisStateSnapshot` type (lines 1-12):

```typescript
export type TennisStateSnapshot = {
  sets: number[][];
  currentSetGames: number[];
  currentGamePoints: number[];
  servingParticipant: number;
  firstServerOfSet: number;
  isTiebreak: boolean;
  tiebreakPoints: number[];
  tiebreakTarget?: number;
  tiebreakMode?: "set" | "match";
  isMatchComplete: boolean;
  // Stat tracking
  aces?: number[];
  doubleFaults?: number[];
  faultState?: number;
};
```

**Step 5: Update `TennisState` type in tennisScoring.ts**

In `packages/convex/convex/lib/tennisScoring.ts`, add fields to the `TennisState` type (lines 14-32):

```typescript
export type TennisState = {
  sets: number[][];
  currentSetGames: number[];
  currentGamePoints: number[];
  servingParticipant: number;
  firstServerOfSet: number;
  isAdScoring: boolean;
  setsToWin: number;
  setTiebreakTarget?: number;
  finalSetTiebreakTarget?: number;
  useMatchTiebreak?: boolean;
  matchTiebreakTarget?: number;
  isTiebreak: boolean;
  tiebreakPoints: number[];
  tiebreakTarget?: number;
  tiebreakMode?: "set" | "match";
  isMatchComplete: boolean;
  history?: TennisStateSnapshot[];
  // Stat tracking
  aces?: number[];
  doubleFaults?: number[];
  faultState?: number;
  matchStartedTimestamp?: number;
};
```

**Step 6: Update `createSnapshot` function in tennisScoring.ts**

In `packages/convex/convex/lib/tennisScoring.ts`, update `createSnapshot` (lines 37-50) to include new fields:

```typescript
export function createSnapshot(state: TennisState): TennisStateSnapshot {
  return {
    sets: state.sets.map((s) => [...s]),
    currentSetGames: [...state.currentSetGames],
    currentGamePoints: [...state.currentGamePoints],
    servingParticipant: state.servingParticipant,
    firstServerOfSet: state.firstServerOfSet,
    isTiebreak: state.isTiebreak,
    tiebreakPoints: [...state.tiebreakPoints],
    tiebreakTarget: state.tiebreakTarget,
    tiebreakMode: state.tiebreakMode,
    isMatchComplete: state.isMatchComplete,
    aces: state.aces ? [...state.aces] : undefined,
    doubleFaults: state.doubleFaults ? [...state.doubleFaults] : undefined,
    faultState: state.faultState,
  };
}
```

**Step 7: Run type checking**

Run: `cd packages/convex && npx tsc --noEmit`
Expected: No new errors (existing errors may be present)

**Step 8: Commit**

```bash
git add packages/convex/convex/schema.ts packages/convex/convex/lib/tennisScoring.ts
git commit -m "feat: add aces, doubleFaults, faultState, matchStartedTimestamp to tennisState schema"
```

---

## Task 2: Add new Convex mutations and modify existing ones

**Files:**

- Modify: `packages/convex/convex/tennis.ts`

**Step 1: Update `initTennisMatch` to initialize new fields**

In `packages/convex/convex/tennis.ts`, update the tennisState initialization in `initTennisMatch` handler (around line 398-415). Add the new fields after `isMatchComplete: false`:

```typescript
const tennisState: TennisState = {
  // ... existing fields ...
  isMatchComplete: false,
  // Stat tracking
  aces: [0, 0],
  doubleFaults: [0, 0],
  faultState: 0,
};
```

**Step 2: Update `scoreTennisPoint` to reset faultState and set matchStartedTimestamp**

In `packages/convex/convex/tennis.ts`, in the `scoreTennisPoint` handler, after the line `state.history = addToHistory(state);` (line 558), add:

```typescript
// Reset fault state on normal point
state.faultState = 0;

// Set match start timestamp on first point
if (!state.matchStartedTimestamp) {
  state.matchStartedTimestamp = Date.now();
}
```

**Step 3: Update `undoTennisPoint` to restore new fields from snapshot**

In `packages/convex/convex/tennis.ts`, update the `restoredState` construction in `undoTennisPoint` (around lines 838-851). Add the new fields:

```typescript
const restoredState: TennisState = {
  ...match.tennisState,
  sets: previousSnapshot.sets,
  currentSetGames: previousSnapshot.currentSetGames,
  currentGamePoints: previousSnapshot.currentGamePoints,
  servingParticipant: previousSnapshot.servingParticipant,
  firstServerOfSet: previousSnapshot.firstServerOfSet,
  isTiebreak: previousSnapshot.isTiebreak,
  tiebreakPoints: previousSnapshot.tiebreakPoints,
  tiebreakTarget: previousSnapshot.tiebreakTarget ?? match.tennisState.tiebreakTarget,
  tiebreakMode: previousSnapshot.tiebreakMode ?? match.tennisState.tiebreakMode,
  isMatchComplete: previousSnapshot.isMatchComplete,
  history: newHistory,
  // Restore stat fields from snapshot (fall back to current if snapshot doesn't have them)
  aces: previousSnapshot.aces ?? match.tennisState.aces,
  doubleFaults: previousSnapshot.doubleFaults ?? match.tennisState.doubleFaults,
  faultState: previousSnapshot.faultState ?? match.tennisState.faultState ?? 0,
};
```

**Step 4: Add helper function for shared scoring logic**

In `packages/convex/convex/tennis.ts`, add a helper function before the mutations section. This extracts the point-scoring logic from `scoreTennisPoint` so that `scoreTennisAce` and `scoreTennisFault` can reuse it without calling the mutation directly (Convex best practice: extract shared logic into helper functions rather than calling mutations from mutations):

```typescript
/**
 * Core point-scoring logic extracted for reuse by ace/fault mutations.
 * Takes the current match, tournament, state, winner, and returns the updated state.
 * Also handles match completion side effects (stats, bracket advancement).
 */
async function processPointForWinner(
  ctx: MutationCtx,
  match: Doc<"matches">,
  tournament: Doc<"tournaments">,
  state: TennisState,
  winner: 1 | 2
): Promise<{ state: TennisState; matchCompleted: boolean }> {
  // This contains the exact same logic as the body of scoreTennisPoint
  // from line 561 (if state.isTiebreak) through line 765 (await logAction)
  // but returns the state instead of patching the DB directly.
  // The caller is responsible for the DB patch and logging.

  const resolvedConfig = resolveTennisConfig(tournament);
  const normalizedState = normalizeTennisState(state, resolvedConfig);

  if (normalizedState.isTiebreak) {
    const { tiebreakOver, tiebreakWinner, newPoints } = processTiebreakPoint(
      normalizedState,
      winner
    );

    if (tiebreakOver && tiebreakWinner) {
      if (normalizedState.tiebreakMode === "match") {
        const matchTiebreakScore = [...newPoints];
        const { matchOver, matchWinner, newSets } = processMatchSet(
          normalizedState,
          tiebreakWinner,
          matchTiebreakScore
        );

        normalizedState.sets = newSets;
        normalizedState.currentSetGames = [0, 0];
        normalizedState.currentGamePoints = [0, 0];
        normalizedState.isTiebreak = false;
        normalizedState.tiebreakPoints = [0, 0];
        normalizedState.tiebreakMode = undefined;

        if (matchOver) {
          normalizedState.isMatchComplete = true;
          const winnerId = matchWinner === 1 ? match.participant1Id : match.participant2Id;
          const { p1Sets, p2Sets } = countSetsWon(newSets);

          await ctx.db.patch("matches", match._id, {
            tennisState: normalizedState,
            participant1Score: p1Sets,
            participant2Score: p2Sets,
            winnerId,
            status: "completed",
            completedAt: Date.now(),
          });

          await updateParticipantStats(ctx, match, matchWinner as 1 | 2, p1Sets, p2Sets);
          await advanceBracket(ctx, match, matchWinner as 1 | 2);
          await ctx.runMutation(internal.tournaments.checkAndCompleteTournament, {
            tournamentId: match.tournamentId,
          });

          return { state: normalizedState, matchCompleted: true };
        }

        const nextFirstServer = getNextFirstServerOfSet(
          normalizedState.firstServerOfSet,
          matchTiebreakScore
        );
        normalizedState.firstServerOfSet = nextFirstServer;
        normalizedState.servingParticipant = nextFirstServer;
      } else {
        const finalSetGames = [...normalizedState.currentSetGames];
        finalSetGames[tiebreakWinner - 1] = (finalSetGames[tiebreakWinner - 1] ?? 0) + 1;

        const { matchOver, matchWinner, newSets } = processMatchSet(
          normalizedState,
          tiebreakWinner,
          finalSetGames
        );

        normalizedState.sets = newSets;
        normalizedState.currentSetGames = [0, 0];
        normalizedState.currentGamePoints = [0, 0];
        normalizedState.isTiebreak = false;
        normalizedState.tiebreakPoints = [0, 0];
        normalizedState.tiebreakMode = undefined;

        if (matchOver) {
          normalizedState.isMatchComplete = true;
          const winnerId = matchWinner === 1 ? match.participant1Id : match.participant2Id;
          const { p1Sets, p2Sets } = countSetsWon(newSets);

          await ctx.db.patch("matches", match._id, {
            tennisState: normalizedState,
            participant1Score: p1Sets,
            participant2Score: p2Sets,
            winnerId,
            status: "completed",
            completedAt: Date.now(),
          });

          await updateParticipantStats(ctx, match, matchWinner as 1 | 2, p1Sets, p2Sets);
          await advanceBracket(ctx, match, matchWinner as 1 | 2);
          await ctx.runMutation(internal.tournaments.checkAndCompleteTournament, {
            tournamentId: match.tournamentId,
          });

          return { state: normalizedState, matchCompleted: true };
        }

        const nextFirstServer = getNextFirstServerOfSet(
          normalizedState.firstServerOfSet,
          finalSetGames
        );
        normalizedState.firstServerOfSet = nextFirstServer;
        normalizedState.servingParticipant = nextFirstServer;
      }
    } else {
      normalizedState.tiebreakPoints = newPoints;
      const totalPoints = (newPoints[0] ?? 0) + (newPoints[1] ?? 0);
      if (totalPoints > 0) {
        const pointsSinceFirst = totalPoints;
        if (pointsSinceFirst === 1 || (pointsSinceFirst > 1 && (pointsSinceFirst - 1) % 2 === 0)) {
          normalizedState.servingParticipant = normalizedState.servingParticipant === 1 ? 2 : 1;
        }
      }
    }
  } else {
    const { gameOver, gameWinner, newPoints } = processGamePoint(normalizedState, winner);

    if (gameOver && gameWinner) {
      const { setOver, setWinner, newGames, startTiebreak } = processSetGame(
        normalizedState,
        gameWinner
      );

      if (startTiebreak) {
        normalizedState.currentSetGames = newGames;
        normalizedState.currentGamePoints = [0, 0];
        normalizedState.isTiebreak = true;
        normalizedState.tiebreakPoints = [0, 0];
        normalizedState.tiebreakMode = "set";
        normalizedState.tiebreakTarget = isDecidingSet(normalizedState)
          ? (normalizedState.finalSetTiebreakTarget ?? normalizedState.setTiebreakTarget)
          : normalizedState.setTiebreakTarget;
        normalizedState.servingParticipant = getNextServer(normalizedState);
      } else if (setOver && setWinner) {
        const setScore = normalizedState.currentSetGames.map((g, i) =>
          i === setWinner - 1 ? g + 1 : g
        );
        const { matchOver, matchWinner, newSets } = processMatchSet(
          normalizedState,
          setWinner,
          setScore
        );

        normalizedState.sets = newSets;
        normalizedState.currentSetGames = [0, 0];
        normalizedState.currentGamePoints = [0, 0];

        if (matchOver && matchWinner) {
          normalizedState.isMatchComplete = true;
          const winnerId = matchWinner === 1 ? match.participant1Id : match.participant2Id;
          const { p1Sets, p2Sets } = countSetsWon(newSets);

          await ctx.db.patch("matches", match._id, {
            tennisState: normalizedState,
            participant1Score: p1Sets,
            participant2Score: p2Sets,
            winnerId,
            status: "completed",
            completedAt: Date.now(),
          });

          await updateParticipantStats(ctx, match, matchWinner, p1Sets, p2Sets);
          await advanceBracket(ctx, match, matchWinner);
          await ctx.runMutation(internal.tournaments.checkAndCompleteTournament, {
            tournamentId: match.tournamentId,
          });

          return { state: normalizedState, matchCompleted: true };
        } else {
          const { p1Sets, p2Sets } = countSetsWon(newSets);
          const shouldStartMatchTiebreak =
            normalizedState.useMatchTiebreak === true &&
            p1Sets === normalizedState.setsToWin - 1 &&
            p2Sets === normalizedState.setsToWin - 1;

          if (shouldStartMatchTiebreak) {
            normalizedState.isTiebreak = true;
            normalizedState.tiebreakPoints = [0, 0];
            normalizedState.tiebreakMode = "match";
            normalizedState.tiebreakTarget =
              normalizedState.matchTiebreakTarget ?? DEFAULT_MATCH_TIEBREAK_TARGET;
            normalizedState.servingParticipant = getNextServer(normalizedState);
          } else {
            const nextFirstServer = getNextFirstServerOfSet(
              normalizedState.firstServerOfSet,
              setScore
            );
            normalizedState.firstServerOfSet = nextFirstServer;
            normalizedState.servingParticipant = nextFirstServer;
          }
        }
      } else {
        normalizedState.currentSetGames = newGames;
        normalizedState.currentGamePoints = [0, 0];
        normalizedState.servingParticipant = getNextServer(normalizedState);
      }
    } else {
      normalizedState.currentGamePoints = newPoints;
    }
  }

  // Non-match-completing update
  const { p1Sets, p2Sets } = countSetsWon(normalizedState.sets);
  await ctx.db.patch("matches", match._id, {
    tennisState: normalizedState,
    participant1Score: p1Sets,
    participant2Score: p2Sets,
  });

  return { state: normalizedState, matchCompleted: false };
}
```

**Step 5: Refactor `scoreTennisPoint` to use `processPointForWinner`**

Replace the scoring logic body of `scoreTennisPoint` (from line 554 through line 768) with:

```typescript
const resolvedConfig = resolveTennisConfig(tournament);
const state: TennisState = normalizeTennisState({ ...match.tennisState }, resolvedConfig);

// Save current state to history before making changes
state.history = addToHistory(state);

// Reset fault state on normal point
state.faultState = 0;

// Set match start timestamp on first point
if (!state.matchStartedTimestamp) {
  state.matchStartedTimestamp = Date.now();
}

const { state: updatedState, matchCompleted } = await processPointForWinner(
  ctx,
  match,
  tournament,
  state,
  winner
);

await logAction(updatedState);
return null;
```

Note: `processPointForWinner` now handles the DB patch internally. The caller just needs to log.

**Step 6: Add `scoreTennisAce` mutation**

Add after the `scoreTennisPoint` mutation in `packages/convex/convex/tennis.ts`:

```typescript
/**
 * Score an ace - awards point to the serving participant and tracks the ace
 */
export const scoreTennisAce = mutation({
  args: {
    matchId: v.id("matches"),
    tempScorerToken: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const userId = user?._id ?? null;
    await assertNotInMaintenance(ctx, userId);

    const match = await ctx.db.get("matches", args.matchId);
    if (!match) throw errors.notFound("Match");

    const tournament = await ctx.db.get("tournaments", match.tournamentId);
    if (!tournament) throw errors.notFound("Tournament");

    const hasAccess = await canScoreTournament(ctx, tournament, userId, args.tempScorerToken);
    if (!hasAccess) throw errors.unauthorized();

    if (!match.participant1Id || !match.participant2Id) {
      throw errors.invalidState("Both participants must be assigned before scoring");
    }
    if (match.status !== "live") throw errors.invalidState("Match is not live");
    if (!match.tennisState) throw errors.invalidState("Tennis state not initialized");
    if (match.tennisState.isMatchComplete) throw errors.invalidState("Match is already complete");

    // Check if scoring logs are enabled for this user
    const userScoringLogs = await ctx.db
      .query("userScoringLogs")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .first();
    const loggingEnabled = userScoringLogs?.enabled === true;
    const stateBefore = loggingEnabled ? JSON.stringify(match.tennisState) : undefined;

    const resolvedConfig = resolveTennisConfig(tournament);
    const state: TennisState = normalizeTennisState({ ...match.tennisState }, resolvedConfig);

    // Save current state to history
    state.history = addToHistory(state);

    // Track the ace for the serving participant
    const serverIdx = state.servingParticipant - 1;
    const aces = state.aces ? [...state.aces] : [0, 0];
    aces[serverIdx] = (aces[serverIdx] ?? 0) + 1;
    state.aces = aces;

    // Reset fault state
    state.faultState = 0;

    // Set match start timestamp on first point
    if (!state.matchStartedTimestamp) {
      state.matchStartedTimestamp = Date.now();
    }

    // Award point to server
    const winner = state.servingParticipant as 1 | 2;
    const { state: updatedState } = await processPointForWinner(
      ctx,
      match,
      tournament,
      state,
      winner
    );

    // Log the ace action
    if (loggingEnabled) {
      let participant1Name: string | undefined;
      let participant2Name: string | undefined;
      if (match.participant1Id) {
        const p1 = await ctx.db.get("tournamentParticipants", match.participant1Id);
        participant1Name = p1?.displayName;
      }
      if (match.participant2Id) {
        const p2 = await ctx.db.get("tournamentParticipants", match.participant2Id);
        participant2Name = p2?.displayName;
      }

      await ctx.scheduler.runAfter(0, internal.scoringLogs.logScoringAction, {
        tournamentId: match.tournamentId,
        matchId: args.matchId,
        action: "ace",
        actorId: userId ?? undefined,
        sport: "tennis",
        details: { servingParticipant: winner },
        stateBefore,
        stateAfter: JSON.stringify(updatedState),
        participant1Name,
        participant2Name,
        round: match.round,
        matchNumber: match.matchNumber,
      });
    }

    return null;
  },
});
```

**Step 7: Add `scoreTennisFault` mutation**

Add after `scoreTennisAce` in `packages/convex/convex/tennis.ts`:

```typescript
/**
 * Record a fault. First fault sets faultState=1 (no point change).
 * Second fault (double fault) awards point to receiver and tracks the double fault.
 */
export const scoreTennisFault = mutation({
  args: {
    matchId: v.id("matches"),
    tempScorerToken: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const userId = user?._id ?? null;
    await assertNotInMaintenance(ctx, userId);

    const match = await ctx.db.get("matches", args.matchId);
    if (!match) throw errors.notFound("Match");

    const tournament = await ctx.db.get("tournaments", match.tournamentId);
    if (!tournament) throw errors.notFound("Tournament");

    const hasAccess = await canScoreTournament(ctx, tournament, userId, args.tempScorerToken);
    if (!hasAccess) throw errors.unauthorized();

    if (!match.participant1Id || !match.participant2Id) {
      throw errors.invalidState("Both participants must be assigned before scoring");
    }
    if (match.status !== "live") throw errors.invalidState("Match is not live");
    if (!match.tennisState) throw errors.invalidState("Tennis state not initialized");
    if (match.tennisState.isMatchComplete) throw errors.invalidState("Match is already complete");

    // Check if scoring logs are enabled for this user
    const userScoringLogs = await ctx.db
      .query("userScoringLogs")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .first();
    const loggingEnabled = userScoringLogs?.enabled === true;
    const stateBefore = loggingEnabled ? JSON.stringify(match.tennisState) : undefined;

    const resolvedConfig = resolveTennisConfig(tournament);
    const state: TennisState = normalizeTennisState({ ...match.tennisState }, resolvedConfig);

    // Save current state to history
    state.history = addToHistory(state);

    const currentFaultState = state.faultState ?? 0;

    if (currentFaultState === 0) {
      // First fault - just mark it, no point change
      state.faultState = 1;

      // Set match start timestamp on first action
      if (!state.matchStartedTimestamp) {
        state.matchStartedTimestamp = Date.now();
      }

      await ctx.db.patch("matches", match._id, { tennisState: state });

      // Log the fault action
      if (loggingEnabled) {
        let participant1Name: string | undefined;
        let participant2Name: string | undefined;
        if (match.participant1Id) {
          const p1 = await ctx.db.get("tournamentParticipants", match.participant1Id);
          participant1Name = p1?.displayName;
        }
        if (match.participant2Id) {
          const p2 = await ctx.db.get("tournamentParticipants", match.participant2Id);
          participant2Name = p2?.displayName;
        }

        await ctx.scheduler.runAfter(0, internal.scoringLogs.logScoringAction, {
          tournamentId: match.tournamentId,
          matchId: args.matchId,
          action: "fault",
          actorId: userId ?? undefined,
          sport: "tennis",
          details: { servingParticipant: state.servingParticipant },
          stateBefore,
          stateAfter: JSON.stringify(state),
          participant1Name,
          participant2Name,
          round: match.round,
          matchNumber: match.matchNumber,
        });
      }
    } else {
      // Double fault - award point to receiver
      const serverIdx = state.servingParticipant - 1;
      const doubleFaults = state.doubleFaults ? [...state.doubleFaults] : [0, 0];
      doubleFaults[serverIdx] = (doubleFaults[serverIdx] ?? 0) + 1;
      state.doubleFaults = doubleFaults;

      // Reset fault state
      state.faultState = 0;

      // Set match start timestamp on first point
      if (!state.matchStartedTimestamp) {
        state.matchStartedTimestamp = Date.now();
      }

      // Award point to receiver (opposite of server)
      const receiver = (state.servingParticipant === 1 ? 2 : 1) as 1 | 2;
      const { state: updatedState } = await processPointForWinner(
        ctx,
        match,
        tournament,
        state,
        receiver
      );

      // Log the double fault action
      if (loggingEnabled) {
        let participant1Name: string | undefined;
        let participant2Name: string | undefined;
        if (match.participant1Id) {
          const p1 = await ctx.db.get("tournamentParticipants", match.participant1Id);
          participant1Name = p1?.displayName;
        }
        if (match.participant2Id) {
          const p2 = await ctx.db.get("tournamentParticipants", match.participant2Id);
          participant2Name = p2?.displayName;
        }

        await ctx.scheduler.runAfter(0, internal.scoringLogs.logScoringAction, {
          tournamentId: match.tournamentId,
          matchId: args.matchId,
          action: "double_fault",
          actorId: userId ?? undefined,
          sport: "tennis",
          details: { servingParticipant: state.servingParticipant },
          stateBefore,
          stateAfter: JSON.stringify(updatedState),
          participant1Name,
          participant2Name,
          round: match.round,
          matchNumber: match.matchNumber,
        });
      }
    }

    return null;
  },
});
```

**Step 8: Run type checking**

Run: `cd packages/convex && npx tsc --noEmit`
Expected: No new type errors

**Step 9: Commit**

```bash
git add packages/convex/convex/tennis.ts
git commit -m "feat: add scoreTennisAce, scoreTennisFault mutations and refactor scoring logic"
```

---

## Task 3: Update public API for display app

**Files:**

- Modify: `packages/convex/convex/publicApi.ts`

**Step 1: Include new fields in watchCourt response**

In `packages/convex/convex/publicApi.ts`, find where `match.tennisState` is returned in the `watchCourt` function. The tennisState is already included as-is, so the new fields will be automatically included since they're part of the tennisState object.

Verify: The `watchCourt` function returns `match.tennisState` directly from the DB document. Since we added the fields to the schema, they'll be included automatically. Also verify that `match.startedAt` and `match.completedAt` are already in the `timestamps` object of the response.

If `matchStartedTimestamp` needs to be in `timestamps` (for non-tennis consumers), add it:

```typescript
timestamps: {
  scheduledTime: match.scheduledTime,
  startedAt: match.startedAt,
  completedAt: match.completedAt,
  matchStartedTimestamp: match.tennisState?.matchStartedTimestamp,
},
```

**Step 2: Commit**

```bash
git add packages/convex/convex/publicApi.ts
git commit -m "feat: include matchStartedTimestamp in public API watchCourt response"
```

---

## Task 4: Add elapsed time utility and update web tennis helpers

**Files:**

- Modify: `apps/web/lib/tennis.ts`

**Step 1: Add `formatElapsedTime` utility function**

In `apps/web/lib/tennis.ts`, add at the end of the file:

```typescript
/**
 * Format elapsed time in seconds to MM:SS or H:MM:SS
 */
export function formatElapsedTime(elapsedMs: number): string {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
```

**Step 2: Commit**

```bash
git add apps/web/lib/tennis.ts
git commit -m "feat: add formatElapsedTime utility for match time display"
```

---

## Task 5: Add ace/fault buttons and timer to web FullScreenScoring

**Files:**

- Modify: `apps/web/app/components/FullScreenScoring.tsx`

**Step 1: Import new mutations and utilities**

Add imports at the top of `FullScreenScoring.tsx`:

```typescript
import { api } from "@repo/convex";
import { useMutation } from "convex/react";
import { formatElapsedTime } from "../../lib/tennis";
```

Ensure these mutations are imported/used in the component:

```typescript
const scoreAce = useMutation(api.tennis.scoreTennisAce);
const scoreFault = useMutation(api.tennis.scoreTennisFault);
```

**Step 2: Add match time ticker state**

Inside the `FullScreenScoring` component, add a state and effect for ticking time:

```typescript
const [now, setNow] = useState(Date.now());

useEffect(() => {
  if (!matchData?.tennisState?.matchStartedTimestamp || matchData?.tennisState?.isMatchComplete) {
    return;
  }
  const interval = setInterval(() => setNow(Date.now()), 1000);
  return () => clearInterval(interval);
}, [matchData?.tennisState?.matchStartedTimestamp, matchData?.tennisState?.isMatchComplete]);
```

**Step 3: Compute elapsed time**

```typescript
const matchStartedTimestamp = matchData?.tennisState?.matchStartedTimestamp;
const elapsedTime = matchStartedTimestamp
  ? formatElapsedTime(
      (matchData?.tennisState?.isMatchComplete && matchData?.completedAt
        ? matchData.completedAt
        : now) - matchStartedTimestamp
    )
  : null;
```

**Step 4: Add ace/fault handlers**

```typescript
const handleAce = async () => {
  try {
    await scoreAce({ matchId, tempScorerToken });
  } catch (error) {
    console.error("Failed to score ace:", error);
  }
};

const handleFault = async () => {
  try {
    await scoreFault({ matchId, tempScorerToken });
  } catch (error) {
    console.error("Failed to score fault:", error);
  }
};
```

**Step 5: Add UI elements to center strip**

In the center scoreboard overlay area (between the two ScoringZone components), add the ace/fault buttons and elapsed time display. Place them in the center overlay div:

```tsx
{
  /* Match time */
}
{
  elapsedTime && <div className="text-xs text-muted-foreground font-mono">{elapsedTime}</div>;
}

{
  /* Ace & Fault buttons */
}
<div className="flex gap-2 mt-2">
  <button
    onClick={handleAce}
    className="rounded-full bg-[#BFFF00] px-4 py-1.5 text-xs font-bold text-black uppercase tracking-wider"
  >
    Ace
  </button>
  <button
    onClick={handleFault}
    className="rounded-full bg-muted px-4 py-1.5 text-xs font-bold uppercase tracking-wider"
  >
    {matchData?.tennisState?.faultState === 1 ? "Double Fault" : "Fault"}
  </button>
</div>;

{
  /* Fault indicator */
}
{
  matchData?.tennisState?.faultState === 1 && (
    <div className="text-xs text-amber-500 font-medium">2nd Serve</div>
  );
}
```

**Step 6: Commit**

```bash
git add apps/web/app/components/FullScreenScoring.tsx
git commit -m "feat: add ace/fault buttons and match timer to full-screen scoring UI"
```

---

## Task 6: Add elapsed time to web bracket match cards

**Files:**

- Modify: `apps/web/app/(app)/tournaments/[id]/components/BracketTab.tsx`

**Step 1: Import formatElapsedTime**

Add at top of BracketTab.tsx:

```typescript
import { formatElapsedTime } from "@/lib/tennis";
```

**Step 2: Add time display to match cards**

In the bracket match card rendering section (around lines 378-395, the "meta row" area below participant scores), add:

For live matches - a ticking timer component (will need a small `MatchTimer` inline component with `useState` + `useEffect` for the tick):

```tsx
function MatchTimer({ startTimestamp }: { startTimestamp: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <span className="text-[10px] text-muted-foreground font-mono">
      {formatElapsedTime(now - startTimestamp)}
    </span>
  );
}
```

Then in the match card meta row:

```tsx
{
  /* Match time for live matches */
}
{
  match.status === "live" && match.tennisState?.matchStartedTimestamp && (
    <MatchTimer startTimestamp={match.tennisState.matchStartedTimestamp} />
  );
}

{
  /* Match duration for completed matches */
}
{
  match.status === "completed" && match.tennisState?.matchStartedTimestamp && match.completedAt && (
    <span className="text-[10px] text-muted-foreground font-mono">
      {formatElapsedTime(match.completedAt - match.tennisState.matchStartedTimestamp)}
    </span>
  );
}
```

**Step 3: Commit**

```bash
git add apps/web/app/(app)/tournaments/[id]/components/BracketTab.tsx
git commit -m "feat: show match elapsed time on bracket match cards"
```

---

## Task 7: Add ace/fault/timer to web TennisScoreboard component

**Files:**

- Modify: `apps/web/app/components/TennisScoreboard.tsx` (or wherever the non-fullscreen scoreboard lives)

**Step 1: Display ace and double fault counts**

Add a stats row below the scoreboard grid showing ace/double fault counts per player:

```tsx
{
  tennisState?.aces && (
    <div className="flex justify-between text-xs text-muted-foreground mt-2">
      <span>
        Aces: {tennisState.aces[0] ?? 0} - {tennisState.aces[1] ?? 0}
      </span>
      <span>
        Double Faults: {tennisState.doubleFaults?.[0] ?? 0} - {tennisState.doubleFaults?.[1] ?? 0}
      </span>
    </div>
  );
}
```

**Step 2: Display elapsed time**

Add elapsed time near the scoreboard header using the same pattern as Task 5 (useState/useEffect tick).

**Step 3: Commit**

```bash
git add apps/web/app/components/TennisScoreboard.tsx
git commit -m "feat: show ace/fault stats and match time in TennisScoreboard"
```

---

## Task 8: Add ace/fault buttons and timer to mobile scoring screen

**Files:**

- Modify: `apps/mobile/app/(scorer)/scoring/[id].tsx`
- Modify: `apps/mobile/components/scoring/Scoreboard.tsx`

**Step 1: Import new mutations in scoring screen**

In `apps/mobile/app/(scorer)/scoring/[id].tsx`, add:

```typescript
const scoreAce = useMutation(api.tennis.scoreTennisAce);
const scoreFault = useMutation(api.tennis.scoreTennisFault);
```

**Step 2: Add ace/fault handlers**

```typescript
const handleAce = async () => {
  try {
    await scoreAce({ matchId: id as Id<"matches">, tempScorerToken: token });
  } catch (error) {
    console.error("Failed to score ace:", error);
  }
};

const handleFault = async () => {
  try {
    await scoreFault({ matchId: id as Id<"matches">, tempScorerToken: token });
  } catch (error) {
    console.error("Failed to score fault:", error);
  }
};
```

**Step 3: Add ace/fault buttons in the center scoreboard area**

In the JSX between the two scoring zones, near the Scoreboard component, add buttons:

```tsx
<View className="flex-row gap-2 mt-2 justify-center">
  <Pressable onPress={handleAce} className="rounded-full bg-[#BFFF00] px-4 py-1.5">
    <Text className="text-xs font-bold text-black uppercase">Ace</Text>
  </Pressable>
  <Pressable onPress={handleFault} className="rounded-full bg-neutral-700 px-4 py-1.5">
    <Text className="text-xs font-bold text-white uppercase">
      {matchData?.tennisState?.faultState === 1 ? "Double Fault" : "Fault"}
    </Text>
  </Pressable>
</View>;
{
  matchData?.tennisState?.faultState === 1 && (
    <Text className="text-xs text-amber-500 font-medium text-center mt-1">2nd Serve</Text>
  );
}
```

**Step 4: Add match time to Scoreboard component**

In `apps/mobile/components/scoring/Scoreboard.tsx`, accept `matchStartedTimestamp` and `completedAt` props. Add a ticking timer:

```typescript
// Props addition
matchStartedTimestamp?: number;
completedAt?: number;
isMatchComplete?: boolean;
```

```tsx
// Inside component
const [now, setNow] = useState(Date.now());
useEffect(() => {
  if (!matchStartedTimestamp || isMatchComplete) return;
  const interval = setInterval(() => setNow(Date.now()), 1000);
  return () => clearInterval(interval);
}, [matchStartedTimestamp, isMatchComplete]);

const elapsedTime = matchStartedTimestamp
  ? formatElapsedTime((isMatchComplete && completedAt ? completedAt : now) - matchStartedTimestamp)
  : null;
```

Display the time in the scoreboard header area.

**Step 5: Add `formatElapsedTime` to mobile**

Create or reuse the utility. Since mobile may not share `apps/web/lib/tennis.ts`, add a `formatElapsedTime` function in the mobile codebase (e.g., `apps/mobile/lib/tennis.ts` or inline in the Scoreboard component).

**Step 6: Commit**

```bash
git add apps/mobile/app/(scorer)/scoring/[id].tsx apps/mobile/components/scoring/Scoreboard.tsx
git commit -m "feat: add ace/fault buttons and match timer to mobile scoring UI"
```

---

## Task 9: Update display app data model and Convex parsing

**Files:**

- Modify: `apps/display/src/data/live_data.rs`
- Modify: `apps/display/src/data/convex.rs`

**Step 1: Add new fields to `TennisLiveData` struct**

In `apps/display/src/data/live_data.rs`, add to the `TennisLiveData` struct:

```rust
pub aces: [u32; 2],
pub double_faults: [u32; 2],
pub match_started_timestamp: Option<u64>,
pub match_completed_at: Option<u64>,
```

**Step 2: Update `parse_match_data()` in convex.rs**

In `apps/display/src/data/convex.rs`, update the `parse_match_data()` function to extract the new fields from the tennisState JSON:

```rust
// Parse aces
let aces = tennis_state
    .get("aces")
    .and_then(|v| v.as_array())
    .map(|arr| {
        [
            arr.get(0).and_then(|v| v.as_i64()).unwrap_or(0) as u32,
            arr.get(1).and_then(|v| v.as_i64()).unwrap_or(0) as u32,
        ]
    })
    .unwrap_or([0, 0]);

// Parse double faults
let double_faults = tennis_state
    .get("doubleFaults")
    .and_then(|v| v.as_array())
    .map(|arr| {
        [
            arr.get(0).and_then(|v| v.as_i64()).unwrap_or(0) as u32,
            arr.get(1).and_then(|v| v.as_i64()).unwrap_or(0) as u32,
        ]
    })
    .unwrap_or([0, 0]);

// Parse match started timestamp
let match_started_timestamp = tennis_state
    .get("matchStartedTimestamp")
    .and_then(|v| v.as_i64())
    .map(|v| v as u64);

// Parse match completed at (from match object, not tennisState)
let match_completed_at = match_obj
    .get("completedAt")
    .and_then(|v| v.as_i64())
    .map(|v| v as u64);
```

Add these fields to the `TennisLiveData` construction.

**Step 3: Update default/preview data in `TennisLiveData`**

If there's a `Default` impl or preview data constructor, include default values for the new fields:

```rust
aces: [0, 0],
double_faults: [0, 0],
match_started_timestamp: None,
match_completed_at: None,
```

**Step 4: Build and verify**

Run: `cd apps/display && cargo build`
Expected: Compiles successfully

**Step 5: Commit**

```bash
git add apps/display/src/data/live_data.rs apps/display/src/data/convex.rs
git commit -m "feat: add aces, doubleFaults, matchStartedTimestamp to display app data model"
```

---

## Task 10: Add TennisMatchTime component to display app

**Files:**

- Modify: `apps/display/src/components/mod.rs`
- Create: `apps/display/src/components/tennis_time.rs`
- Modify: `apps/display/src/designer/component_library.rs`

**Step 1: Add `TennisMatchTime` to `ComponentType` enum**

In `apps/display/src/components/mod.rs`, add to the `ComponentType` enum:

```rust
TennisMatchTime,
```

**Step 2: Add `TennisMatchTime` variant to `ComponentData` enum**

In `apps/display/src/components/mod.rs`, add:

```rust
TennisMatchTime,
```

(No additional data needed — it always shows the match elapsed time.)

**Step 3: Create `tennis_time.rs` renderer**

Create `apps/display/src/components/tennis_time.rs`:

```rust
use egui::{Color32, Painter, Rect, Vec2};
use super::text::render_aligned_text;
use super::{ComponentStyle, RenderContext};
use crate::data::live_data::TennisLiveData;

/// Format elapsed milliseconds as H:MM:SS or MM:SS
fn format_elapsed(elapsed_ms: u64) -> String {
    let total_secs = elapsed_ms / 1000;
    let hours = total_secs / 3600;
    let minutes = (total_secs % 3600) / 60;
    let seconds = total_secs % 60;

    if hours > 0 {
        format!("{}:{:02}:{:02}", hours, minutes, seconds)
    } else {
        format!("{}:{:02}", minutes, seconds)
    }
}

pub fn render_tennis_time(
    painter: &Painter,
    rect: Rect,
    style: &ComponentStyle,
    _ctx: &RenderContext,
    live_data: Option<&TennisLiveData>,
    zoom: f32,
    pan: Vec2,
) {
    let text = if let Some(data) = live_data {
        if let Some(start_ts) = data.match_started_timestamp {
            let end_ts = if data.is_match_complete {
                data.match_completed_at.unwrap_or_else(|| {
                    std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap_or_default()
                        .as_millis() as u64
                })
            } else {
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_millis() as u64
            };

            if end_ts > start_ts {
                format_elapsed(end_ts - start_ts)
            } else {
                "0:00".to_string()
            }
        } else {
            "0:00".to_string()
        }
    } else {
        // Designer preview
        "12:34".to_string()
    };

    render_aligned_text(painter, rect, &text, style, zoom, pan);
}
```

**Step 4: Register module and add render dispatch**

In `apps/display/src/components/mod.rs`:

1. Add `pub mod tennis_time;` near the other module declarations
2. In `render_component()`, add a match arm for `TennisMatchTime`:

```rust
ComponentData::TennisMatchTime => {
    tennis_time::render_tennis_time(painter, rect, &component.style, ctx, live_data, zoom, pan);
}
```

**Step 5: Add to component library**

In `apps/display/src/designer/component_library.rs`, add a button in the "Tennis" section:

```rust
if ui.button("Match Time").clicked() {
    add_component(project, ComponentType::TennisMatchTime, ComponentData::TennisMatchTime, canvas_size);
}
```

**Step 6: Add serialization support**

Ensure the `TennisMatchTime` variant is included in any serde `Serialize`/`Deserialize` derives on `ComponentType` and `ComponentData`. Since these likely already use `#[derive(Serialize, Deserialize)]`, the new variants should work automatically.

**Step 7: Handle repaint for live timer**

The display viewport needs to repaint every second when showing a live timer. In `apps/display/src/display/renderer.rs`, ensure `ctx.request_repaint_after(Duration::from_secs(1))` is called when the match is live and has a `match_started_timestamp`. This ensures the timer updates every second.

```rust
// In the display viewport update function:
if let Some(data) = &display_state.live_data {
    if data.match_started_timestamp.is_some() && !data.is_match_complete {
        ctx.request_repaint_after(std::time::Duration::from_secs(1));
    }
}
```

**Step 8: Build and verify**

Run: `cd apps/display && cargo build`
Expected: Compiles successfully

**Step 9: Commit**

```bash
git add apps/display/src/components/mod.rs apps/display/src/components/tennis_time.rs apps/display/src/designer/component_library.rs apps/display/src/display/renderer.rs
git commit -m "feat: add TennisMatchTime component to display app"
```

---

## Task 11: Final integration verification

**Step 1: Run full type check**

Run: `bun run check-types`
Expected: No new errors

**Step 2: Run lint**

Run: `bun run lint`
Expected: No new warnings beyond pre-existing ones

**Step 3: Build display app**

Run: `cd apps/display && cargo build`
Expected: Compiles successfully

**Step 4: Manual testing checklist**

- [ ] Start a tennis match, score a point — verify `matchStartedTimestamp` is set and timer starts
- [ ] Tap Ace — verify point goes to server, ace count increments
- [ ] Tap Fault once — verify "2nd Serve" indicator, no point change
- [ ] Tap Fault again — verify double fault, point goes to receiver, count increments
- [ ] Tap Fault then Ace — verify fault resets, ace scored normally
- [ ] Tap Fault then normal point — verify fault resets
- [ ] Undo after ace — verify ace count decremented
- [ ] Undo after double fault — verify faultState restored to 1
- [ ] Undo after single fault — verify faultState restored to 0
- [ ] Check bracket view shows ticking timer for live matches
- [ ] Check bracket view shows final duration for completed matches
- [ ] Verify display app TennisMatchTime component renders elapsed time

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete ace/fault tracking and match time display integration"
```
