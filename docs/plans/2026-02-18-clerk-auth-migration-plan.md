# Clerk Auth Migration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace `@convex-dev/auth` with Clerk across the Convex backend, Next.js web app, and Expo mobile app.

**Architecture:** Clerk handles all authentication externally. A webhook syncs user data into the Convex `users` table. All Convex functions use a `getCurrentUser(ctx)` helper that maps Clerk's `identity.subject` to a Convex user doc via an `externalId` index. Client apps use `ClerkProvider` + `ConvexProviderWithClerk` instead of `ConvexAuthProvider`.

**Tech Stack:** Clerk (`@clerk/nextjs`, `@clerk/clerk-expo`), Convex (`convex/react-clerk`), svix (webhook verification)

**Design doc:** `docs/plans/2026-02-18-clerk-auth-migration-design.md`

---

## Task 1: Install packages

**Files:**

- Modify: `packages/convex/package.json`
- Modify: `apps/web/package.json`
- Modify: `apps/mobile/package.json`

**Step 1: Install new packages and remove old ones**

```bash
# From repo root
cd packages/convex && bun add svix && bun remove @convex-dev/auth
cd ../../apps/web && bun add @clerk/nextjs && bun remove @convex-dev/auth
cd ../mobile && bun add @clerk/clerk-expo && bun remove @convex-dev/auth
cd ../.. && bun install
```

**Step 2: Verify lockfile updated**

Run: `git diff --stat`
Expected: Changes in `package.json` files and `bun.lock`

**Step 3: Commit**

```bash
git add packages/convex/package.json apps/web/package.json apps/mobile/package.json bun.lock
git commit -m "chore: swap @convex-dev/auth for Clerk and svix packages"
```

---

## Task 2: Update Convex auth config

**Files:**

- Modify: `packages/convex/convex/auth.config.ts`

**Step 1: Replace auth config**

Replace the entire file contents. Change `process.env.CONVEX_SITE_URL` to `process.env.CLERK_JWT_ISSUER_DOMAIN`:

```typescript
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
```

**Step 2: Commit**

```bash
git add packages/convex/convex/auth.config.ts
git commit -m "feat: point Convex auth config to Clerk JWT issuer"
```

---

## Task 3: Update schema — remove authTables, add externalId

**Files:**

- Modify: `packages/convex/convex/schema.ts:1-4` (imports)
- Modify: `packages/convex/convex/schema.ts:143-149` (users table)

**Step 1: Remove authTables import**

Line 2 — delete:

```typescript
import { authTables } from "@convex-dev/auth/server";
```

**Step 2: Replace users table definition**

Lines 143-149 — replace:

```typescript
// Before
export default defineSchema({
  ...authTables,

  // Override users table from authTables to add search index
  users: authTables.users
    .searchIndex("search_name", { searchField: "name", filterFields: [] })
    .searchIndex("search_email", { searchField: "email", filterFields: [] }),
```

```typescript
// After
export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    externalId: v.string(),
  })
    .index("by_externalId", ["externalId"])
    .searchIndex("search_name", { searchField: "name", filterFields: [] })
    .searchIndex("search_email", { searchField: "email", filterFields: [] }),
```

**Step 3: Commit**

```bash
git add packages/convex/convex/schema.ts
git commit -m "feat: replace authTables with Clerk-compatible users table"
```

---

## Task 4: Add getCurrentUser helper to users.ts

**Files:**

- Modify: `packages/convex/convex/users.ts`

**Step 1: Add auth helper functions**

Add these exports at the top of the file, after the existing imports (after line 7). These will be used by all 12 function files:

```typescript
import type { QueryCtx } from "./_generated/server";

/**
 * Get the current authenticated user from Clerk identity.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_externalId", (q) => q.eq("externalId", identity.subject))
    .unique();
}

/**
 * Get the current authenticated user or throw.
 * Use in mutations/queries that require authentication.
 */
export async function getCurrentUserOrThrow(ctx: QueryCtx) {
  const user = await getCurrentUser(ctx);
  if (!user) throw new Error("Not authenticated");
  return user;
}
```

