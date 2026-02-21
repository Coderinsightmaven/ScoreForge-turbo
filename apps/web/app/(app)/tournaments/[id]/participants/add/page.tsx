"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@repo/convex";
import { Id } from "@repo/convex/dataModel";
import { useState, useEffect, useCallback, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getDisplayMessage } from "@/lib/errors";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { toast } from "sonner";

interface Player {
  _id: string;
  name: string;
  countryCode: string;
  ranking?: number;
  tour: string;
}

/**
 * Format a full name to abbreviated format (e.g., "Joe Berry" -> "J. Berry")
 */
function formatNameAbbreviated(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return fullName; // Single name, return as-is
  }
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  return `${firstName?.[0]?.toUpperCase() ?? ""}. ${lastName}`;
}

/**
 * Format doubles display name (e.g., "J. Berry / M. Lorenz")
 */
function formatDoublesDisplayName(player1: string, player2: string): string {
  return `${formatNameAbbreviated(player1)} / ${formatNameAbbreviated(player2)}`;
}

const CSV_SINGLE_HEADERS = new Set([
  "name",
  "player",
  "player name",
  "participant",
  "participant name",
  "team",
  "team name",
  "teamname",
]);

const CSV_PLAYER1_HEADERS = new Set([
  "player1",
  "player 1",
  "player1 name",
  "player 1 name",
  "partner1",
  "partner 1",
]);

const CSV_PLAYER2_HEADERS = new Set([
  "player2",
  "player 2",
  "player2 name",
  "player 2 name",
  "partner2",
  "partner 2",
]);

