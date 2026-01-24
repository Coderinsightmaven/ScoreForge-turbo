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
            <div className="w-20 h-20 flex items-center justify-center font-display text-3xl font-semibold text-text-inverse bg-gradient-to-br from-accent to-accent-dim rounded-2xl flex-shrink-0 overflow-hidden">
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
              <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary mb-2">
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-medium text-text-primary">
              Team roster
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-medium text-text-primary">
              Team performance
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
    captain: "text-gold bg-gold/10",
    player: "text-text-secondary bg-bg-elevated",
  };

  return (
    <div
      className="flex items-center gap-4 p-4 bg-bg-card border border-border rounded-xl hover:bg-bg-card-hover hover:border-accent/30 transition-all animate-fadeInUp"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="w-10 h-10 flex items-center justify-center font-display text-sm font-semibold text-text-inverse bg-gradient-to-br from-accent to-accent-dim rounded-full flex-shrink-0">
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
      <div className="w-14 h-14 flex items-center justify-center bg-bg-card rounded-2xl mb-4">
        <svg className="w-7 h-7 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      </div>
      <h1 className="font-display text-xl font-medium text-text-primary mb-2">
        Team not found
      </h1>
      <p className="text-text-secondary mb-6">
        This team doesn&apos;t exist or you don&apos;t have access.
      </p>
      <Link
        href="/teams"
        className="text-sm text-accent hover:text-accent-bright transition-colors"
      >
        ← Back to teams
      </Link>
    </div>
  );
}
