"use client";

import Link from "next/link";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  BarChart3,
  LayoutGrid,
  Loader2,
  Monitor,
  ShieldCheck,
  Smartphone,
  Trophy,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Trophy,
    title: "Bracket-first workflow",
    description:
      "Create singles, doubles, and multi-bracket tournaments with clear progression and fast seeding.",
  },
  {
    icon: LayoutGrid,
    title: "Live scoring sync",
    description:
      "Scores, court updates, and match outcomes propagate instantly across scorer, dashboard, and display.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    description:
      "Owners, admins, scorers, and temporary scorers get exactly the tools and permissions they need.",
  },
  {
    icon: Smartphone,
    title: "Cross-device operation",
    description:
      "Tournament staff can manage events from desktop while scorers work from mobile without drift.",
  },
  {
    icon: Monitor,
    title: "Display mode ready",
    description:
      "Drive external scoreboard views with production-grade layouts and real-time event data.",
  },
  {
    icon: BarChart3,
    title: "Export and audit",
    description:
      "Download match logs and scoring reports when you need accountability or post-event analysis.",
  },
];

const stats = [
  { label: "Realtime updates", value: "< 1s" },
  { label: "Supported formats", value: "3" },
  { label: "Devices synced", value: "Web + Mobile" },
];

export default function LandingPage(): React.ReactNode {
  return (
    <div className="min-h-screen overflow-hidden pb-20">
      <AuthLoading>
        <LoadingScreen />
      </AuthLoading>

      <Authenticated>
        <LandingContent isAuthenticated />
      </Authenticated>

      <Unauthenticated>
        <LandingContent isAuthenticated={false} />
      </Unauthenticated>
    </div>
  );
}

function LoadingScreen(): React.JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 shadow-[var(--shadow-card)]">
        <Loader2 className="h-4 w-4 animate-spin text-brand" />
        <span className="text-sm font-semibold text-muted-foreground">Loading ScoreForge</span>
      </div>
    </div>
  );
}

function LandingContent({ isAuthenticated }: { isAuthenticated: boolean }): React.JSX.Element {
  return (
    <>
      <header className="container py-7">
        <div className="surface-panel flex items-center justify-between rounded-2xl border px-4 py-3 sm:px-6">
          <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand/30 bg-brand text-text-inverse shadow-[var(--shadow-glow)]">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
                ScoreForge
              </p>
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Tournament OS
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <Button variant="brand" asChild>
                <Link href="/dashboard">
                  Open Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button variant="brand" asChild>
                  <Link href="/sign-up">Create Account</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container space-y-10">
        <section className="surface-panel section-shell relative overflow-hidden rounded-[28px] border px-6 py-10 sm:px-10 sm:py-14">
          <div className="grid gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:items-end">
            <div className="space-y-7">
              <Badge variant="brand" className="px-3 py-1 text-[10px]">
                Realtime Competition Management
              </Badge>
              <div className="space-y-5">
                <h1 className="text-display max-w-2xl">
                  Run tournaments with the pace of live sport.
                </h1>
                <p className="max-w-xl text-body-lg text-muted-foreground">
                  ScoreForge combines scheduling, scoring, brackets, and role management into one
                  synchronized command center.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button variant="brand" size="lg" asChild>
                  <Link href={isAuthenticated ? "/dashboard" : "/sign-up"}>
                    {isAuthenticated ? "Go to Dashboard" : "Start for Free"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/brackets/quick">Try Quick Bracket</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {stats.map((stat) => (
                <Card key={stat.label} className="rounded-2xl border bg-card/90">
                  <CardContent className="space-y-1 p-5">
                    <p className="text-caption text-muted-foreground">{stat.label}</p>
                    <p className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-foreground">
                      {stat.value}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="animate-staggerIn rounded-2xl border bg-card/90"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <CardHeader className="space-y-3 pb-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand/25 bg-brand-light text-brand">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="surface-panel rounded-2xl border px-6 py-7 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <p className="text-caption text-muted-foreground">Built for organizers and scorers</p>
              <h2 className="text-title">One workflow from check-in to final point.</h2>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Keep operations clean under pressure with an interface designed around live matches,
                staff coordination, and broadcast-ready output.
              </p>
            </div>
            <Button variant="brand" asChild>
              <Link href={isAuthenticated ? "/dashboard" : "/sign-in"}>
                {isAuthenticated ? "Open Workspace" : "Sign In"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}
