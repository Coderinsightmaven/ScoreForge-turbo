# Clerk Auth Migration Design

Migrate ScoreForge Turbo from `@convex-dev/auth` (email/password) to Clerk auth across the Convex backend, Next.js web app, and Expo mobile app.

---

## Decisions

- **User sync:** Webhooks (Clerk pushes `user.created`/`user.updated`/`user.deleted` to a Convex HTTP endpoint)
- **Auth UI:** Custom forms using Clerk's `useSignIn`/`useSignUp` hooks (keep existing Ink & Volt styled pages)
- **Temporary scorers:** Untouched — the PIN-based system is independent of main auth
- **Clerk account:** Already set up

---

## Convex Backend

### `auth.config.ts` — Replace provider

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

### `auth.ts` — Delete entirely

Remove the `convexAuth()` setup, Password provider, and `createOrUpdateUser` callback. Clerk handles all auth flow externally.

### `schema.ts` — Remove `authTables`, update `users` table

Remove the `authTables` spread from `@convex-dev/auth/server`. The `authSessions` and `authAccounts` tables are no longer needed.

Replace the `users` table definition:

```typescript
users: defineTable({
  name: v.string(),
  email: v.string(),
  image: v.optional(v.string()),
  externalId: v.string(), // Clerk user ID (e.g., "user_2x...")
})
  .index("by_externalId", ["externalId"])
  .searchIndex("search_name", { searchField: "name", filterFields: [] })
  .searchIndex("search_email", { searchField: "email", filterFields: [] }),
```

### `http.ts` — Remove auth routes, add webhook endpoint

Remove `auth.addHttpRoutes(http)`. Add:

```typescript
http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const event = await validateClerkWebhook(request); // svix verification
    switch (event.type) {
      case "user.created":
      case "user.updated":
        await ctx.runMutation(internal.users.upsertFromClerk, { data: event.data });
        break;
      case "user.deleted":
        await ctx.runMutation(internal.users.deleteFromClerk, { clerkUserId: event.data.id });
        break;
    }
    return new Response(null, { status: 200 });
  }),
});
```

### `users.ts` — Add webhook mutations and auth helper

```typescript
// Webhook mutations
export const upsertFromClerk = internalMutation({
  args: { data: v.any() },
  handler: async (ctx, { data }) => {
    const attrs = {
      name: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() || "Anonymous",
      email: data.email_addresses[0]?.email_address ?? "",
      externalId: data.id,
    };
    const existing = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", data.id))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, attrs);
    } else {
      await ctx.db.insert("users", attrs);
    }
  },
});

export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, { clerkUserId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", clerkUserId))
      .unique();
    if (user) await ctx.db.delete(user._id);
  },
});

// Auth helper — replaces getAuthUserId across all function files
export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_externalId", (q) => q.eq("externalId", identity.subject))
    .unique();
}

export async function getCurrentUserOrThrow(ctx: QueryCtx) {
  const user = await getCurrentUser(ctx);
  if (!user) throw new Error("Not authenticated");
  return user;
}
```

### All 12 function files — Replace `getAuthUserId`

Every file that imports `getAuthUserId` from `@convex-dev/auth/server` switches to the new helper:

```typescript
// Before
import { getAuthUserId } from "@convex-dev/auth/server";
const userId = await getAuthUserId(ctx);

// After
import { getCurrentUserOrThrow } from "./users";
const user = await getCurrentUserOrThrow(ctx);
const userId = user._id; // Same Id<"users"> as before
```

Affected files: `users.ts`, `tournaments.ts`, `tournamentScorers.ts`, `matches.ts`, `tennis.ts`, `tournamentBrackets.ts`, `tournamentParticipants.ts`, `scoringLogs.ts`, `siteAdmin.ts`, `apiKeys.ts`, `reports.ts`, `temporaryScorers.ts`.

---

## Web App (Next.js)

### `providers.tsx` — Replace auth provider

```typescript
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";

<ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
  <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
    {children}
  </ConvexProviderWithClerk>
</ClerkProvider>
```

### New `middleware.ts` at `apps/web/middleware.ts`

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

### Sign-in page — Rewire to Clerk hooks

```typescript
import { useSignIn } from "@clerk/nextjs";
const { signIn, setActive } = useSignIn();

const handleSubmit = async () => {
  const result = await signIn.create({ identifier: email, password });
  await setActive({ session: result.createdSessionId });
};
```

### Sign-up page — Rewire to Clerk hooks

```typescript
import { useSignUp } from "@clerk/nextjs";
const { signUp, setActive } = useSignUp();

const handleSubmit = async () => {
  const result = await signUp.create({
    emailAddress: email,
    password,
    firstName,
    lastName,
  });
  await setActive({ session: result.createdSessionId });
};
```

### Navigation + Settings — Replace sign-out

