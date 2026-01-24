"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/convex";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const onboardingState = useQuery(api.users.getOnboardingState);
  const createOrganization = useMutation(api.organizations.createOrganization);

  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (onboardingState === undefined) return;
    if (onboardingState === null) {
      // Not authenticated, redirect to sign-in
      router.push("/sign-in");
      return;
    }

    // Determine where to redirect
    if (onboardingState.organizationCount > 0) {
      // User already has organizations
      if (onboardingState.organizationCount === 1) {
        // Single org - go directly to that org's dashboard
        router.push(`/organizations/${onboardingState.organizations[0]?.slug}`);
      } else {
        // Multiple orgs - go to dashboard to select
        router.push("/dashboard");
      }
    }
  }, [onboardingState, router]);

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      setError("Please enter an organization name");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await createOrganization({
        name: orgName.trim(),
        description: orgDescription.trim() || undefined,
      });
      // Refresh onboarding state to get the new org slug
      // The useEffect will handle the redirect
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create organization");
      setLoading(false);
    }
  };

  if (onboardingState === undefined) {
    return <LoadingScreen />;
  }

  // User has no organizations - show create org form
  if (onboardingState && onboardingState.organizationCount === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        {/* Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent/10 blur-[120px] rounded-full" />
          <div className="absolute inset-0 grid-bg opacity-50" />
        </div>

        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 text-3xl bg-accent/10 border border-accent/30 rounded-2xl mb-4">
              ⬡
            </div>
            <h1 className="font-display text-3xl font-bold tracking-wide text-text-primary mb-2">
              CREATE YOUR ORGANIZATION
            </h1>
            <p className="text-text-secondary">
              Set up your first organization to start managing tournaments
            </p>
          </div>

          <form onSubmit={handleCreateOrganization} className="space-y-6">
            <div className="p-6 bg-bg-card border border-border rounded-2xl space-y-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="orgName"
                  className="text-sm font-medium text-text-secondary"
                >
                  Organization Name <span className="text-red">*</span>
                </label>
                <input
                  id="orgName"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g., Downtown Sports League"
                  required
                  className="px-4 py-3 text-base text-text-primary bg-bg-elevated border border-border rounded-lg placeholder:text-text-muted focus:outline-none focus:border-accent focus:bg-bg-secondary transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="orgDescription"
                  className="text-sm font-medium text-text-secondary"
                >
                  Description <span className="text-text-muted">(optional)</span>
                </label>
                <textarea
                  id="orgDescription"
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
                  placeholder="Tell us about your organization..."
                  rows={3}
                  className="px-4 py-3 text-base text-text-primary bg-bg-elevated border border-border rounded-lg placeholder:text-text-muted focus:outline-none focus:border-accent focus:bg-bg-secondary transition-all resize-none"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red bg-red/10 border border-red/20 rounded-lg">
                <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red rounded-full flex-shrink-0">
                  !
                </span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !orgName.trim()}
              className="w-full flex items-center justify-center px-6 py-4 font-display text-sm font-semibold tracking-widest uppercase text-bg-void bg-accent rounded-xl hover:bg-accent-bright hover:-translate-y-0.5 hover:shadow-glow transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-transparent border-t-current rounded-full animate-spin" />
              ) : (
                "Create Organization"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <LoadingScreen />;
}

function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-bg-void z-50">
      <div className="text-6xl text-accent animate-float drop-shadow-[0_0_30px_var(--accent-glow)]">
        ⚡
      </div>
      <div className="font-display text-3xl font-bold tracking-widest text-text-primary mt-4">
        SCOREFORGE
      </div>
      <p className="text-text-secondary mt-2">Setting up your account...</p>
    </div>
  );
}
