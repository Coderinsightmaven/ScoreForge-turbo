"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/convex";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";

const SPORTS = [
  { value: "basketball", label: "Basketball", icon: "🏀" },
  { value: "soccer", label: "Soccer", icon: "⚽" },
  { value: "tennis", label: "Tennis", icon: "🎾" },
  { value: "football", label: "Football", icon: "🏈" },
  { value: "baseball", label: "Baseball", icon: "⚾" },
  { value: "volleyball", label: "Volleyball", icon: "🏐" },
  { value: "hockey", label: "Hockey", icon: "🏒" },
  { value: "golf", label: "Golf", icon: "⛳" },
  { value: "badminton", label: "Badminton", icon: "🏸" },
  { value: "table_tennis", label: "Table Tennis", icon: "🏓" },
  { value: "cricket", label: "Cricket", icon: "🏏" },
  { value: "rugby", label: "Rugby", icon: "🏉" },
] as const;

const FORMATS = [
  {
    value: "single_elimination",
    label: "Single Elimination",
    description: "Lose once and you're out",
  },
  {
    value: "double_elimination",
    label: "Double Elimination",
    description: "Two losses to be eliminated",
  },
  {
    value: "round_robin",
    label: "Round Robin",
    description: "Everyone plays everyone",
  },
] as const;

const PARTICIPANT_TYPES = [
  { value: "team", label: "Teams", description: "Teams compete against each other" },
  { value: "individual", label: "Individuals", description: "Individual players compete" },
] as const;