```typescript
import { useClerk } from "@clerk/nextjs";
const { signOut } = useClerk();
```

### No changes needed

- `Authenticated`, `Unauthenticated`, `AuthLoading` from `convex/react` stay as-is
- `(app)/layout.tsx` and `(auth)/layout.tsx` route guards unchanged
- All `useQuery`/`useMutation` calls unchanged

### Registration restriction

The `allowPublicRegistration` check currently in the Convex `createOrUpdateUser` callback moves to the sign-up page — check the setting client-side before calling `signUp.create()`, or configure restrictions in the Clerk dashboard.

---

## Mobile App (Expo)

### `ConvexProvider.tsx` — Replace auth provider

```typescript
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import * as SecureStore from "expo-secure-store";

const tokenCache = {
  async getToken(key: string) { return SecureStore.getItemAsync(key); },
  async saveToken(key: string, value: string) { await SecureStore.setItemAsync(key, value); },
  async clearToken(key: string) { await SecureStore.deleteItemAsync(key); },
};

<ClerkProvider
  publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
  tokenCache={tokenCache}
>
  <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
    {children}
  </ConvexProviderWithClerk>
</ClerkProvider>
```

### Sign-in screen — Rewire regular login to Clerk

```typescript
import { useSignIn } from "@clerk/clerk-expo";
const { signIn, setActive } = useSignIn();

const handleRegularSubmit = async () => {
  const result = await signIn.create({ identifier: email, password });
  await setActive({ session: result.createdSessionId });
};
```

Temporary scorer login stays untouched — still calls `useMutation(api.temporaryScorers.signIn)`.

### Settings + NavSheet — Replace sign-out

```typescript
import { useClerk } from "@clerk/clerk-expo";
const { signOut } = useClerk();
```

### No changes needed

- `Authenticated`/`Unauthenticated`/`AuthLoading` from `convex/react` stay as-is
- `_layout.tsx` route guards and temp scorer context unchanged
- All match scoring, tournament viewing, and real-time subscriptions unchanged

---

## Environment Variables

| Variable                            | Location                    | Source                                                       |
| ----------------------------------- | --------------------------- | ------------------------------------------------------------ |
| `CLERK_JWT_ISSUER_DOMAIN`           | Convex dashboard (env vars) | Clerk dashboard > JWT Templates > `convex` template > Issuer |
| `CLERK_WEBHOOK_SECRET`              | Convex dashboard (env vars) | Clerk dashboard > Webhooks > Signing Secret                  |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `apps/web/.env.local`       | Clerk dashboard > API Keys                                   |
| `CLERK_SECRET_KEY`                  | `apps/web/.env.local`       | Clerk dashboard > API Keys                                   |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | `apps/mobile/.env`          | Clerk dashboard > API Keys (same publishable key)            |

---

## Package Changes

| Action | Package             | Location                                           |
| ------ | ------------------- | -------------------------------------------------- |
| Remove | `@convex-dev/auth`  | `packages/convex`                                  |
| Remove | `@convex-dev/auth`  | `apps/web`                                         |
| Remove | `@convex-dev/auth`  | `apps/mobile`                                      |
| Add    | `svix`              | `packages/convex` (webhook signature verification) |
| Add    | `@clerk/nextjs`     | `apps/web`                                         |
| Add    | `@clerk/clerk-expo` | `apps/mobile`                                      |

---

## Clerk Dashboard Setup

1. **JWT Template** — Create a template named exactly `"convex"`. Copy the Issuer Domain.
2. **Webhook** — Create endpoint: `https://<convex-deployment>.convex.site/clerk-users-webhook`. Subscribe to `user.created`, `user.updated`, `user.deleted`. Copy the Signing Secret.
3. **Auth settings** — Configure allowed sign-in/sign-up methods (email + password at minimum).

---

## Existing User Migration

Two approaches:

### Option A: Fresh start

All users re-register through Clerk. Existing tournament data is orphaned or cleaned up. Simple but disruptive.

### Option B: Bulk import (recommended for production data)

1. Export existing users from Convex (`email`, `name`, hashed passwords)
2. Use Clerk's Backend API to create users with matching emails
3. Run a Convex migration to set `externalId` on each existing user doc by matching on email
4. Verify all users have `externalId` populated

### Cleanup

After migration, delete all documents in the now-unused `authSessions` and `authAccounts` tables, then remove them from the schema.

---

## What Stays Unchanged

- Temporary scorer auth system (code + PIN, 24-hour sessions, rate limiting)
- All `Authenticated`/`Unauthenticated`/`AuthLoading` components from `convex/react`
- All Convex queries, mutations, and subscriptions (only the auth helper changes)
- Tournament, bracket, match, participant, and scoring logic
- Public API endpoints and API key system
- Display app (uses API keys, not user auth)
- Site admin system (`siteAdmins` table)
- All real-time features
