"use client";

import { useQuery } from "convex/react";
import { api } from "@repo/convex";
import Link from "next/link";
import { use } from "react";

export default function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const team = useQuery(api.teams.getTeam, { teamId: id as any });

  if (team === undefined) {
    return <LoadingSkeleton />;
  }

  if (team === null) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <header className="relative py-12 px-6 bg-bg-secondary overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-[100px] left-[30%] w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,var(--accent-glow)_0%,transparent_60%)] opacity-30" />
          <div className="absolute inset-0 grid-bg opacity-50" />
        </div>
        <div className="relative max-w-[var(--content-max)] mx-auto animate-fadeIn">
          <Link
            href="/teams"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors mb-6"
          >
            <span>←</span> Teams
          </Link>
          <div className="flex items-center gap-6">
            <div className="w-[100px] h-[100px] flex items-center justify-center font-display text-5xl font-bold text-bg-void bg-gradient-to-br from-accent to-gold rounded-2xl shadow-[0_8px_32px_var(--accent-glow)] flex-shrink-0 overflow-hidden">
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
            <div>
              <h1 className="font-display text-[clamp(28px,4vw,40px)] font-bold tracking-wide text-text-primary mb-2">
                {team.name}
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-sm text-text-secondary">
                  {team.members.length}{" "}
                  {team.members.length === 1 ? "member" : "members"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="py-8 px-6 max-w-[var(--content-max)] mx-auto">
        {/* Members Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <h2 className="font-display text-lg font-semibold tracking-widest text-text-primary">
              TEAM ROSTER
            </h2>
          </div>

          <div className="flex flex-col gap-2">
            {team.members
              .sort((a, b) => {
                if (a.role === "captain") return -1;
                if (b.role === "captain") return 1;
                return a.joinedAt - b.joinedAt;
              })
              .map((member, index) => (
                <MemberCard
                  key={member._id}
                  member={member}
                  isCaptain={member.userId === team.captainUserId}
                  index={index}
                />
              ))}
          </div>
        </section>

        {/* Team Stats */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <h2 className="font-display text-lg font-semibold tracking-widest text-text-primary">
              TEAM PERFORMANCE
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center p-6 bg-bg-card border border-border rounded-xl text-center animate-fadeInUp">
              <span className="font-display text-4xl font-bold text-accent mb-1">
                0
              </span>
              <span className="text-xs font-semibold tracking-wide uppercase text-text-muted">
                Tournaments
              </span>
            </div>
            <div
              className="flex flex-col items-center p-6 bg-bg-card border border-border rounded-xl text-center animate-fadeInUp"
              style={{ animationDelay: "0.05s" }}
            >
              <span className="font-display text-4xl font-bold text-accent mb-1">
                0
              </span>
              <span className="text-xs font-semibold tracking-wide uppercase text-text-muted">
                Wins
              </span>
            </div>
            <div
              className="flex flex-col items-center p-6 bg-bg-card border border-border rounded-xl text-center animate-fadeInUp"
              style={{ animationDelay: "0.1s" }}
            >
              <span className="font-display text-4xl font-bold text-accent mb-1">
                0
              </span>
              <span className="text-xs font-semibold tracking-wide uppercase text-text-muted">
                Losses
              </span>
            </div>
            <div
              className="flex flex-col items-center p-6 bg-bg-card border border-border rounded-xl text-center animate-fadeInUp"
              style={{ animationDelay: "0.15s" }}
            >
              <span className="font-display text-4xl font-bold text-accent mb-1">
                0%
              </span>
              <span className="text-xs font-semibold tracking-wide uppercase text-text-muted">
                Win Rate
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function MemberCard({
  member,
  isCaptain,
  index,
}: {
  member: {
    _id: string;
    userId: string;
    userName?: string;
    userEmail?: string;
    role: string;
    joinedAt: number;
  };
  isCaptain: boolean;
  index: number;
}) {
  const roleStyles: Record<string, string> = {
    captain: "text-gold bg-gold/15",
    player: "text-text-secondary bg-white/5",
  };

  return (
    <div
      className="flex items-center gap-4 p-4 bg-bg-card border border-border rounded-xl hover:bg-bg-card-hover hover:border-accent/30 transition-all animate-fadeInUp"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="w-12 h-12 flex items-center justify-center font-display text-xl font-semibold text-bg-void bg-gradient-to-br from-accent to-gold rounded-full flex-shrink-0">
        {member.userName?.charAt(0).toUpperCase() || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <span className="flex items-center gap-2 font-medium text-text-primary">
          {member.userName || "Unknown"}
          {isCaptain && <span className="text-sm">👑</span>}
        </span>
        <span className="block text-sm text-text-muted">{member.userEmail}</span>
      </div>
      <span
        className={`px-3 py-1 text-xs font-semibold tracking-wide uppercase rounded ${roleStyles[member.role] || roleStyles.player}`}
      >
        {member.role}
      </span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen">
      <header className="relative py-12 px-6 bg-bg-secondary">
        <div className="max-w-[var(--content-max)] mx-auto">
          <div className="w-[120px] h-5 bg-bg-elevated rounded animate-pulse mb-6" />
          <div className="flex items-center gap-6">
            <div className="w-[100px] h-[100px] bg-bg-elevated rounded-2xl animate-pulse" />
            <div>
              <div className="w-[250px] h-9 bg-bg-elevated rounded animate-pulse mb-2" />
              <div className="w-[150px] h-5 bg-bg-elevated rounded animate-pulse" />
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <div className="text-6xl text-text-muted mb-6 opacity-40">◇</div>
      <h1 className="font-display text-3xl font-bold text-text-primary mb-3">
        Team Not Found
      </h1>
      <p className="text-text-secondary mb-8">
        This team doesn&apos;t exist or you don&apos;t have access.
      </p>
      <Link
        href="/teams"
        className="text-accent hover:text-accent-bright transition-colors"
      >
        ← Back to Teams
      </Link>
    </div>
  );
}
