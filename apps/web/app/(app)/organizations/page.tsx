"use client";

import { useQuery } from "convex/react";
import { api } from "@repo/convex";
import Link from "next/link";
import { Skeleton } from "@/app/components/Skeleton";

export default function OrganizationsPage() {
  const organizations = useQuery(api.organizations.listMyOrganizations);

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="max-w-[var(--content-max)] mx-auto">
        {/* Header */}
        <header className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary mb-2">
              Organizations
            </h1>
            <p className="text-text-secondary">
              Manage your sports organizations, leagues, and clubs
            </p>
          </div>
          <Link
            href="/organizations/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-text-inverse bg-accent rounded-lg hover:bg-accent-bright transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New organization
          </Link>
        </header>

        {/* Content */}
        {!organizations ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <OrganizationCardSkeleton key={i} />
            ))}
          </div>
        ) : organizations.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {organizations.map((org, index) => (
              <OrganizationCard key={org._id} organization={org} index={index} />
            ))}
          </div>
        )}
      </div>
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
      style={{ animationDelay: `${index * 0.03}s` }}
    >
      <div className="w-12 h-12 rounded-xl bg-bg-elevated border border-border flex items-center justify-center text-xl font-display font-semibold text-accent overflow-hidden">
        {organization.image ? (
          <img src={organization.image} alt={organization.name} className="w-full h-full object-cover" />
        ) : (
          organization.name.charAt(0).toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-text-primary truncate group-hover:text-accent transition-colors">
          {organization.name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-md ${roleStyles[organization.role] || "text-text-muted bg-bg-elevated"}`}>
            {organization.role}
          </span>
          <span className="text-xs text-text-muted">/{organization.slug}</span>
        </div>
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 flex items-center justify-center bg-bg-card rounded-2xl mb-4">
        <svg className="w-7 h-7 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
      </div>
      <h2 className="font-display text-xl font-medium text-text-primary mb-2">
        No organizations yet
      </h2>
      <p className="text-text-secondary mb-6 max-w-sm">
        Create your first organization to start managing tournaments, teams, and competitions.
      </p>
      <Link
        href="/organizations/new"
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-text-inverse bg-accent rounded-lg hover:bg-accent-bright transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Create organization
      </Link>
    </div>
  );
}

function OrganizationCardSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 bg-bg-card border border-border rounded-xl">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="flex-1">
        <Skeleton className="h-5 w-36 mb-2" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-14 rounded-md" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}
