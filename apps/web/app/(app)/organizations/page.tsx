"use client";

import { useQuery } from "convex/react";
import { api } from "@repo/convex";
import Link from "next/link";
import { Skeleton } from "@/app/components/Skeleton";

export default function OrganizationsPage() {
  const organizations = useQuery(api.organizations.listMyOrganizations);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-accent/10 via-bg-secondary to-bg-primary overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-accent/10 blur-[100px] rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/5 blur-[80px] rounded-full" />
          <div className="absolute inset-0 grid-bg opacity-20" />
        </div>

        {/* Content */}
        <div className="relative z-10 px-6 lg:px-8 pt-24 pb-16">
          <div className="max-w-[var(--content-max)] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <div>
                <p className="text-sm text-text-muted mb-2">Manage your</p>
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary mb-4">
                  Organizations
                </h1>
                <p className="text-lg text-text-secondary max-w-xl">
                  Create and manage sports organizations, leagues, and clubs. Each organization can have its own tournaments, teams, and members.
                </p>
              </div>
              <Link
                href="/organizations/new"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-text-inverse bg-accent rounded-xl hover:bg-accent-bright transition-all shadow-lg shadow-accent/25 whitespace-nowrap"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New organization
              </Link>
            </div>

            {/* Stats */}
            {organizations && organizations.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-10">
                <StatPill
                  label="Total"
                  value={organizations.length}
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                    </svg>
                  }
                />
                <StatPill
                  label="Owner"
                  value={organizations.filter(org => org.role === 'owner').length}
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  }
                />
                <StatPill
                  label="Member"
                  value={organizations.filter(org => org.role !== 'owner').length}
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 lg:px-8 py-12">
        <div className="max-w-[var(--content-max)] mx-auto">
          {!organizations ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <OrganizationCardSkeleton key={i} />
              ))}
            </div>
          ) : organizations.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {organizations.map((org, index) => (
                <OrganizationCard key={org._id} organization={org} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-full bg-bg-primary/80 backdrop-blur-sm border border-border text-text-primary">
      <span className="text-current opacity-70">{icon}</span>
      <span className="font-display text-lg font-semibold">{value}</span>
      <span className="text-sm opacity-70">{label}</span>
    </div>
  );
}

function OrganizationCard({
  organization,
  index,
}: {
  organization: {
    _id: string;
    name: string;
    slug: string;
    role: string;
    tournamentCount?: number;
    liveTournamentCount?: number;
  };
  index: number;
}) {
  const roleConfig: Record<string, { text: string; bg: string; border: string; hoverBg: string; label: string }> = {
    owner: { text: "text-accent", bg: "bg-accent/10", border: "border-l-accent border-r-accent", hoverBg: "group-hover:bg-accent", label: "Owner" },
    admin: { text: "text-info", bg: "bg-info/10", border: "border-l-info border-r-info", hoverBg: "group-hover:bg-info", label: "Admin" },
    scorer: { text: "text-success", bg: "bg-success/10", border: "border-l-success border-r-success", hoverBg: "group-hover:bg-success", label: "Scorer" },
  };

  const config = roleConfig[organization.role] || { text: "text-text-muted", bg: "bg-bg-elevated", border: "border-l-border border-r-border", hoverBg: "group-hover:bg-accent", label: organization.role };
  const hasLive = (organization.liveTournamentCount || 0) > 0;

  return (
    <Link
      href={`/organizations/${organization.slug}`}
      className={`group relative flex flex-col p-6 bg-bg-card border border-border border-l-4 border-r-4 ${config.border} rounded-2xl hover:bg-bg-card-hover hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-300 animate-fadeInUp overflow-hidden`}
      style={{ animationDelay: `${index * 0.03}s` }}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-accent/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {hasLive && (
        <span className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-success bg-success/10 rounded-full border border-success/20">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          Live
        </span>
      )}

      <div className="relative z-10 flex-1">
        <h3 className="font-display text-xl font-semibold text-text-primary truncate group-hover:text-accent transition-colors mb-1">
          {organization.name}
        </h3>
        <p className="text-sm text-text-muted font-mono">/{organization.slug}</p>
      </div>

      <div className="relative z-10 flex items-center justify-between mt-6 pt-4 border-t border-border/50">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${config.bg} ${config.text}`}>
            {config.label}
          </span>
          {organization.tournamentCount !== undefined && organization.tournamentCount > 0 && (
            <span className="flex items-center gap-1.5 text-sm text-text-secondary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
              </svg>
              {organization.tournamentCount}
            </span>
          )}
        </div>
        <div className={`w-8 h-8 flex items-center justify-center rounded-full bg-bg-elevated ${config.hoverBg} group-hover:text-white transition-all duration-300`}>
          <svg
            className="w-4 h-4 text-text-muted group-hover:text-white transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-20 h-20 flex items-center justify-center bg-bg-card rounded-3xl mb-6 border border-border">
        <svg className="w-10 h-10 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
      </div>
      <h2 className="font-display text-2xl font-semibold text-text-primary mb-3">
        No organizations yet
      </h2>
      <p className="text-text-secondary mb-8 max-w-md text-lg">
        Create your first organization to start managing tournaments, teams, and competitions.
      </p>
      <Link
        href="/organizations/new"
        className="inline-flex items-center gap-2 px-6 py-3.5 text-base font-semibold text-text-inverse bg-accent rounded-xl hover:bg-accent-bright transition-all shadow-lg shadow-accent/25"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Create your first organization
      </Link>
    </div>
  );
}

function OrganizationCardSkeleton() {
  return (
    <div className="flex flex-col p-6 bg-bg-card border border-border border-l-4 border-r-4 border-l-border border-r-border rounded-2xl">
      <div className="flex-1">
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-16 rounded-lg" />
          <Skeleton className="h-5 w-8" />
        </div>
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
    </div>
  );
}