**Step 2: Commit**

```bash
git add packages/convex/convex/users.ts
git commit -m "feat: add getCurrentUser helper for Clerk auth"
```

---

## Task 5: Add Clerk webhook endpoint and user sync mutations

**Files:**

- Modify: `packages/convex/convex/http.ts`
- Modify: `packages/convex/convex/users.ts`

**Step 1: Add webhook mutations to users.ts**

Add `internalMutation` import and two new mutations at the bottom of `users.ts`:

```typescript
import { internalMutation } from "./_generated/server";

export const upsertFromClerk = internalMutation({
  args: { data: v.any() },
  returns: v.null(),
  handler: async (ctx, { data }) => {
    const attrs = {
      name: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() || "Anonymous",
      email: data.email_addresses?.[0]?.email_address ?? "",
      externalId: data.id as string,
    };
    const existing = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", attrs.externalId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, attrs);
    } else {
      await ctx.db.insert("users", attrs);
    }
    return null;
  },
});

export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  returns: v.null(),
  handler: async (ctx, { clerkUserId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", clerkUserId))
      .unique();
    if (user) {
      await ctx.db.delete(user._id);
    }
    return null;
  },
});
```

**Step 2: Replace http.ts with webhook endpoint**

Replace the entire file. Remove the `auth` import and `auth.addHttpRoutes(http)`. Add the Clerk webhook route:

```typescript
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { getMatch, listMatches, listTournaments, listBrackets } from "./httpApi";
import { Webhook } from "svix";

const http = httpRouter();

// Clerk webhook for user sync
http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");
    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    const body = await request.text();
    const wh = new Webhook(webhookSecret);
    let event: { type: string; data: Record<string, unknown> };
    try {
      event = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as typeof event;
    } catch {
      return new Response("Invalid webhook signature", { status: 400 });
    }

    switch (event.type) {
      case "user.created":
      case "user.updated":
        await ctx.runMutation(internal.users.upsertFromClerk, {
          data: event.data,
        });
        break;
      case "user.deleted":
        if (typeof event.data.id === "string") {
          await ctx.runMutation(internal.users.deleteFromClerk, {
            clerkUserId: event.data.id,
          });
        }
        break;
    }

    return new Response(null, { status: 200 });
  }),
});

// Public API routes for external access (e.g., desktop scoreboard app)
http.route({
  path: "/api/public/match",
  method: "GET",
  handler: getMatch,
});
http.route({
  path: "/api/public/match",
  method: "OPTIONS",
  handler: getMatch,
});

http.route({
  path: "/api/public/matches",
  method: "GET",
  handler: listMatches,
});
http.route({
  path: "/api/public/matches",
  method: "OPTIONS",
  handler: listMatches,
});

http.route({
  path: "/api/public/tournaments",
  method: "GET",
  handler: listTournaments,
});
http.route({
  path: "/api/public/tournaments",
  method: "OPTIONS",
  handler: listTournaments,
});

http.route({
  path: "/api/public/brackets",
  method: "GET",
  handler: listBrackets,
});
http.route({
  path: "/api/public/brackets",
  method: "OPTIONS",
  handler: listBrackets,
});

export default http;
```

**Step 3: Commit**

```bash
git add packages/convex/convex/http.ts packages/convex/convex/users.ts
git commit -m "feat: add Clerk webhook endpoint and user sync mutations"
```

---

## Task 6: Delete auth.ts

**Files:**

- Delete: `packages/convex/convex/auth.ts`

**Step 1: Delete the file**

```bash
rm packages/convex/convex/auth.ts
```

**Step 2: Commit**

```bash
git add packages/convex/convex/auth.ts
git commit -m "chore: remove @convex-dev/auth setup file"
```

---

## Task 7: Migrate users.ts — replace getAuthUserId calls

**Files:**

