"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage(): React.ReactNode {
  return <AuthenticateWithRedirectCallback />;
}
