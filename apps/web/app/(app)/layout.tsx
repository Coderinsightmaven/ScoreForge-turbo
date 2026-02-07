"use client";

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";
import { Navigation } from "../components/Navigation";
import { ErrorBoundary } from "../components/ErrorBoundary";

export default function AppLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <div className="min-h-screen">
      <Navigation />

      <AuthLoading>
        <LoadingScreen />
      </AuthLoading>

      <Unauthenticated>
        <RedirectToSignIn />
      </Unauthenticated>

      <Authenticated>
        <main className="min-h-screen pb-10 pt-[calc(var(--nav-height)+2.1rem)]">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </Authenticated>
    </div>
  );
}

function LoadingScreen(): React.JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md">
      <div className="surface-panel section-shell flex flex-col items-center gap-4 rounded-2xl px-8 py-9">
        <Image
          src="/logo.png"
          alt="ScoreForge"
          width={64}
          height={64}
          className="h-14 w-14 object-contain"
        />
        <div className="space-y-1 text-center">
          <p className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-foreground">
            Loading workspace
          </p>
          <p className="text-sm text-muted-foreground">Syncing tournaments and permissions</p>
        </div>
      </div>
    </div>
  );
}

function RedirectToSignIn(): React.ReactNode {
  const router = useRouter();

  useEffect(() => {
    router.push("/sign-in");
  }, [router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md">
      <Image
        src="/logo.png"
        alt="ScoreForge"
        width={64}
        height={64}
        className="h-14 w-14 object-contain"
      />
    </div>
  );
}