const CSV_NATIONALITY_HEADERS = new Set([
  "nationality",
  "country",
  "country code",
  "countrycode",
  "country_code",
  "nat",
  "flag",
]);

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i] ?? "";
    const nextChar = text[i + 1] ?? "";

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value.trim());
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i += 1;
      }
      row.push(value.trim());
      value = "";
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value.trim());
    if (row.some((cell) => cell.length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

export default function AddParticipantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.ReactNode {
  const { id: tournamentId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const bracketIdFromUrl = searchParams.get("bracketId");

  const tournament = useQuery(api.tournaments.getTournament, {
    tournamentId: tournamentId as Id<"tournaments">,
  });

  const brackets = useQuery(api.tournamentBrackets.listBrackets, {
    tournamentId: tournamentId as Id<"tournaments">,
  });

  const addParticipant = useMutation(api.tournamentParticipants.addParticipant);
  const addCustomPlayer = useMutation(api.playerDatabase.addCustomPlayer);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for different participant types
  const [selectedBracketId, setSelectedBracketId] = useState<string>("");
  const [initialBracketSet, setInitialBracketSet] = useState(false);

  // Set initial bracket from URL or default to first draft bracket
  useEffect(() => {
    const availableBrackets = brackets?.filter((b) => b.status === "draft");
    const firstBracket = availableBrackets?.[0];
    if (availableBrackets && availableBrackets.length > 0 && firstBracket && !initialBracketSet) {
      if (bracketIdFromUrl && availableBrackets.some((b) => b._id === bracketIdFromUrl)) {
        setSelectedBracketId(bracketIdFromUrl);
      } else {
        setSelectedBracketId(firstBracket._id);
      }
      setInitialBracketSet(true);
    }
  }, [brackets, bracketIdFromUrl, initialBracketSet]);
  const [playerName, setPlayerName] = useState("");
  const [player1Name, setPlayer1Name] = useState("");
  const [player2Name, setPlayer2Name] = useState("");
  const [teamName, setTeamName] = useState("");
  const [seed, setSeed] = useState<string>("");
  const [nationality, setNationality] = useState("");
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // View state: search (default), manual entry, or CSV import
  const [view, setView] = useState<"search" | "manual" | "csv">("search");

  // Player database search state
  const [searchQuery, setSearchQuery] = useState("");
  const [dbSelectedPlayers, setDbSelectedPlayers] = useState<Map<string, Player>>(new Map());
  const [activeTab, setActiveTab] = useState<"official" | "custom">("official");
  const [isSeeding, setIsSeeding] = useState(false);
  const [isImportingFromDb, setIsImportingFromDb] = useState(false);

  const seedAction = useAction(api.playerDatabaseSeed.seedPlayerDatabase);

  // Get bracket gender for tour filtering
  const selectedBracket = brackets?.find((b) => b._id === selectedBracketId);
  const bracketGender = selectedBracket?.gender;
  const tourFilter =
    bracketGender === "mens" ? "ATP" : bracketGender === "womens" ? "WTA" : undefined;

  const officialResults = useQuery(
    api.playerDatabase.searchPlayers,
    view === "search" && activeTab === "official"
      ? {
          tour: tourFilter,
          searchQuery: searchQuery.trim() || undefined,
          limit: 50,
        }
      : "skip"
  );

  const customResults = useQuery(
    api.playerDatabase.searchPlayers,
    view === "search" && activeTab === "custom"
      ? {
          tour: "CUSTOM",
          searchQuery: searchQuery.trim() || undefined,
          limit: 50,
        }
      : "skip"
  );

  // Filter out CUSTOM players from official results
  const officialPlayers = officialResults?.filter((p) => p.tour !== "CUSTOM");
  const searchPlayers = activeTab === "official" ? officialPlayers : customResults;

  const handleSeed = useCallback(async () => {
    setIsSeeding(true);
    try {
      const [atpResult, wtaResult] = await Promise.all([
        seedAction({ tour: "ATP" }),
        seedAction({ tour: "WTA" }),
      ]);
      const totalImported = atpResult.imported + wtaResult.imported;
      const totalSkipped = atpResult.skipped + wtaResult.skipped;
      toast.success(
        `Imported ${totalImported} players (${atpResult.imported} ATP, ${wtaResult.imported} WTA, ${totalSkipped} skipped)`
      );
    } catch {
      toast.error("Failed to seed player database");
    } finally {
      setIsSeeding(false);
    }
  }, [seedAction]);

  const togglePlayer = useCallback((player: Player) => {
    setDbSelectedPlayers((prev) => {
      const next = new Map(prev);
      if (next.has(player._id)) {
        next.delete(player._id);
      } else {
        next.set(player._id, player);
      }
      return next;
    });
  }, []);

  if (tournament === undefined) {
    return <LoadingSkeleton />;
  }

  if (tournament === null) {
    return <NotFound />;
  }

  const canManage = tournament.myRole === "owner";
  if (!canManage) {
    return <NotAuthorized tournamentId={tournamentId} />;
  }

  // Allow adding participants when tournament is draft or active (bracket-level check happens below)
  const canRegister = tournament.status === "draft" || tournament.status === "active";
  if (!canRegister) {
    return <TournamentNotDraft tournamentId={tournamentId} />;
  }

  // Only show brackets that are still in draft
  const draftBrackets = brackets?.filter((b) => b.status === "draft");

  if (draftBrackets && draftBrackets.length === 0) {
    return <TournamentNotDraft tournamentId={tournamentId} />;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!selectedBracketId) {
        setError("Please select a bracket");
        setLoading(false);
        return;
      }

      const seedValue = seed ? parseInt(seed, 10) : undefined;

      // Get the effective participant type for the selected bracket
      const bracketParticipantType =
        brackets?.find((b) => b._id === selectedBracketId)?.participantType ||
        tournament.participantType;

      if (bracketParticipantType === "individual") {
        if (!playerName.trim()) {
          setError("Please enter a player name");
          setLoading(false);
          return;
        }
        // Split by comma to support multiple participants
        const names = playerName
          .split(",")
          .map((n) => n.trim())
          .filter((n) => n.length > 0);
        if (maxParticipants && currentParticipantCount + names.length > maxParticipants) {
          const remaining = maxParticipants - currentParticipantCount;
          setError(
            `Cannot add ${names.length} participants. Only ${remaining} spot${remaining === 1 ? "" : "s"} remaining in this bracket.`
          );
          setLoading(false);
          return;
        }
        const nationalityValue = nationality.trim().toLowerCase() || undefined;
        for (let i = 0; i < names.length; i++) {
          await addParticipant({
            tournamentId: tournamentId as Id<"tournaments">,
            bracketId: selectedBracketId as Id<"tournamentBrackets">,
            playerName: names[i],
            seed: names.length === 1 ? seedValue : undefined, // Only use seed for single participant
            nationality: names.length === 1 ? nationalityValue : undefined,
          });
        }
        // Save manually entered players to database for future reuse
        for (const name of names) {
          try {
            await addCustomPlayer({
              name,
              countryCode: names.length === 1 ? nationalityValue : undefined,
            });
          } catch {
            // Best-effort — don't block participant creation
          }
        }
      } else if (bracketParticipantType === "doubles") {
        if (!player1Name.trim() || !player2Name.trim()) {
          setError("Please enter both player names");
          setLoading(false);
          return;
        }
        // Split by comma to support multiple pairs (must have same number in each field)
        const players1 = player1Name
          .split(",")
          .map((n) => n.trim())
          .filter((n) => n.length > 0);
        const players2 = player2Name
          .split(",")
          .map((n) => n.trim())
          .filter((n) => n.length > 0);

        if (players1.length !== players2.length) {
          setError("Number of Player 1 names must match number of Player 2 names");
          setLoading(false);
          return;
        }

        if (maxParticipants && currentParticipantCount + players1.length > maxParticipants) {
          const remaining = maxParticipants - currentParticipantCount;
          setError(
            `Cannot add ${players1.length} pairs. Only ${remaining} spot${remaining === 1 ? "" : "s"} remaining in this bracket.`
          );
          setLoading(false);
          return;
        }

        for (let i = 0; i < players1.length; i++) {
          await addParticipant({
            tournamentId: tournamentId as Id<"tournaments">,
            bracketId: selectedBracketId as Id<"tournamentBrackets">,
            player1Name: players1[i],
            player2Name: players2[i],
            seed: players1.length === 1 ? seedValue : undefined,
          });
        }
      } else if (bracketParticipantType === "team") {
        if (!teamName.trim()) {
          setError("Please enter a team name");
          setLoading(false);
          return;
        }
        // Split by comma to support multiple teams
        const names = teamName
          .split(",")
          .map((n) => n.trim())
          .filter((n) => n.length > 0);
        if (maxParticipants && currentParticipantCount + names.length > maxParticipants) {
          const remaining = maxParticipants - currentParticipantCount;
          setError(
            `Cannot add ${names.length} teams. Only ${remaining} spot${remaining === 1 ? "" : "s"} remaining in this bracket.`
          );
          setLoading(false);
          return;
        }
        for (let i = 0; i < names.length; i++) {
          await addParticipant({
            tournamentId: tournamentId as Id<"tournaments">,
            bracketId: selectedBracketId as Id<"tournamentBrackets">,
            teamName: names[i],
            seed: names.length === 1 ? seedValue : undefined,
          });
        }
      }

      router.push(`/tournaments/${tournamentId}?tab=participants`);
    } catch (err) {
      setError(getDisplayMessage(err) || "Failed to add participant");
      setLoading(false);
    }
  };

  // Use bracket's participant type if set, otherwise fall back to tournament's
  const effectiveParticipantType = selectedBracket?.participantType || tournament.participantType;

  // Calculate participant count and max based on selected bracket
  const currentParticipantCount = selectedBracket?.participantCount ?? 0;
  const maxParticipants = selectedBracket?.maxParticipants;

  // Check if full - only applies when max is set on the bracket
  const isFull =
    selectedBracket && selectedBracket.maxParticipants
      ? selectedBracket.participantCount >= selectedBracket.maxParticipants
      : false;

  const getFormTitle = () => {
    switch (effectiveParticipantType) {
      case "individual":
        return "Register an individual player";
      case "doubles":
        return "Register a doubles pair";
      case "team":
        return "Register a team";
      default:
        return "Add a participant";
    }
  };

  const isFormValid = () => {
    // Bracket selection is always required
    if (!selectedBracketId) {
      return false;
    }

    switch (effectiveParticipantType) {
      case "individual":
        return playerName.trim().length > 0;
      case "doubles":
        return player1Name.trim().length > 0 && player2Name.trim().length > 0;
      case "team":
        return teamName.trim().length > 0;
      default:
        return false;
    }
  };

  const csvHelperText =
    effectiveParticipantType === "doubles"
      ? "Columns: player 1, player 2, nationality (optional). One row per pair."
      : "Columns: name, nationality (optional). One row per participant.";

  const downloadTemplate = () => {
    let content: string;
    if (effectiveParticipantType === "doubles") {
      content =
        "player 1,player 2,nationality\nJohn Doe,Jane Smith,US\nBob Wilson,Alice Brown,GB\nMike Chen,Sarah Lee,AU";
    } else if (effectiveParticipantType === "team") {
      content = "name,nationality\nTeam Alpha,US\nTeam Beta,GB\nTeam Gamma,AU";
    } else {
      content = "name,nationality\nJohn Doe,US\nJane Smith,GB\nBob Wilson,AU";
    }
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `participants-template-${effectiveParticipantType}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvImport = async (files: File[]) => {
    setImportSummary(null);
    setImportError(null);

    if (files.length === 0) {
      return;
    }

    const file = files[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const rows = parseCsvRows(text);

      if (rows.length === 0) {
        setImportError("CSV file is empty.");
        return;
      }

      const headerRow = rows[0]?.map((cell) => cell.trim().toLowerCase()) ?? [];
      const hasHeader = headerRow.some(
        (cell) =>
          CSV_SINGLE_HEADERS.has(cell) ||
          CSV_PLAYER1_HEADERS.has(cell) ||
          CSV_PLAYER2_HEADERS.has(cell) ||
          CSV_NATIONALITY_HEADERS.has(cell)
      );

      const dataRows = hasHeader ? rows.slice(1) : rows;

      // Detect nationality column
      const nationalityIndex = hasHeader
        ? headerRow.findIndex((cell) => CSV_NATIONALITY_HEADERS.has(cell))
        : -1;
      const hasNationality = nationalityIndex !== -1;

      if (effectiveParticipantType === "doubles") {
        const rawPlayer1Index = hasHeader
          ? headerRow.findIndex((cell) => CSV_PLAYER1_HEADERS.has(cell))
          : 0;
        const rawPlayer2Index = hasHeader
          ? headerRow.findIndex((cell) => CSV_PLAYER2_HEADERS.has(cell))
          : 1;
        const player1Index = rawPlayer1Index === -1 ? 0 : rawPlayer1Index;
        const player2Index = rawPlayer2Index === -1 ? 1 : rawPlayer2Index;

        const pairs: { p1: string; p2: string; nat?: string }[] = [];

        dataRows.forEach((row) => {
          const player1 = row[player1Index]?.trim() ?? "";
          const player2 = row[player2Index]?.trim() ?? "";
          const nat = hasNationality
            ? row[nationalityIndex]?.trim().toLowerCase() || undefined
            : undefined;
          if (player1 && player2) {
            pairs.push({ p1: player1, p2: player2, nat });
          }
        });

        if (pairs.length === 0) {
          setImportError("No valid doubles pairs found in the CSV.");
          return;
        }

        if (maxParticipants && currentParticipantCount + pairs.length > maxParticipants) {
          const remaining = maxParticipants - currentParticipantCount;
          setImportError(
            `CSV contains ${pairs.length} pairs but only ${remaining} spot${remaining === 1 ? "" : "s"} remaining in this bracket.`
          );
          return;
        }

        // If nationality is present, directly submit all entries
        if (hasNationality) {
          if (!selectedBracketId) {
            setImportError("Please select a bracket before importing.");
            return;
          }
          setLoading(true);
          try {
            for (const pair of pairs) {
              await addParticipant({
                tournamentId: tournamentId as Id<"tournaments">,
                bracketId: selectedBracketId as Id<"tournamentBrackets">,
                player1Name: pair.p1,
                player2Name: pair.p2,
                nationality: pair.nat,
              });
            }
            setImportSummary(
              `Added ${pairs.length} ${pairs.length === 1 ? "pair" : "pairs"} from ${file.name}.`
            );
            router.push(`/tournaments/${tournamentId}?tab=participants`);
          } catch (err) {
            setImportError(getDisplayMessage(err) || "Failed to import participants.");
            setLoading(false);
          }
          return;
        }

        setPlayer1Name(pairs.map((p) => p.p1).join(", "));
        setPlayer2Name(pairs.map((p) => p.p2).join(", "));
        setPlayerName("");
        setTeamName("");
        setSeed("");
        setError(null);
        setImportSummary(
          `Imported ${pairs.length} ${pairs.length === 1 ? "pair" : "pairs"} from ${file.name}.`
        );
        return;
      }

      const rawNameIndex = hasHeader
        ? headerRow.findIndex((cell) => CSV_SINGLE_HEADERS.has(cell))
        : 0;
      const nameIndex = rawNameIndex === -1 ? 0 : rawNameIndex;

      const entries: { name: string; nat?: string }[] = [];
      dataRows.forEach((row) => {
        const name = row[nameIndex]?.trim() ?? "";
        const nat = hasNationality
          ? row[nationalityIndex]?.trim().toLowerCase() || undefined
          : undefined;
        if (name.length > 0) {
          entries.push({ name, nat });
        }
      });

      if (entries.length === 0) {
        setImportError("No valid names found in the CSV.");
        return;
      }

      if (maxParticipants && currentParticipantCount + entries.length > maxParticipants) {
        const remaining = maxParticipants - currentParticipantCount;
        setImportError(
          `CSV contains ${entries.length} participants but only ${remaining} spot${remaining === 1 ? "" : "s"} remaining in this bracket.`
        );
        return;
      }

      // If nationality is present, directly submit all entries
      if (hasNationality) {
        if (!selectedBracketId) {
          setImportError("Please select a bracket before importing.");
          return;
        }
        setLoading(true);
        try {
          for (const entry of entries) {
            if (effectiveParticipantType === "team") {
              await addParticipant({
                tournamentId: tournamentId as Id<"tournaments">,
                bracketId: selectedBracketId as Id<"tournamentBrackets">,
                teamName: entry.name,
                nationality: entry.nat,
              });
            } else {
              await addParticipant({
                tournamentId: tournamentId as Id<"tournaments">,
                bracketId: selectedBracketId as Id<"tournamentBrackets">,
                playerName: entry.name,
                nationality: entry.nat,
              });
              try {
                await addCustomPlayer({
                  name: entry.name,
                  countryCode: entry.nat,
                });
              } catch {
                // Best-effort
              }
            }
          }
          const label = effectiveParticipantType === "team" ? "teams" : "players";
          setImportSummary(`Added ${entries.length} ${label} from ${file.name}.`);
          router.push(`/tournaments/${tournamentId}?tab=participants`);
        } catch (err) {
          setImportError(getDisplayMessage(err) || "Failed to import participants.");
          setLoading(false);
        }
        return;
      }

      // No nationality — populate form fields for review (existing behavior)
      if (effectiveParticipantType === "team") {
        setTeamName(entries.map((e) => e.name).join(", "));
        setPlayerName("");
        setPlayer1Name("");
        setPlayer2Name("");
        setSeed("");
        setError(null);
        setImportSummary(
          `Imported ${entries.length} ${entries.length === 1 ? "team" : "teams"} from ${file.name}.`
        );
        return;
      }

      setPlayerName(entries.map((e) => e.name).join(", "));
      setPlayer1Name("");
      setPlayer2Name("");
      setTeamName("");
      setSeed("");
      setError(null);
      setImportSummary(
        `Imported ${entries.length} ${entries.length === 1 ? "player" : "players"} from ${file.name}.`
      );
    } catch (csvError) {
      setImportError(csvError instanceof Error ? csvError.message : "Failed to parse the CSV.");
    }
  };

  const handleImportFromDb = async () => {
    if (!selectedBracketId) {
      toast.error("Please select a bracket first");
      return;
    }
    if (dbSelectedPlayers.size === 0) return;

    setIsImportingFromDb(true);
    try {
      const playersToImport = Array.from(dbSelectedPlayers.values());
      for (const player of playersToImport) {
        await addParticipant({
          tournamentId: tournamentId as Id<"tournaments">,
          bracketId: selectedBracketId as Id<"tournamentBrackets">,
          playerName: player.name,
          nationality: player.countryCode || undefined,
        });
      }
      toast.success(
        `Successfully imported ${playersToImport.length} player${playersToImport.length !== 1 ? "s" : ""}`
      );
      router.push(`/tournaments/${tournamentId}?tab=participants`);
    } catch (err) {
      toast.error(getDisplayMessage(err) || "Failed to import players");
    } finally {
      setIsImportingFromDb(false);
    }
  };

  const genderLabel =
    bracketGender === "mens" ? "men's" : bracketGender === "womens" ? "women's" : undefined;

  return (
    <div className="flex items-start justify-center">
      <div className="w-full max-w-lg space-y-6">
        <Link
          href={`/tournaments/${tournamentId}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-brand transition-colors"
        >
          <span>←</span> Back to {tournament.name}
        </Link>

        <div className="surface-panel surface-panel-rail relative overflow-hidden">
          {/* Header — always visible */}
          <div className="text-center px-8 pt-10 pb-6">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand/30 bg-brand/10">
              <svg
                className="w-7 h-7 text-brand"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                />
              </svg>
            </div>
            <h1 className="text-heading text-text-primary mb-2">Add participants</h1>
            <p className="text-sm text-text-secondary">{getFormTitle()}</p>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
              <span className="text-brand font-semibold">{currentParticipantCount}</span>
              {maxParticipants && (
                <>
                  <span className="text-text-muted">/</span>
                  <span className="text-text-muted">{maxParticipants}</span>
                </>
              )}
              <span className="text-text-muted">participants</span>
              {selectedBracket && (
                <span className="text-text-muted">
                  in <span className="font-semibold text-text-primary">{selectedBracket.name}</span>
                </span>
              )}
            </div>
          </div>

          {isFull && selectedBracket ? (
            <div className="px-8 pb-10">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="text-4xl mb-4">⚠</span>
                <p className="text-text-secondary mb-4">
                  {selectedBracket.name} is full. Maximum participants reached.
                </p>
                <Link
                  href={`/tournaments/${tournamentId}`}
                  className="text-brand hover:text-brand-bright transition-colors"
                >
                  Return to Tournament
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* ===== SEARCH VIEW (default) ===== */}
              {view === "search" && (
                <div className="px-8 pb-8">
                  {/* Search input */}
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search players by name..."
                    className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-full text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-colors"
                    autoFocus
                  />

                  {/* Tab pills */}
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab("official")}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        activeTab === "official"
                          ? "bg-brand/10 text-brand border border-brand/30"
                          : "text-text-muted hover:text-text-primary hover:bg-bg-secondary border border-transparent"
                      }`}
                    >
                      Official
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("custom")}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        activeTab === "custom"
                          ? "bg-brand/10 text-brand border border-brand/30"
                          : "text-text-muted hover:text-text-primary hover:bg-bg-secondary border border-transparent"
                      }`}
                    >
                      Custom
                    </button>
                  </div>

                  {/* Player list */}
                  <div className="mt-3 max-h-[40vh] overflow-y-auto -mx-2">
                    {searchPlayers === undefined ? (
                      <div className="flex items-center justify-center py-12">
                        <span className="w-6 h-6 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                      </div>
                    ) : searchPlayers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        {!searchQuery ? (
                          activeTab === "official" ? (
                            <>
                              <p className="text-text-primary text-sm font-medium">
                                No {genderLabel ?? ""} players in database
                              </p>
                              <p className="text-text-muted text-xs mt-1 mb-4">
                                Seed the database with ATP &amp; WTA players from the JeffSackmann
                                tennis datasets.
                              </p>
                              <button
                                type="button"
                                onClick={handleSeed}
                                disabled={isSeeding}
                                className="px-5 py-2.5 border border-border rounded-full text-sm font-semibold text-text-primary hover:bg-bg-secondary transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
                              >
                                {isSeeding && (
                                  <span className="w-4 h-4 border-2 border-text-muted/30 border-t-text-primary rounded-full animate-spin" />
                                )}
                                {isSeeding ? "Seeding ATP & WTA..." : "Seed ATP & WTA Players"}
                              </button>
                            </>
                          ) : (
                            <p className="text-text-muted text-sm">No custom players yet</p>
                          )
                        ) : (
                          <>
                            <p className="text-text-muted text-sm">No players found</p>
                            <p className="text-text-muted text-xs mt-1">
                              Try a different search term
                            </p>
                          </>
                        )}
                      </div>
                    ) : (
                      <ul className="space-y-1">
                        {searchPlayers.map((player) => {
                          const isSelected = dbSelectedPlayers.has(player._id);
                          return (
                            <li key={player._id}>
                              <button
                                type="button"
                                onClick={() => togglePlayer(player)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-colors ${
                                  isSelected
                                    ? "bg-brand/10 border border-brand/30"
                                    : "hover:bg-bg-secondary border border-transparent"
                                }`}
                              >
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                    isSelected ? "bg-brand border-brand" : "border-border"
                                  }`}
                                >
                                  {isSelected && (
                                    <svg
                                      className="w-3 h-3 text-black"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth={3}
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  )}
                                </div>

                                {player.countryCode && (
                                  <span
                                    className={`fi fi-${player.countryCode} text-lg flex-shrink-0`}
                                  />
                                )}

                                <span className="text-sm text-text-primary font-medium flex-1 truncate">
                                  {player.name}
                                </span>

                                {!bracketGender && player.tour !== "CUSTOM" && (
                                  <span className="text-[10px] text-text-muted font-medium px-1.5 py-0.5 bg-bg-secondary rounded-full flex-shrink-0">
                                    {player.tour}
                                  </span>
                                )}

                                {player.ranking && (
                                  <span className="text-xs text-text-muted flex-shrink-0">
                                    #{player.ranking}
                                  </span>
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  {/* Footer: selection count + add button */}
                  {maxParticipants &&
                    !isImportingFromDb &&
                    dbSelectedPlayers.size > 0 &&
                    currentParticipantCount + dbSelectedPlayers.size > maxParticipants && (
                      <div className="mt-4 flex items-center gap-2 p-3 bg-red/10 border border-red/30 rounded-lg text-sm text-red">
                        <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-red rounded-full text-white text-xs font-bold">
                          !
                        </span>
                        Max participants reached. Only {maxParticipants - currentParticipantCount}{" "}
                        spot
                        {maxParticipants - currentParticipantCount !== 1 ? "s" : ""} remaining.
                      </div>
                    )}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-text-secondary">
                      {dbSelectedPlayers.size} player
                      {dbSelectedPlayers.size !== 1 ? "s" : ""} selected
                    </span>
                    <button
                      type="button"
                      onClick={handleImportFromDb}
                      disabled={
                        dbSelectedPlayers.size === 0 ||
                        isImportingFromDb ||
                        (!!maxParticipants &&
                          currentParticipantCount + dbSelectedPlayers.size > maxParticipants)
                      }
                      className="px-6 py-2.5 bg-brand text-black font-semibold text-sm rounded-full hover:bg-brand-hover transition-colors disabled:bg-brand/50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                    >
                      {isImportingFromDb && (
                        <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      )}
                      Add {dbSelectedPlayers.size > 0 ? `${dbSelectedPlayers.size} ` : ""}Player
                      {dbSelectedPlayers.size !== 1 ? "s" : ""}
                    </button>
                  </div>

                  {/* Secondary links */}
                  <div className="mt-6 pt-4 border-t border-border flex items-center justify-center gap-6">
                    <button
                      type="button"
                      onClick={() => setView("manual")}
                      className="text-sm text-text-secondary hover:text-brand transition-colors"
                    >
                      Add a custom player
                    </button>
                    <span className="text-text-muted">|</span>
                    <button
                      type="button"
                      onClick={() => setView("csv")}
                      className="text-sm text-text-secondary hover:text-brand transition-colors"
                    >
                      Import from CSV
                    </button>
                  </div>
                </div>
              )}

              {/* ===== MANUAL VIEW ===== */}
              {view === "manual" && (
                <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-6">
                  <button
                    type="button"
                    onClick={() => setView("search")}
                    className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-brand transition-colors"
                  >
                    <span>←</span> Back to search
                  </button>

                  {/* Individual: Single Player Name */}
                  {effectiveParticipantType === "individual" && (
                    <div className="space-y-2">
                      <label
                        htmlFor="playerName"
                        className="block text-sm font-medium text-text-primary"
                      >
                        Player Name(s)
                      </label>
                      <input
                        id="playerName"
                        name="playerName"
                        type="text"
                        required
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="e.g., John Doe, Jane Smith, Bob Wilson"
                        className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-colors"
                        autoFocus
                      />
                      <span className="block text-xs text-text-muted">
                        Separate multiple names with commas to add them all at once
                      </span>
                    </div>
                  )}

                  {/* Doubles: Two Player Names */}
                  {effectiveParticipantType === "doubles" && (
                    <>
                      <div className="space-y-2">
                        <label
                          htmlFor="player1Name"
                          className="block text-sm font-medium text-text-primary"
                        >
                          Player 1 Name(s)
                        </label>
                        <input
                          id="player1Name"
                          name="player1Name"
                          type="text"
                          required
                          value={player1Name}
                          onChange={(e) => setPlayer1Name(e.target.value)}
                          placeholder="e.g., John Doe, Jane Smith"
                          className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-colors"
                          autoFocus
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="player2Name"
                          className="block text-sm font-medium text-text-primary"
                        >
                          Player 2 Name(s)
                        </label>
                        <input
                          id="player2Name"
                          name="player2Name"
                          type="text"
                          required
                          value={player2Name}
                          onChange={(e) => setPlayer2Name(e.target.value)}
                          placeholder="e.g., Bob Wilson, Alice Brown"
                          className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-colors"
                        />
                        <span className="block text-xs text-text-muted">
                          For multiple pairs, separate names with commas (same order in both fields)
                        </span>
                      </div>
                      {player1Name.trim() && player2Name.trim() && (
                        <div className="px-4 py-3 bg-brand/5 border border-brand/20 rounded-lg">
                          <span className="text-xs text-text-muted block mb-1">
                            Display Name Preview
                          </span>
                          <span className="text-sm font-medium text-brand">
                            {formatDoublesDisplayName(
                              player1Name.split(",")[0]?.trim() || "",
                              player2Name.split(",")[0]?.trim() || ""
                            )}
                            {player1Name.includes(",") && " (+ more)"}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Team: Team Name */}
                  {effectiveParticipantType === "team" && (
                    <div className="space-y-2">
                      <label
                        htmlFor="teamName"
                        className="block text-sm font-medium text-text-primary"
                      >
                        Team Name(s)
                      </label>
                      <input
                        id="teamName"
                        name="teamName"
                        type="text"
                        required
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="e.g., Team Alpha, Team Beta, Team Gamma"
                        className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-colors"
                        autoFocus
                      />
                      <span className="block text-xs text-text-muted">
                        Separate multiple team names with commas to add them all at once
                      </span>
                    </div>
                  )}

                  {/* Seed (Optional) */}
                  <div className="space-y-2">
                    <label htmlFor="seed" className="block text-sm font-medium text-text-primary">
                      Seed <span className="text-text-muted font-normal">(Optional)</span>
                    </label>
                    <input
                      id="seed"
                      name="seed"
                      type="number"
                      min={1}
                      value={seed}
                      onChange={(e) => setSeed(e.target.value)}
                      placeholder="e.g., 1 for top seed"
                      className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-colors"
                    />
                    <span className="block text-xs text-text-muted">
                      Seeds determine bracket placement. Lower numbers = higher seed.
                    </span>
                  </div>

                  {/* Nationality (Optional) */}
                  <div className="space-y-2">
                    <label
                      htmlFor="nationality"
                      className="block text-sm font-medium text-text-primary"
                    >
                      Nationality{" "}
                      <span className="text-text-muted font-normal">(Optional, Country Code)</span>
                    </label>
                    <input
                      id="nationality"
                      name="nationality"
                      type="text"
                      maxLength={2}
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      placeholder="e.g., US"
                      className="w-24 px-4 py-3 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand transition-colors uppercase"
                    />
                    <span className="block text-xs text-text-muted">
                      ISO 3166-1 alpha-2 country code (e.g., US, GB, AU). Only applies to single
                      entries.
                    </span>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red/10 border border-red/30 rounded-lg text-sm text-red">
                      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-red rounded-full text-white text-xs font-bold">
                        !
                      </span>
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Link
                      href={`/tournaments/${tournamentId}`}
                      className="flex-1 px-4 py-3 text-center bg-bg-secondary border border-border rounded-lg text-text-secondary hover:text-text-primary hover:border-text-muted transition-all"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={loading || !isFormValid()}
                      className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 bg-brand text-text-inverse font-semibold rounded-lg hover:bg-brand-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="w-5 h-5 border-2 border-text-inverse/30 border-t-text-inverse rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Add Participant(s)</span>
                          <span>→</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* ===== CSV VIEW ===== */}
              {view === "csv" && (
                <div className="px-8 pb-10 space-y-6">
                  <button
                    type="button"
                    onClick={() => setView("search")}
                    className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-brand transition-colors"
                  >
                    <span>←</span> Back to search
                  </button>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-text-primary">
                      Import from CSV
                    </label>
                    <FileDropzone
                      onFiles={handleCsvImport}
                      accept={{ "text/csv": [".csv"] }}
                      label="Drop CSV here or click to upload"
                      helperText={csvHelperText}
                    />
                    <button
                      type="button"
                      onClick={downloadTemplate}
                      className="text-xs text-brand hover:text-brand-bright transition-colors underline underline-offset-2"
                    >
                      Download template CSV
                    </button>
                    {importSummary && <p className="text-xs text-success">{importSummary}</p>}
                    {importError && <p className="text-xs text-error">{importError}</p>}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Accent bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand" />
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="container flex min-h-[50vh] items-center justify-center px-6">
      <div className="w-full max-w-lg space-y-4">
        <div className="h-5 w-40 rounded bg-bg-card animate-pulse" />
        <div className="h-[400px] rounded-2xl bg-bg-card animate-pulse" />
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="container flex min-h-[60vh] items-center justify-center px-6">
      <div className="surface-panel surface-panel-rail w-full max-w-lg p-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-bg-secondary">
          <svg
            className="w-8 h-8 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0"
            />
          </svg>
        </div>
        <h1 className="text-title text-text-primary mb-3">Tournament Not Found</h1>
        <p className="text-text-secondary mb-8">
          This tournament doesn&apos;t exist or you don&apos;t have access.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-brand hover:text-brand-bright transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

function NotAuthorized({ tournamentId }: { tournamentId: string }) {
  return (
    <div className="container flex min-h-[60vh] items-center justify-center px-6">
      <div className="surface-panel surface-panel-rail w-full max-w-lg p-8 text-center">
        <div className="text-5xl text-text-muted mb-4">⚠</div>
        <h1 className="text-title text-text-primary mb-3">Not Authorized</h1>
        <p className="text-text-secondary mb-8">
          You don&apos;t have permission to add participants to this tournament.
        </p>
        <Link
          href={`/tournaments/${tournamentId}`}
          className="inline-flex items-center gap-2 text-brand hover:text-brand-bright transition-colors"
        >
          ← Back to Tournament
        </Link>
      </div>
    </div>
  );
}

function TournamentNotDraft({ tournamentId }: { tournamentId: string }) {
  return (
    <div className="container flex min-h-[60vh] items-center justify-center px-6">
      <div className="surface-panel surface-panel-rail w-full max-w-lg p-8 text-center">
        <div className="text-5xl text-text-muted mb-4">🚫</div>
        <h1 className="text-title text-text-primary mb-3">Cannot Add Participants</h1>
        <p className="text-text-secondary mb-8">
          This tournament has already started and is no longer accepting new participants.
        </p>
        <Link
          href={`/tournaments/${tournamentId}`}
          className="inline-flex items-center gap-2 text-brand hover:text-brand-bright transition-colors"
        >
          ← Back to Tournament
        </Link>
      </div>
    </div>
  );
}
