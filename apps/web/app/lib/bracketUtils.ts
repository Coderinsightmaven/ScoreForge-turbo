/**
 * Client-side bracket generation utilities for Quick Bracket feature
 * These functions generate bracket structures without database storage
 */

export type BlankMatch = {
  id: string;
  round: number;
  matchNumber: number;
  bracket?: string;
  bracketPosition?: number;
  participant1?: BlankParticipant;
  participant2?: BlankParticipant;
  participant1Score: number;
  participant2Score: number;
  winnerId?: string;
  status: "pending" | "bye";
  nextMatchIndex?: number;
  nextMatchSlot?: number;
};

export type BlankParticipant = {
  id: string;
  displayName: string;
  seed?: number;
  isPlaceholder: boolean;
};

/**
 * Calculate the next power of 2 that is >= n
 */
export function nextPowerOf2(n: number): number {
  let power = 1;
  while (power < n) {
    power *= 2;
  }
  return power;
}

/**
 * Calculate byes needed for a given participant count
 */
export function calculateByesNeeded(participantCount: number): {
  bracketSize: number;
  byes: number;
} {
  const bracketSize = nextPowerOf2(participantCount);
  return {
    bracketSize,
    byes: bracketSize - participantCount,
  };
}

/**
 * Generate seeding order for a bracket (standard tournament seeding)
 * For 8 participants: [1,8,4,5,2,7,3,6] - ensures top seeds meet in finals
 */
function generateSeedOrder(size: number): number[] {
  if (size === 1) return [1];
  if (size === 2) return [1, 2];

  const smaller = generateSeedOrder(size / 2);
  const result: number[] = [];

  for (let i = 0; i < smaller.length; i++) {
    const seed = smaller[i]!;
    result.push(seed);
    result.push(size + 1 - seed);
  }

  return result;
}

/**
 * Generate a unique ID for client-side use
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a blank single elimination bracket structure
 */
export function generateBlankSingleElimination(size: number): BlankMatch[] {
  const bracketSize = nextPowerOf2(size);
  const matches: BlankMatch[] = [];
  const numRounds = Math.log2(bracketSize);

  // Generate seed order
  const seedOrder = generateSeedOrder(bracketSize);

  // Create placeholder participants
  const participants: BlankParticipant[] = seedOrder.map((seed) => ({
    id: generateId(),
    displayName: `Slot ${seed}`,
    seed,
    isPlaceholder: true,
  }));

  // Generate first round matches
  let matchNumber = 0;
  const firstRoundIndices: number[] = [];

  for (let i = 0; i < bracketSize; i += 2) {
    matchNumber++;
    const p1 = participants[i];
    const p2 = participants[i + 1];

    matches.push({
      id: generateId(),
      round: 1,
      matchNumber,
      bracket: "winners",
      bracketPosition: matchNumber,
      participant1: p1,
      participant2: p2,
      participant1Score: 0,
      participant2Score: 0,
      status: "pending",
    });

    firstRoundIndices.push(matches.length - 1);
  }

  // Generate subsequent rounds
  let previousRoundIndices = firstRoundIndices;

  for (let round = 2; round <= numRounds; round++) {
    const currentRoundIndices: number[] = [];
    const matchesInRound = previousRoundIndices.length / 2;

    for (let i = 0; i < matchesInRound; i++) {
      matchNumber++;
      const matchIndex = matches.length;

      matches.push({
        id: generateId(),
        round,
        matchNumber,
        bracket: "winners",
        bracketPosition: i + 1,
        participant1Score: 0,
        participant2Score: 0,
        status: "pending",
      });

      currentRoundIndices.push(matchIndex);

      // Link previous round matches to this one
      const prevMatch1Index = previousRoundIndices[i * 2]!;
      const prevMatch2Index = previousRoundIndices[i * 2 + 1]!;

      matches[prevMatch1Index]!.nextMatchIndex = matchIndex;
      matches[prevMatch1Index]!.nextMatchSlot = 1;
      matches[prevMatch2Index]!.nextMatchIndex = matchIndex;
      matches[prevMatch2Index]!.nextMatchSlot = 2;
    }

    previousRoundIndices = currentRoundIndices;
  }

  return matches;
}

