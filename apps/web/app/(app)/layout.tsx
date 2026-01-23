"use client";

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Navigation } from "../components/Navigation";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-void">
      <Navigation />

      <AuthLoading>
        <div className="flex items-center justify-center min-h-screen bg-bg-void">
          <div className="flex flex-col items-center gap-6 animate-fadeIn">
            <div className="text-5xl text-accent animate-float drop-shadow-[0_0_20px_var(--accent-glow)]">
              ⚡
            </div>
            <div className="font-display text-3xl font-bold tracking-widest text-text-primary">
              SCOREFORGE
            </div>
            <div className="w-[200px] h-[3px] bg-bg-card rounded overflow-hidden">
              <div className="w-[30%] h-full bg-gradient-to-r from-accent to-gold rounded animate-shimmer" />
            </div>
          </div>
        </div>
      </AuthLoading>

      <Unauthenticated>
        <RedirectToSignIn />
      </Unauthenticated>

      <Authenticated>
        <main className="pt-[var(--nav-height)] min-h-screen">
          {children}
        </main>
      </Authenticated>
    </div>
  );
}

function RedirectToSignIn() {
  const router = useRouter();

  useEffect(() => {
    router.push("/sign-in");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-void">
      <div className="flex flex-col items-center gap-6">
        <div className="font-display text-lg tracking-wide text-text-primary">
          Redirecting...
        </div>
      </div>
    </div>
  );
}
