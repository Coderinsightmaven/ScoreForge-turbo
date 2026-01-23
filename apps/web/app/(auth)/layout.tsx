"use client";

import Link from "next/link";
import { Authenticated, AuthLoading } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-bg-void relative">
      <AuthLoading>
        <div className="fixed inset-0 flex items-center justify-center bg-bg-void z-[100]">
          <div className="text-5xl text-accent animate-float drop-shadow-[0_0_20px_var(--accent-glow)]">
            ⚡
          </div>
        </div>
      </AuthLoading>

      <Authenticated>
        <RedirectToDashboard />
      </Authenticated>

      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[radial-gradient(ellipse_at_center,var(--accent-glow)_0%,transparent_60%)] opacity-30" />
        <div className="absolute inset-0 grid-bg opacity-50" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="text-3xl text-accent drop-shadow-[0_0_12px_var(--accent-glow)]">
            ⚡
          </span>
          <span className="font-display text-xl font-bold tracking-widest text-text-primary">
            SCOREFORGE
          </span>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center text-sm text-text-muted">
        <p>© {new Date().getFullYear()} ScoreForge. All rights reserved.</p>
      </footer>
    </div>
  );
}

function RedirectToDashboard() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-bg-void z-[100]">
      <div className="text-5xl text-accent animate-float drop-shadow-[0_0_20px_var(--accent-glow)]">
        ⚡
      </div>
    </div>
  );
}
