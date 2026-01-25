"use client";

import { useQuery } from "convex/react";
import { api } from "@repo/convex";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/app/components/Skeleton";

export default function DashboardPage() {
  const router = useRouter();
  const user = useQuery(api.users.currentUser);
  const organizations = useQuery(api.organizations.listMyOrganizations);
  const onboardingState = useQuery(api.users.getOnboardingState);

  useEffect(() => {
    if (onboardingState === undefined) return;
    if (onboardingState === null) {
      router.push("/sign-in");
      return;
    }
    if (onboardingState.organizationCount === 0) {
      router.push("/organizations/new");
    }
  }, [onboardingState, router]);

  const greeting = getGreeting();
  const firstName = user?.name?.split(" ")[0] || "there";

  if (onboardingState === undefined || (onboardingState && onboardingState.organizationCount === 0)) {
    return <DashboardSkeleton />;
  }

  const totalTournaments = organizations?.reduce((acc, org) => acc + (org.tournamentCount || 0), 0) || 0;
  const liveTournaments = organizations?.reduce((acc, org) => acc + (org.liveTournamentCount || 0), 0) || 0;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-accent/10 via-bg-secondary to-bg-primary overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-accent/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-accent/5 blur-[80px] rounded-full" />
          <div className="absolute inset-0 grid-bg opacity-20" />
        </div>

        {/* Content */}
        <div className="relative z-10 px-6 lg:px-8 pt-24 pb-16">
          <div className="max-w-[var(--content-max)] mx-auto">
            <p className="text-sm text-text-muted mb-2">{greeting}</p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary mb-4">
              Welcome back, <span className="text-accent">{firstName}</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-xl mb-10">
              Manage your tournaments, track live matches, and grow your organizations.
            </p>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-3">
              <StatPill
                label="Organizations"
                value={organizations?.length ?? 0}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                  </svg>
                }
              />
              <StatPill
                label="Tournaments"
                value={totalTournaments}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                  </svg>
                }
              />
              {liveTournaments > 0 && (
                <StatPill
                  label="Live Now"
                  value={liveTournaments}
                  isLive
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 lg:px-8 py-12">
        <div className="max-w-[var(--content-max)] mx-auto space-y-12">
          {/* Organizations Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-semibold text-text-primary mb-1">
                  Your organizations
                </h2>
                <p className="text-text-secondary">
                  Select an organization to manage tournaments
                </p>
              </div>
              <Link
                href="/organizations/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-text-inverse bg-accent rounded-xl hover:bg-accent-bright transition-all shadow-lg shadow-accent/25"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New organization
              </Link>
            </div>

            {!organizations ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <OrganizationCardSkeleton key={i} />
                ))}
              </div>
            ) : organizations.length === 0 ? (
              <EmptyState
                title="No organizations yet"
                description="Create your first organization to start managing tournaments."
                actionLabel="Create organization"
                actionHref="/organizations/new"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {organizations.map((org, index) => (
                  <OrganizationCard key={org._id} organization={org} index={index} />
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function StatPill({
  label,
  value,
  icon,
  isLive,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  isLive?: boolean;
}) {
  return (
    <div className={`inline-flex items-center gap-3 px-4 py-2.5 rounded-full border ${
      isLive
        ? "bg-success/10 border-success/20 text-success"
        : "bg-bg-primary/80 backdrop-blur-sm border-border text-text-primary"
    }`}>
      <span className="text-current opacity-70">{icon}</span>
      <span className="font-display text-lg font-semibold">{value}</span>
      <span className="text-sm opacity-70">{label}</span>
      {isLive && <span className="w-2 h-2 rounded-full bg-success animate-pulse" />}
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
  const roleConfig: Record<string, { text: string; bg: string; border: string; label: string }> = {
    owner: { text: "text-accent", bg: "bg-accent/10", border: "border-l-accent", label: "Owner" },
    admin: { text: "text-info", bg: "bg-info/10", border: "border-l-info", label: "Admin" },
    scorer: { text: "text-success", bg: "bg-success/10", border: "border-l-success", label: "Scorer" },
  };

  const config = roleConfig[organization.role] || { text: "text-text-muted", bg: "bg-bg-elevated", border: "border-l-border", label: organization.role };
  const hasLive = (organization.liveTournamentCount || 0) > 0;

  return (
    <Link
      href={`/organizations/${organization.slug}`}
      className={`group relative flex flex-col p-6 bg-bg-card border border-border border-l-4 ${config.border} rounded-2xl hover:bg-bg-card-hover hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-300 animate-fadeInUp overflow-hidden`}
      style={{ animationDelay: `${index * 0.05}s` }}
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
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-elevated group-hover:bg-accent group-hover:text-white transition-all duration-300">
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

function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-bg-card/50 border border-border border-dashed rounded-2xl">
      <div className="w-16 h-16 flex items-center justify-center bg-bg-elevated rounded-2xl mb-5">
        <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
      </div>
      <h3 className="font-display text-xl font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary mb-8 max-w-md">{description}</p>
      <Link
        href={actionHref}
        className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-text-inverse bg-accent rounded-xl hover:bg-accent-bright transition-all shadow-lg shadow-accent/25"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        {actionLabel}
      </Link>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Hero Section Skeleton */}
      <div className="relative bg-gradient-to-br from-accent/10 via-bg-secondary to-bg-primary">
        <div className="px-6 lg:px-8 pt-24 pb-16">
          <div className="max-w-[var(--content-max)] mx-auto">
            <Skeleton className="h-4 w-28 mb-3" />
            <Skeleton className="h-14 w-96 max-w-full mb-4" />
            <Skeleton className="h-6 w-80 max-w-full mb-10" />
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-11 w-40 rounded-full" />
              <Skeleton className="h-11 w-36 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="px-6 lg:px-8 py-12">
        <div className="max-w-[var(--content-max)] mx-auto space-y-12">
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-5 w-64" />
              </div>
              <Skeleton className="h-11 w-44 rounded-xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <OrganizationCardSkeleton key={i} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function OrganizationCardSkeleton() {
  return (
    <div className="flex flex-col p-6 bg-bg-card border border-border border-l-4 border-l-border rounded-2xl">
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