/**
 * Generate a blank double elimination bracket structure
 */
export function generateBlankDoubleElimination(size: number): BlankMatch[] {
  const bracketSize = nextPowerOf2(size);
  const matches: BlankMatch[] = [];
  const numWinnersRounds = Math.log2(bracketSize);

  // Generate seed order
  const seedOrder = generateSeedOrder(bracketSize);

  // Create placeholder participants
  const participants: BlankParticipant[] = seedOrder.map((seed) => ({
    id: generateId(),
    displayName: `Slot ${seed}`,
    seed,
    isPlaceholder: true,
  }));

  let matchNumber = 0;

  // ========== WINNERS BRACKET ==========
  const winnersRoundIndices: number[][] = [];

  // First round of winners bracket
  const firstRoundIndices: number[] = [];
  for (let i = 0; i < bracketSize; i += 2) {
    matchNumber++;
    matches.push({
      id: generateId(),
      round: 1,
      matchNumber,
      bracket: "winners",
      bracketPosition: matchNumber,
      participant1: participants[i],
      participant2: participants[i + 1],
      participant1Score: 0,
      participant2Score: 0,
      status: "pending",
    });
    firstRoundIndices.push(matches.length - 1);
  }
  winnersRoundIndices.push(firstRoundIndices);

  // Subsequent winners rounds
  let previousWinnersIndices = firstRoundIndices;
  for (let round = 2; round <= numWinnersRounds; round++) {
    const currentRoundIndices: number[] = [];
    const matchesInRound = previousWinnersIndices.length / 2;

    for (let i = 0; i < matchesInRound; i++) {
      matchNumber++;
      const matchIndex = matches.length;

      matches.push({
        id: generateId(),
        round,
        matchNumber,
        bracket: "winners",
        bracketPosition: i + 1,
        participant1Score: 0,
        participant2Score: 0,
        status: "pending",
      });

      currentRoundIndices.push(matchIndex);

      // Link previous round matches
      const prevMatch1 = previousWinnersIndices[i * 2]!;
      const prevMatch2 = previousWinnersIndices[i * 2 + 1]!;
      matches[prevMatch1]!.nextMatchIndex = matchIndex;
      matches[prevMatch1]!.nextMatchSlot = 1;
      matches[prevMatch2]!.nextMatchIndex = matchIndex;
      matches[prevMatch2]!.nextMatchSlot = 2;
    }

    winnersRoundIndices.push(currentRoundIndices);
    previousWinnersIndices = currentRoundIndices;
  }

  // ========== LOSERS BRACKET ==========
  // Simplified losers bracket - just placeholder rounds
  let losersRound = 1;
  let previousLosersIndices: number[] = [];

  // First losers round
  const losersRound1Indices: number[] = [];
  const winnersRound1 = winnersRoundIndices[0]!;
  for (let i = 0; i < winnersRound1.length; i += 2) {
    matchNumber++;
    matches.push({
      id: generateId(),
      round: losersRound,
      matchNumber,
      bracket: "losers",
      bracketPosition: i / 2 + 1,
      participant1Score: 0,
      participant2Score: 0,
      status: "pending",
    });
    losersRound1Indices.push(matches.length - 1);
  }
  previousLosersIndices = losersRound1Indices;

  // Build remaining losers bracket
  let winnersRoundIndex = 1;

  while (previousLosersIndices.length > 1 || winnersRoundIndex < numWinnersRounds) {
    losersRound++;

    if (winnersRoundIndex < numWinnersRounds) {
      // Drop-down round
      const dropDownIndices: number[] = [];
      for (let i = 0; i < previousLosersIndices.length; i++) {
        matchNumber++;
        const matchIndex = matches.length;

        matches.push({
          id: generateId(),
          round: losersRound,
          matchNumber,
          bracket: "losers",
          bracketPosition: i + 1,
          participant1Score: 0,
          participant2Score: 0,
          status: "pending",
        });

        dropDownIndices.push(matchIndex);
        matches[previousLosersIndices[i]!]!.nextMatchIndex = matchIndex;
        matches[previousLosersIndices[i]!]!.nextMatchSlot = 1;
      }

      previousLosersIndices = dropDownIndices;
      winnersRoundIndex++;
    }

    // Normal losers round
    if (previousLosersIndices.length > 1) {
      losersRound++;
      const normalIndices: number[] = [];
      const matchesInRound = previousLosersIndices.length / 2;

      for (let i = 0; i < matchesInRound; i++) {
        matchNumber++;
        const matchIndex = matches.length;

        matches.push({
          id: generateId(),
          round: losersRound,
          matchNumber,
          bracket: "losers",
          bracketPosition: i + 1,
          participant1Score: 0,
          participant2Score: 0,
          status: "pending",
        });

        normalIndices.push(matchIndex);

        const prevMatch1 = previousLosersIndices[i * 2]!;
        const prevMatch2 = previousLosersIndices[i * 2 + 1]!;
        matches[prevMatch1]!.nextMatchIndex = matchIndex;
        matches[prevMatch1]!.nextMatchSlot = 1;
        matches[prevMatch2]!.nextMatchIndex = matchIndex;
        matches[prevMatch2]!.nextMatchSlot = 2;
      }

      previousLosersIndices = normalIndices;
    }
  }

  // ========== GRAND FINAL ==========
  matchNumber++;
  const grandFinalIndex = matches.length;
  matches.push({
    id: generateId(),
    round: numWinnersRounds + 1,
    matchNumber,
    bracket: "grand_final",
    bracketPosition: 1,
    participant1Score: 0,
    participant2Score: 0,
    status: "pending",
  });

  // Link winners bracket final
  const winnersFinalIndex = winnersRoundIndices[numWinnersRounds - 1]![0]!;
  matches[winnersFinalIndex]!.nextMatchIndex = grandFinalIndex;
  matches[winnersFinalIndex]!.nextMatchSlot = 1;

  // Link losers bracket final
  const losersFinalIndex = previousLosersIndices[0]!;
  matches[losersFinalIndex]!.nextMatchIndex = grandFinalIndex;
  matches[losersFinalIndex]!.nextMatchSlot = 2;

  return matches;
}