export default function NewTournamentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const organization = useQuery(api.organizations.getOrganizationBySlug, { slug });
  const createTournament = useMutation(api.tournaments.createTournament);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sport, setSport] = useState<string>("basketball");
  const [format, setFormat] = useState<string>("single_elimination");
  const [participantType, setParticipantType] = useState<string>("team");

  if (organization === undefined) {
    return <LoadingSkeleton />;
  }

  if (organization === null) {
    return <NotFound slug={slug} />;
  }

  const canCreate = organization.myRole === "owner" || organization.myRole === "admin";
  if (!canCreate) {
    return <NotAuthorized slug={slug} />;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || undefined;
    const maxParticipants = parseInt(formData.get("maxParticipants") as string, 10);
    const startDateStr = formData.get("startDate") as string;
    const registrationEndDateStr = formData.get("registrationEndDate") as string;

    try {
      const tournamentId = await createTournament({
        organizationId: organization._id,
        name,
        description,
        sport: sport as any,
        format: format as any,
        participantType: participantType as any,
        maxParticipants,
        startDate: startDateStr ? new Date(startDateStr).getTime() : undefined,
        registrationEndDate: registrationEndDateStr
          ? new Date(registrationEndDateStr).getTime()
          : undefined,
      });
      router.push(`/tournaments/${tournamentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tournament");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center px-6 py-12">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 grid-bg opacity-50" />
      </div>

      <div className="w-full max-w-2xl">
        <Link
          href={`/organizations/${slug}`}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-accent transition-colors mb-8"
        >
          <span>←</span> Back to {organization.name}
        </Link>

        <div className="relative bg-bg-card border border-border rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="text-center px-8 pt-10 pb-6">
            <div className="text-5xl mb-4 animate-float">◎</div>
            <h1 className="font-display text-3xl tracking-wide text-text-primary mb-2">
              NEW TOURNAMENT
            </h1>
            <p className="text-text-secondary">
              Create a tournament for {organization.name}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-6">
            {/* Tournament Name */}
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-text-primary"
              >
                Tournament Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g., Summer Championship 2024"
                className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-text-primary"
              >
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="Describe your tournament..."
                rows={3}
                className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors resize-y"
              />
            </div>

            {/* Sport Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary">
                Sport
              </label>
              <div className="grid grid-cols-4 gap-2">
                {SPORTS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSport(s.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                      sport === s.value
                        ? "bg-accent/10 border-accent text-accent"
                        : "bg-bg-elevated border-border text-text-secondary hover:border-text-muted"
                    }`}
                  >
                    <span className="text-2xl">{s.icon}</span>
                    <span className="text-xs font-medium">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary">
                Tournament Format
              </label>
              <div className="space-y-2">
                {FORMATS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFormat(f.value)}
                    className={`w-full flex flex-col items-start gap-0.5 p-4 rounded-lg border text-left transition-all ${
                      format === f.value
                        ? "bg-accent/10 border-accent"
                        : "bg-bg-elevated border-border hover:border-text-muted"
                    }`}
                  >
                    <span
                      className={`font-semibold ${format === f.value ? "text-accent" : "text-text-primary"}`}
                    >
                      {f.label}
                    </span>
                    <span className="text-xs text-text-muted">{f.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Participant Type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary">
                Participant Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {PARTICIPANT_TYPES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setParticipantType(p.value)}
                    className={`flex flex-col items-center gap-1 p-6 rounded-lg border text-center transition-all ${
                      participantType === p.value
                        ? "bg-accent/10 border-accent"
                        : "bg-bg-elevated border-border hover:border-text-muted"
                    }`}
                  >
                    <span
                      className={`text-lg font-semibold ${participantType === p.value ? "text-accent" : "text-text-primary"}`}
                    >
                      {p.label}
                    </span>
                    <span className="text-xs text-text-muted">{p.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Max Participants */}
            <div className="space-y-2">
              <label
                htmlFor="maxParticipants"
                className="block text-sm font-medium text-text-primary"
              >
                Maximum Participants
              </label>
              <input
                id="maxParticipants"
                name="maxParticipants"
                type="number"
                required
                min={2}
                max={256}
                defaultValue={8}
                className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
              <span className="block text-xs text-text-muted">
                For elimination brackets, powers of 2 work best (4, 8, 16, 32...)
              </span>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="registrationEndDate"
                  className="block text-sm font-medium text-text-primary"
                >
                  Registration Deadline
                </label>
                <input
                  id="registrationEndDate"
                  name="registrationEndDate"
                  type="datetime-local"
                  className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-text-primary"
                >
                  Start Date
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="datetime-local"
                  className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent transition-colors"
                />
              </div>
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
                href={`/organizations/${slug}`}
                className="flex-1 px-4 py-3 text-center bg-bg-elevated border border-border rounded-lg text-text-secondary hover:text-text-primary hover:border-text-muted transition-all"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 bg-accent text-text-inverse font-semibold rounded-lg hover:bg-accent-bright transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-text-inverse/30 border-t-text-inverse rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Tournament</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </form>

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
      <div className="w-full max-w-2xl">
        <div className="w-40 h-5 bg-bg-card rounded animate-pulse mb-8" />
        <div className="h-[600px] bg-bg-card rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}

function NotFound({ slug }: { slug: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <div className="text-6xl text-text-muted mb-6">⬡</div>
      <h1 className="font-display text-3xl text-text-primary mb-3">
        Organization Not Found
      </h1>
      <p className="text-text-secondary mb-8">
        The organization &ldquo;{slug}&rdquo; doesn&apos;t exist or you don&apos;t have
        access.
      </p>
      <Link
        href="/organizations"
        className="inline-flex items-center gap-2 text-accent hover:text-accent-bright transition-colors"
      >
        ← Back to Organizations
      </Link>
    </div>
  );
}

function NotAuthorized({ slug }: { slug: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <div className="text-6xl text-text-muted mb-6">⚠</div>
      <h1 className="font-display text-3xl text-text-primary mb-3">Not Authorized</h1>
      <p className="text-text-secondary mb-8">
        You don&apos;t have permission to create tournaments in this organization.
      </p>
      <Link
        href={`/organizations/${slug}`}
        className="inline-flex items-center gap-2 text-accent hover:text-accent-bright transition-colors"
      >
        ← Back to Organization
      </Link>
    </div>
  );
}