- Modify: `packages/convex/convex/users.ts`

**Step 1: Remove getAuthUserId import**

Line 1 — delete:

```typescript
import { getAuthUserId } from "@convex-dev/auth/server";
```

**Step 2: Update currentUser query**

The `currentUser` query (line 9) currently calls `getAuthUserId(ctx)` and then `ctx.db.get(userId)`. Replace the handler to use `getCurrentUser`:

```typescript
export const currentUser = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      image: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});
```

Note: Remove `emailVerificationTime` and `isAnonymous` from the return validator — these were `authTables` fields that no longer exist.

**Step 3: Update all other functions in users.ts**

Replace every `const userId = await getAuthUserId(ctx);` with:

```typescript
const user = await getCurrentUserOrThrow(ctx);
const userId = user._id;
```

For functions that check `if (userId === null)`, replace with:

```typescript
const user = await getCurrentUser(ctx);
if (!user) {
  return null; // or throw
}
const userId = user._id;
```

Apply to: `updateProfile` (line 40), `getOnboardingState` (line 80), `getThemePreference` (line 127), `setThemePreference` (line 150), `deleteAccount` (line 186).

**Step 4: Update deleteAccount — remove authSessions/authAccounts cleanup**

Lines 324-341 in `deleteAccount` delete from `authSessions` and `authAccounts` tables. Remove this entire block — Clerk manages sessions externally and these tables no longer exist.

**Step 5: Commit**

```bash
git add packages/convex/convex/users.ts
git commit -m "feat: migrate users.ts from getAuthUserId to getCurrentUser"
```

---

## Task 8: Migrate remaining Convex function files (11 files)

**Files:**

- Modify: `packages/convex/convex/tournaments.ts`
- Modify: `packages/convex/convex/tournamentScorers.ts`
- Modify: `packages/convex/convex/tournamentBrackets.ts`
- Modify: `packages/convex/convex/tournamentParticipants.ts`
- Modify: `packages/convex/convex/matches.ts`
- Modify: `packages/convex/convex/tennis.ts`
- Modify: `packages/convex/convex/scoringLogs.ts`
- Modify: `packages/convex/convex/siteAdmin.ts`
- Modify: `packages/convex/convex/apiKeys.ts`
- Modify: `packages/convex/convex/reports.ts`
- Modify: `packages/convex/convex/temporaryScorers.ts`

**Step 1: For each file, apply the same pattern**

In every file:

1. **Replace the import** (always line 1):

   ```typescript
   // Delete
   import { getAuthUserId } from "@convex-dev/auth/server";
   // Add
   import { getCurrentUser, getCurrentUserOrThrow } from "./users";
   ```

2. **Replace every `getAuthUserId(ctx)` call.** There are two patterns:

   Pattern A — throws on null (most common):

   ```typescript
   // Before
   const userId = await getAuthUserId(ctx);
   if (userId === null) throw errors.unauthenticated();

   // After
   const user = await getCurrentUserOrThrow(ctx);
   const userId = user._id;
   ```

   Pattern B — returns null on unauthenticated:

   ```typescript
   // Before
   const userId = await getAuthUserId(ctx);
   if (userId === null) return null;

   // After
   const user = await getCurrentUser(ctx);
   if (!user) return null;
   const userId = user._id;
   ```

**Call counts per file:**

- `tournaments.ts`: 12 calls
- `tournamentScorers.ts`: 5 calls
- `tournamentBrackets.ts`: 9 calls
- `tournamentParticipants.ts`: 8 calls
- `matches.ts`: 9 calls
- `tennis.ts`: 5 calls
- `scoringLogs.ts`: 2 calls
- `siteAdmin.ts`: 12 calls (some use `currentUserId`)
- `apiKeys.ts`: 5 calls
- `reports.ts`: 2 calls
- `temporaryScorers.ts`: 8 calls

**Step 2: Verify no remaining references**

Run: `grep -r "getAuthUserId" packages/convex/convex/`
Expected: No matches

