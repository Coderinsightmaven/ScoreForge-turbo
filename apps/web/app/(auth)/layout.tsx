"use client";

import { Authenticated, AuthLoading, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { api } from "@repo/convex";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  const maintenanceStatus = useQuery(api.siteAdmin.getMaintenanceStatus);

  return (
    <div className="auth-ambient min-h-screen bg-background">
      <Dialog open={Boolean(maintenanceStatus?.maintenanceMode)}>
        <DialogContent showCloseButton={false} className="max-w-md p-0 overflow-hidden">
          <div className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning/15 text-warning">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="mb-2 text-center">Maintenance Mode</DialogTitle>
            <DialogDescription className="text-center">
              {maintenanceStatus?.maintenanceMessage ||
                "We’re performing maintenance. Some actions may be unavailable."}
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
      <AuthLoading>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M13 3L4 14h7v7l9-11h-7V3z" />
            </svg>
          </div>
        </div>
      </AuthLoading>

      <Authenticated>
        <RedirectToDashboard />
      </Authenticated>

      <div className="relative z-10">
        <ErrorBoundary>{children}</ErrorBoundary>
      </div>
    </div>
  );
}

function RedirectToDashboard(): React.ReactNode {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M13 3L4 14h7v7l9-11h-7V3z" />
        </svg>
      </div>
    </div>
  );
}
