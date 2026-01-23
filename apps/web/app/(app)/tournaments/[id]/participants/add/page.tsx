"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/convex";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";

export default function AddParticipantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: tournamentId } = use(params);
  const router = useRouter();

  const tournament = useQuery(api.tournaments.getTournament, {
    tournamentId: tournamentId as any,
  });
  const teams = useQuery(
    api.teams.listByOrganization,
    tournament ? { organizationId: tournament.organizationId } : "skip"
  );
  const existingParticipants = useQuery(api.tournamentParticipants.listParticipants, {
    tournamentId: tournamentId as any,
  });

  const registerParticipant = useMutation(api.tournamentParticipants.registerParticipant);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [seed, setSeed] = useState<string>("");

  if (tournament === undefined) {
    return <LoadingSkeleton />;
  }

  if (tournament === null) {
    return <NotFound />;
  }

  const canManage = tournament.myRole === "owner" || tournament.myRole === "admin";
  if (!canManage) {
    return <NotAuthorized tournamentId={tournamentId} />;
  }

  const canRegister = tournament.status === "draft" || tournament.status === "registration";
  if (!canRegister) {
    return <RegistrationClosed tournamentId={tournamentId} />;
  }

  // Filter out teams that are already registered
  const registeredTeamIds = new Set(
    existingParticipants?.filter((p) => p.teamId).map((p) => p.teamId) || []
  );
  const availableTeams = teams?.filter((t) => !registeredTeamIds.has(t._id)) || [];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tournament.participantType === "team") {
        if (!selectedTeamId) {
          setError("Please select a team");
          setLoading(false);
          return;
        }
        await registerParticipant({
          tournamentId: tournamentId as any,
          teamId: selectedTeamId as any,
          displayName: displayName || undefined,
        });
      } else {
        if (!displayName.trim()) {
          setError("Please enter a display name");
          setLoading(false);
          return;
        }
        await registerParticipant({
          tournamentId: tournamentId as any,
          displayName: displayName.trim(),
        });
      }
      router.push(`/tournaments/${tournamentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add participant");
      setLoading(false);
    }
  };

  const isFull = tournament.participantCount >= tournament.maxParticipants;

  return (
    <div className="min-h-screen flex items-start justify-center px-6 py-12">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 grid-bg opacity-50" />
      </div>

      <div className="w-full max-w-lg">
        <Link
          href={`/tournaments/${tournamentId}`}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-accent transition-colors mb-8"
        >
          <span>←</span> Back to {tournament.name}
        </Link>

        <div className="relative bg-bg-card border border-border rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="text-center px-8 pt-10 pb-6">
            <div className="text-5xl mb-4 animate-float">👥</div>
            <h1 className="font-display text-3xl tracking-wide text-text-primary mb-2">
              ADD PARTICIPANT
            </h1>
            <p className="text-text-secondary">
              {tournament.participantType === "team"
                ? "Select a team to register"
                : "Register an individual participant"}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
              <span className="text-accent font-semibold">{tournament.participantCount}</span>
              <span className="text-text-muted">/</span>
              <span className="text-text-muted">{tournament.maxParticipants} participants</span>
            </div>
          </div>

          {isFull ? (
            <div className="px-8 pb-10">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="text-4xl mb-4">⚠</span>
                <p className="text-text-secondary mb-4">
                  This tournament is full. Maximum participants reached.
                </p>
                <Link
                  href={`/tournaments/${tournamentId}`}
                  className="text-accent hover:text-accent-bright transition-colors"
                >
                  Return to Tournament
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-6">
              {tournament.participantType === "team" ? (
                /* Team Selection */
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-primary">
                    Select Team
                  </label>
                  {availableTeams.length === 0 ? (
                    <div className="p-6 border border-dashed border-border rounded-lg text-center">
                      <p className="text-text-muted mb-2">No available teams</p>
                      <p className="text-xs text-text-muted">
                        All teams are already registered or no teams exist yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {availableTeams.map((team) => (
                        <button
                          key={team._id}
                          type="button"
                          onClick={() => {
                            setSelectedTeamId(team._id);
                            if (!displayName) {
                              setDisplayName(team.name);
                            }
                          }}
                          className={`w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-all ${
                            selectedTeamId === team._id
                              ? "bg-accent/10 border-accent"
                              : "bg-bg-elevated border-border hover:border-text-muted"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg bg-bg-card border border-border flex items-center justify-center text-lg font-display text-accent overflow-hidden flex-shrink-0">
                            {team.image ? (
                              <img
                                src={team.image}
                                alt={team.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              team.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span
                              className={`block font-medium truncate ${selectedTeamId === team._id ? "text-accent" : "text-text-primary"}`}
                            >
                              {team.name}
                            </span>
                            <span className="text-xs text-text-muted">
                              {team.memberCount} members
                            </span>
                          </div>
                          {selectedTeamId === team._id && (
                            <span className="text-accent">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              {/* Display Name */}
              <div className="space-y-2">
                <label
                  htmlFor="displayName"
                  className="block text-sm font-medium text-text-primary"
                >
                  Display Name
                  {tournament.participantType === "team" && (
                    <span className="text-text-muted font-normal"> (Optional override)</span>
                  )}
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required={tournament.participantType === "individual"}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={
                    tournament.participantType === "team"
                      ? "Leave blank to use team name"
                      : "Enter participant name"
                  }
                  className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              {/* Seed (Optional) */}
              <div className="space-y-2">
                <label
                  htmlFor="seed"
                  className="block text-sm font-medium text-text-primary"
                >
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
                  className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                />
                <span className="block text-xs text-text-muted">
                  Seeds determine bracket placement. Lower numbers = higher seed.
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
                  className="flex-1 px-4 py-3 text-center bg-bg-elevated border border-border rounded-lg text-text-secondary hover:text-text-primary hover:border-text-muted transition-all"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={
                    loading ||
                    (tournament.participantType === "team" && !selectedTeamId) ||
                    (tournament.participantType === "individual" && !displayName.trim())
                  }
                  className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 bg-accent text-text-inverse font-semibold rounded-lg hover:bg-accent-bright transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-text-inverse/30 border-t-text-inverse rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Add Participant</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Accent bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-gold to-accent" />
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-start justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        <div className="w-40 h-5 bg-bg-card rounded animate-pulse mb-8" />
        <div className="h-[400px] bg-bg-card rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <div className="text-6xl text-text-muted mb-6">◎</div>
      <h1 className="font-display text-3xl text-text-primary mb-3">
        Tournament Not Found
      </h1>
      <p className="text-text-secondary mb-8">
        This tournament doesn&apos;t exist or you don&apos;t have access.
      </p>
      <Link
        href="/tournaments"
        className="inline-flex items-center gap-2 text-accent hover:text-accent-bright transition-colors"
      >
        ← Back to Tournaments
      </Link>
    </div>
  );
}

function NotAuthorized({ tournamentId }: { tournamentId: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <div className="text-6xl text-text-muted mb-6">⚠</div>
      <h1 className="font-display text-3xl text-text-primary mb-3">Not Authorized</h1>
      <p className="text-text-secondary mb-8">
        You don&apos;t have permission to add participants to this tournament.
      </p>
      <Link
        href={`/tournaments/${tournamentId}`}
        className="inline-flex items-center gap-2 text-accent hover:text-accent-bright transition-colors"
      >
        ← Back to Tournament
      </Link>
    </div>
  );
}

function RegistrationClosed({ tournamentId }: { tournamentId: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <div className="text-6xl text-text-muted mb-6">🚫</div>
      <h1 className="font-display text-3xl text-text-primary mb-3">Registration Closed</h1>
      <p className="text-text-secondary mb-8">
        This tournament is no longer accepting new participants.
      </p>
      <Link
        href={`/tournaments/${tournamentId}`}
        className="inline-flex items-center gap-2 text-accent hover:text-accent-bright transition-colors"
      >
        ← Back to Tournament
      </Link>
    </div>
  );
}