Run: `grep -r "@convex-dev/auth" packages/convex/`
Expected: No matches (except possibly package.json if not yet cleaned)

**Step 3: Commit**

```bash
git add packages/convex/convex/
git commit -m "feat: migrate all Convex functions from getAuthUserId to getCurrentUser"
```

---

## Task 9: Migrate web app providers

**Files:**

- Modify: `apps/web/app/providers.tsx`
- Create: `apps/web/middleware.ts`

**Step 1: Replace providers.tsx**

Replace `ConvexAuthProvider` with `ClerkProvider` + `ConvexProviderWithClerk`:

```typescript
"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import { ThemeSyncProvider } from "./components/ThemeSyncProvider";
import { ScoreCommandOnboarding } from "./components/ScoreCommandOnboarding";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: ReactNode }): ReactNode {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <ThemeSyncProvider>
            <ScoreCommandOnboarding>{children}</ScoreCommandOnboarding>
            <Toaster
              richColors
              closeButton
              position="top-right"
              toastOptions={{
                duration: 4000,
              }}
            />
          </ThemeSyncProvider>
        </ThemeProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
```

**Step 2: Create middleware.ts**

Create `apps/web/middleware.ts`:

```typescript
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

**Step 3: Commit**

```bash
git add apps/web/app/providers.tsx apps/web/middleware.ts
git commit -m "feat: replace ConvexAuthProvider with ClerkProvider on web"
```

---

## Task 10: Migrate web sign-in page

**Files:**

- Modify: `apps/web/app/(auth)/sign-in/page.tsx`

**Step 1: Replace auth import and hook**

```typescript
// Delete
import { useAuthActions } from "@convex-dev/auth/react";

// Add
import { useSignIn } from "@clerk/nextjs";
```

Replace:

```typescript
// Delete
const { signIn } = useAuthActions();

// Add
const { signIn, setActive, isLoaded } = useSignIn();
```

**Step 2: Replace form submission handler**

The current handler builds a `FormData` and calls `signIn("password", formData)`. Replace with:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!isLoaded) return;
  setIsLoading(true);

  try {
    const result = await signIn.create({
      identifier: email,
      password,
    });

    if (result.status === "complete") {
      await setActive({ session: result.createdSessionId });
    }
  } catch (err: unknown) {
    // Clerk errors have a `errors` array with `message` fields
    if (err && typeof err === "object" && "errors" in err) {
      const clerkErr = err as { errors: Array<{ message: string }> };
      setError(clerkErr.errors[0]?.message ?? "Sign in failed");
    } else {
      setError("Something went wrong. Please try again.");
    }
  } finally {
    setIsLoading(false);
  }
};
```

**Step 3: Commit**

```bash
git add apps/web/app/(auth)/sign-in/page.tsx
git commit -m "feat: wire web sign-in page to Clerk useSignIn"
```

---

## Task 11: Migrate web sign-up page

**Files:**

- Modify: `apps/web/app/(auth)/sign-up/page.tsx`

**Step 1: Replace auth import and hook**

```typescript
// Delete
import { useAuthActions } from "@convex-dev/auth/react";

// Add
import { useSignUp } from "@clerk/nextjs";
```

Replace:

```typescript
// Delete
const { signIn } = useAuthActions();

// Add
const { signUp, setActive, isLoaded } = useSignUp();
```

**Step 2: Replace form submission handler**