/**
 * Generate blank bracket structure based on format
 */
export function generateBlankBracketStructure(
  size: number,
  format: "single_elimination" | "double_elimination"
): BlankMatch[] {
  switch (format) {
    case "single_elimination":
      return generateBlankSingleElimination(size);
    case "double_elimination":
      return generateBlankDoubleElimination(size);
    default:
      return generateBlankSingleElimination(size);
  }
}

/**
 * Update a participant name in a bracket structure (client-side)
 */
export function updateParticipantName(
  matches: BlankMatch[],
  participantId: string,
  newName: string
): BlankMatch[] {
  return matches.map((match) => ({
    ...match,
    participant1:
      match.participant1?.id === participantId
        ? { ...match.participant1, displayName: newName, isPlaceholder: false }
        : match.participant1,
    participant2:
      match.participant2?.id === participantId
        ? { ...match.participant2, displayName: newName, isPlaceholder: false }
        : match.participant2,
  }));
}

/**
 * Get all unique participants from matches
 */
export function getParticipantsFromMatches(matches: BlankMatch[]): BlankParticipant[] {
  const participantMap = new Map<string, BlankParticipant>();

  for (const match of matches) {
    if (match.participant1) {
      participantMap.set(match.participant1.id, match.participant1);
    }
    if (match.participant2) {
      participantMap.set(match.participant2.id, match.participant2);
    }
  }

  return Array.from(participantMap.values()).sort((a, b) => (a.seed ?? 0) - (b.seed ?? 0));
}
