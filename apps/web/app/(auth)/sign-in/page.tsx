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
    <div className="w-full max-w-sm animate-fadeInUp">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <img src="/logo.png" alt="ScoreForge" className="w-10 h-10 object-contain" />
          <span className="font-display text-lg font-semibold tracking-tight">ScoreForge</span>
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text-primary mb-2">
          Welcome back
        </h1>
        <p className="text-sm text-text-secondary">
          Sign in to your account to continue
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Enter your password"
            className="input-field"
          />
        </div>

        {error && (
          <div className="flex items-start gap-3 p-3 text-sm text-error bg-error/10 border border-error/20 rounded-lg">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center py-3 px-4 text-sm font-semibold text-text-inverse bg-accent rounded-lg hover:bg-accent-bright transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-text-secondary">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="font-medium text-accent hover:text-accent-bright transition-colors">
          Create one
        </Link>
      </p>
    </div>
  );
}