Replace the current `signIn("password", formData)` call with:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!isLoaded) return;
  setIsLoading(true);

  try {
    const result = await signUp.create({
      emailAddress: email,
      password,
      firstName,
      lastName,
    });

    if (result.status === "complete") {
      await setActive({ session: result.createdSessionId });
    }
  } catch (err: unknown) {
    if (err && typeof err === "object" && "errors" in err) {
      const clerkErr = err as { errors: Array<{ message: string }> };
      setError(clerkErr.errors[0]?.message ?? "Sign up failed");
    } else {
      setError("Something went wrong. Please try again.");
    }
  } finally {
    setIsLoading(false);
  }
};
```

**Step 3: Handle registration restriction**

The current `allowPublicRegistration` check happens server-side in the Convex `createOrUpdateUser` callback. Move this check client-side — the sign-up page already queries `api.siteAdmin.getRegistrationStatus`. Keep that check and show the disabled message before the user can submit. No new code needed if the existing check is already there.

**Step 4: Commit**

```bash
git add apps/web/app/(auth)/sign-up/page.tsx
git commit -m "feat: wire web sign-up page to Clerk useSignUp"
```

---

## Task 12: Migrate web Navigation and Settings — replace signOut

**Files:**

- Modify: `apps/web/app/components/Navigation.tsx`
- Modify: `apps/web/app/(app)/settings/page.tsx`

**Step 1: Update Navigation.tsx**

```typescript
// Delete (line 6)
import { useAuthActions } from "@convex-dev/auth/react";

// Add
import { useClerk } from "@clerk/nextjs";

// Delete (line 58)
const { signOut } = useAuthActions();

// Add
const { signOut } = useClerk();
```

The three `signOut()` calls at lines 203, 228, 362 stay the same — the function signature is compatible.

**Step 2: Update settings/page.tsx**

```typescript
// Delete (line 5)
import { useAuthActions } from "@convex-dev/auth/react";

// Add
import { useClerk } from "@clerk/nextjs";

// Delete (line 31)
const { signOut } = useAuthActions();

// Add
const { signOut } = useClerk();
```

The `signOut()` calls at lines 57 and 70 stay the same.

**Step 3: Commit**

```bash
git add apps/web/app/components/Navigation.tsx apps/web/app/(app)/settings/page.tsx
git commit -m "feat: replace useAuthActions with useClerk for sign-out on web"
```

---

## Task 13: Migrate mobile ConvexProvider

**Files:**

- Modify: `apps/mobile/providers/ConvexProvider.tsx`

**Step 1: Replace the entire provider file**

```typescript
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

const tokenCache = {
  async getToken(key: string) {
    return await SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    await SecureStore.setItemAsync(key, value);
  },
  async clearToken(key: string) {
    await SecureStore.deleteItemAsync(key);
  },
};

export function ConvexProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
```

**Step 2: Commit**

```bash
git add apps/mobile/providers/ConvexProvider.tsx
git commit -m "feat: replace ConvexAuthProvider with ClerkProvider on mobile"
```

---

## Task 14: Migrate mobile sign-in screen

**Files:**

- Modify: `apps/mobile/app/(auth)/sign-in.tsx`

**Step 1: Replace auth import and hook for regular login**

```typescript
// Delete (line 1)
import { useAuthActions } from "@convex-dev/auth/react";

// Add
import { useSignIn } from "@clerk/clerk-expo";
```

Replace the hook usage:

```typescript
// Delete
const { signIn } = useAuthActions();

// Add
const { signIn: clerkSignIn, setActive, isLoaded } = useSignIn();
```

**Step 2: Replace regular login handler**

Replace the `signIn("password", { email, password, flow: "signIn" })` call:

```typescript
const handleRegularSubmit = async () => {
  if (!isLoaded) return;
  setIsLoading(true);
  try {
    const result = await clerkSignIn.create({
      identifier: email,
      password,
    });
    if (result.status === "complete") {
      await setActive({ session: result.createdSessionId });
    }
  } catch (err: unknown) {
    if (err && typeof err === "object" && "errors" in err) {
      const clerkErr = err as { errors: Array<{ message: string }> };
      setError(clerkErr.errors[0]?.message ?? "Sign in failed");
    } else {
      setError("Something went wrong. Please try again.");
    }
  } finally {
    setIsLoading(false);
  }
};
```

**Important:** The temporary scorer login handler stays completely untouched. It still uses `useMutation(api.temporaryScorers.signIn)`.

**Step 3: Commit**

```bash
git add apps/mobile/app/(auth)/sign-in.tsx
git commit -m "feat: wire mobile sign-in to Clerk useSignIn"
```

---

## Task 15: Migrate mobile settings and NavSheet — replace signOut

**Files:**

- Modify: `apps/mobile/app/(app)/settings.tsx`
- Modify: `apps/mobile/components/navigation/NavSheet.tsx`

**Step 1: Update settings.tsx**

```typescript
// Delete (line 1)
import { useAuthActions } from "@convex-dev/auth/react";

