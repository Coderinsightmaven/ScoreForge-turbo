"use client";

import { useMutation } from "convex/react";
import { api } from "@repo/convex";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewOrganizationPage() {
  const router = useRouter();
  const createOrganization = useMutation(api.organizations.createOrganization);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    try {
      await createOrganization({ name });
      router.push(`/organizations`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create organization");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 grid-bg opacity-50" />
      </div>

      <div className="w-full max-w-md">
        <Link
          href="/organizations"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-accent transition-colors mb-8"
        >
          <span>←</span> Back to Organizations
        </Link>

        <div className="relative bg-bg-card border border-border rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="text-center px-8 pt-10 pb-6">
            <div className="text-5xl mb-4 animate-float">⬡</div>
            <h1 className="font-display text-3xl tracking-wide text-text-primary mb-2">
              CREATE ORGANIZATION
            </h1>
            <p className="text-text-secondary">
              Set up a new organization to manage your tournaments and teams
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-10">
            <div className="mb-6">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Organization Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g., Downtown Basketball League"
                className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                autoFocus
              />
              <span className="block text-xs text-text-muted mt-2">
                This will be the public name of your organization
              </span>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 mb-6 bg-red/10 border border-red/30 rounded-lg text-sm text-red">
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-red rounded-full text-white text-xs font-bold">
                  !
                </span>
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Link
                href="/organizations"
                className="flex-1 px-4 py-3 text-center bg-bg-elevated border border-border rounded-lg text-text-secondary hover:text-text-primary hover:border-text-muted transition-all"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-accent text-text-inverse font-semibold rounded-lg hover:bg-accent-bright transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-text-inverse/30 border-t-text-inverse rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Organization</span>
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
