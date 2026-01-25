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

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="max-w-[var(--content-max)] mx-auto">
        {/* Header */}
        <header className="mb-10">
          <p className="text-sm text-text-muted mb-1">{greeting}</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
            Welcome back, <span className="text-accent">{firstName}</span>
          </h1>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          <StatCard
            label="Organizations"
            value={organizations?.length ?? 0}
            href="/organizations"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
              </svg>
            }
          />
          <StatCard
            label="Tournaments"
            value={0}
            href="/tournaments"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
              </svg>
            }
          />
          <StatCard
            label="Teams"
            value={0}
            href="/teams"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            }
          />
          <StatCard
            label="Live Matches"
            value={0}
            href="/tournaments"
            isLive
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            }
          />
        </section>

        {/* Organizations */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg font-medium text-text-primary">
              Your organizations
            </h2>
            <Link
              href="/organizations/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-accent bg-accent/10 rounded-lg hover:bg-accent/15 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New
            </Link>
          </div>

          {!organizations ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {organizations.map((org, index) => (
                <OrganizationCard key={org._id} organization={org} index={index} />
              ))}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="font-display text-lg font-medium text-text-primary mb-5">
            Quick actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <QuickAction
              label="New tournament"
              description="Create a bracket or round robin"
              href="/tournaments"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                </svg>
              }
            />
            <QuickAction
              label="Add team"
              description="Create a new team"
              href="/teams"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              }
            />
            <QuickAction
              label="Invite members"
              description="Grow your organization"
              href="/organizations"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
              }
            />
          </div>
        </section>
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

function StatCard({
  label,
  value,
  href,
  icon,
  isLive,
}: {
  label: string;
  value: number;
  href: string;
  icon: React.ReactNode;
  isLive?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 p-4 bg-bg-card border border-border rounded-xl hover:border-accent/30 hover:bg-bg-card-hover transition-all duration-200"
    >
      <div className="w-9 h-9 flex items-center justify-center text-text-muted bg-bg-elevated rounded-lg">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-display text-2xl font-semibold text-text-primary">{value}</span>
          {isLive && value > 0 && (
            <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
          )}
        </div>
        <p className="text-sm text-text-muted truncate">{label}</p>
      </div>
      <svg
        className="w-4 h-4 text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
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
    image?: string;
    role: string;
  };
  index: number;
}) {
  const roleStyles: Record<string, string> = {
    owner: "text-accent bg-accent/10",
    admin: "text-info bg-info/10",
    scorer: "text-success bg-success/10",
  };

  return (
    <Link
      href={`/organizations/${organization.slug}`}
      className="group flex items-center gap-4 p-4 bg-bg-card border border-border rounded-xl hover:border-accent/30 hover:bg-bg-card-hover transition-all duration-200 animate-fadeInUp"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="w-11 h-11 rounded-xl bg-bg-elevated border border-border flex items-center justify-center text-lg font-display font-semibold text-accent overflow-hidden">
        {organization.image ? (
          <img src={organization.image} alt={organization.name} className="w-full h-full object-cover" />
        ) : (
          organization.name.charAt(0).toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-text-primary truncate">{organization.name}</h3>
        <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-md ${roleStyles[organization.role] || "text-text-muted bg-bg-elevated"}`}>
          {organization.role}
        </span>
      </div>
      <svg
        className="w-4 h-4 text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
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
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-bg-card/50 border border-border border-dashed rounded-xl">
      <div className="w-12 h-12 flex items-center justify-center bg-bg-elevated rounded-xl mb-4">
        <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
      </div>
      <h3 className="font-display text-lg font-medium text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-secondary mb-6 max-w-sm">{description}</p>
      <Link
        href={actionHref}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-text-inverse bg-accent rounded-lg hover:bg-accent-bright transition-colors"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

function QuickAction({
  label,
  description,
  href,
  icon,
}: {
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 p-4 bg-bg-card border border-border rounded-xl hover:border-accent/30 hover:bg-bg-card-hover transition-all duration-200"
    >
      <div className="w-9 h-9 flex items-center justify-center text-accent bg-accent/10 rounded-lg">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className="block font-medium text-text-primary">{label}</span>
        <span className="text-sm text-text-muted">{description}</span>
      </div>
      <svg
        className="w-4 h-4 text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen py-8 px-6">
      <div className="max-w-[var(--content-max)] mx-auto">
        <header className="mb-10">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-72" />
        </header>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-bg-card border border-border rounded-xl">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-7 w-12 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </section>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <OrganizationCardSkeleton key={i} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function OrganizationCardSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 bg-bg-card border border-border rounded-xl">
      <Skeleton className="w-11 h-11 rounded-xl" />
      <div className="flex-1">
        <Skeleton className="h-5 w-32 mb-2" />
        <Skeleton className="h-5 w-16 rounded-md" />
      </div>
    </div>
  );
}