// Add
import { useClerk } from "@clerk/clerk-expo";

// Delete (line 20)
const { signOut } = useAuthActions();

// Add
const { signOut } = useClerk();
```

The `signOut()` calls at lines 57 and 74 stay the same.

**Step 2: Update NavSheet.tsx**

```typescript
// Delete (line 6)
import { useAuthActions } from "@convex-dev/auth/react";

// Add
import { useClerk } from "@clerk/clerk-expo";

// Delete (line 59)
const { signOut } = useAuthActions();

// Add
const { signOut } = useClerk();
```

The `signOut()` call at line 117 stays the same.

**Step 3: Commit**

```bash
git add apps/mobile/app/(app)/settings.tsx apps/mobile/components/navigation/NavSheet.tsx
git commit -m "feat: replace useAuthActions with useClerk for sign-out on mobile"
```

---

## Task 16: Verify no remaining @convex-dev/auth references

**Step 1: Search for leftover imports**

Run: `grep -r "@convex-dev/auth" --include="*.ts" --include="*.tsx" .`
Expected: No matches

Run: `grep -r "getAuthUserId" --include="*.ts" --include="*.tsx" .`
Expected: No matches

Run: `grep -r "useAuthActions" --include="*.ts" --include="*.tsx" .`
Expected: No matches

Run: `grep -r "ConvexAuthProvider" --include="*.ts" --include="*.tsx" .`
Expected: No matches

**Step 2: Check type errors**

Run: `bun run check-types`
Expected: No new type errors related to auth

**Step 3: Check lint**

Run: `bun run lint`
Expected: No new lint errors (pre-existing ones are fine per MEMORY.md)

---

## Task 17: Set up environment variables

**Step 1: Add Convex env vars**

In the Convex dashboard for your deployment, set:

- `CLERK_JWT_ISSUER_DOMAIN` = your Clerk issuer domain (e.g., `https://verb-noun-00.clerk.accounts.dev`)
- `CLERK_WEBHOOK_SECRET` = the signing secret from your Clerk webhook endpoint

**Step 2: Add web env vars**

In `apps/web/.env.local`:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**Step 3: Add mobile env vars**

In `apps/mobile/.env`:

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

**Step 4: Set up Clerk dashboard**

1. Create a JWT template named exactly `"convex"`
2. Create a webhook endpoint: `https://<your-deployment>.convex.site/clerk-users-webhook`
3. Subscribe to events: `user.created`, `user.updated`, `user.deleted`
4. Configure email + password as the sign-in method

---

## Task 18: Smoke test

**Step 1: Start the dev server**

Run: `bun run dev`
Expected: Convex, web, and mobile all start without errors

**Step 2: Test web sign-up**

1. Navigate to `/sign-up`
2. Create a new account
3. Verify redirect to dashboard
4. Check Convex dashboard — user should appear in `users` table with `externalId`

**Step 3: Test web sign-in / sign-out**

1. Sign out from navigation
2. Sign in with the same credentials
3. Verify dashboard loads with correct user

**Step 4: Test mobile sign-in**

1. Open mobile app
2. Sign in with account credentials
3. Verify dashboard loads

**Step 5: Test temporary scorer (mobile)**

1. Sign in with tournament code + PIN
2. Verify scorer dashboard loads — this should be unchanged

**Step 6: Commit any fixes and final commit**

```bash
git add -A
git commit -m "feat: complete Clerk auth migration"
```
