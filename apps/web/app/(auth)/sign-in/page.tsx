"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import Link from "next/link";

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("flow", "signIn");

    try {
      await signIn("password", formData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      // Map common auth errors to user-friendly messages
      if (message.includes("InvalidSecret") ||
          message.toLowerCase().includes("invalid") ||
          message.toLowerCase().includes("incorrect") ||
          message.toLowerCase().includes("credentials") ||
          message.toLowerCase().includes("password")) {
        setError("Invalid email or password. Please try again.");
      } else if (message.includes("InvalidAccountId") ||
                 message.toLowerCase().includes("not found") ||
                 message.toLowerCase().includes("no user") ||
                 message.toLowerCase().includes("does not exist")) {
        setError("No account found with this email address.");
      } else if (message.toLowerCase().includes("too many") ||
                 message.toLowerCase().includes("rate limit")) {
        setError("Too many attempts. Please wait a moment and try again.");
      } else {
        setError("Unable to sign in. Please check your credentials and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md p-8 bg-bg-card border border-border rounded-2xl overflow-hidden animate-scaleIn">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold tracking-wide text-text-primary mb-2">
          WELCOME BACK
        </h1>
        <p className="text-text-secondary">Sign in to manage your tournaments</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium text-text-secondary">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="px-4 py-3 text-base text-text-primary bg-bg-elevated border border-border rounded-lg placeholder:text-text-muted focus:outline-none focus:border-accent focus:bg-bg-secondary transition-all"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium text-text-secondary">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Enter your password"
            className="px-4 py-3 text-base text-text-primary bg-bg-elevated border border-border rounded-lg placeholder:text-text-muted focus:outline-none focus:border-accent focus:bg-bg-secondary transition-all"
          />
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
          disabled={loading}
          className="flex items-center justify-center mt-2 px-6 py-3 font-display text-sm font-semibold tracking-widest uppercase text-bg-void bg-accent rounded-lg min-h-[50px] hover:bg-accent-bright hover:-translate-y-0.5 hover:shadow-glow transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-transparent border-t-current rounded-full animate-spin" />
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-border text-center text-sm text-text-secondary">
        <p>
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="text-accent font-medium hover:text-accent-bright hover:underline transition-colors"
          >
            Create one
          </Link>
        </p>
      </div>

      {/* Decorative elements */}
      <div className="absolute -top-[100px] left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-[radial-gradient(ellipse_at_center,var(--accent-glow)_0%,transparent_70%)] opacity-30 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-accent via-gold to-accent" />
    </div>
  );
}
