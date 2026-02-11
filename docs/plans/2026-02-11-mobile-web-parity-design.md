# Mobile-Web Parity Design

## Overview

Align the mobile app (Expo + NativeWind) with the web app design system and top-level navigation. The goal is visual parity plus comparable screens and IA, while keeping the mobile experience native and fast.

## Goals

- Match web brand, typography, surfaces, and component styling on mobile.
- Provide mobile-native navigation that mirrors web IA (Dashboard, Quick Bracket, Settings, Admin).
- Keep existing scorer flow and match scoring behavior while restyling.
- Preserve existing Convex data flows and permissions logic.

## Non-Goals

- Full feature parity for every web tool or admin screen detail.
- Desktop-style tables or bracket editor parity on mobile.
- Replacing Expo Router or major architectural refactors.
- Bottom tab navigation for top-level sections.

## Current State

- Mobile uses ClashDisplay + DMSans fonts and a blue brand palette.
- Web uses Lexend + Teko and a green brand palette with surface rail styling.
- Mobile navigation is mostly stack-based without top-level tabs.
- Some web-only screens exist (Quick Bracket, Admin, rich Settings).

## Proposed Approach

Recommended approach: mobile-native parity.

- Use a stack navigator with a slide-over navigation sheet (hamburger menu) for top-level IA.
- Align mobile tokens with web CSS variables.
- Update shared UI primitives to match web surfaces and typography.
- Add missing screens in mobile (Quick Bracket, Admin, richer Settings).

## Navigation Architecture

- Use a root stack for all screens.
- Add a persistent app header with a hamburger button that opens a navigation sheet.
- Keep detail routes (tournament, match, scoring) in the main stack.

Proposed routes:

- `apps/mobile/app/(app)/_layout.tsx` (Stack)
- `apps/mobile/app/(app)/dashboard.tsx`
- `apps/mobile/app/(app)/quick-bracket.tsx`
- `apps/mobile/app/(app)/settings.tsx`
- `apps/mobile/components/navigation/NavSheet.tsx`
- `apps/mobile/app/(app)/tournament/[id].tsx` (Stack)
- `apps/mobile/app/(app)/match/[id].tsx` (Stack)
- `apps/mobile/app/(app)/scoring/[id].tsx` (Stack)
- `apps/mobile/app/(app)/admin.tsx` (Stack, pushed from Settings if site admin)

Scorer stack remains in `apps/mobile/app/(scorer)` with styling parity updates.

## Design System Parity

### Tokens

Update `apps/mobile/tailwind.config.js` to mirror the web tokens defined in `apps/web/app/globals.css`:

- Brand: `--color-brand`, `--color-brand-hover`, `--color-brand-light`, `--color-brand-text`.
- Surfaces: `--color-bg-page`, `--color-bg-primary`, `--color-bg-secondary`, `--color-bg-card`.
- Text: `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`, `--color-text-inverse`.
- Status: success, warning, error, live.
- Borders and shadows: `--color-border`, `--shadow-card` equivalents.

Also update `apps/mobile/utils/theme.ts` to use the same background and placeholder values.

### Typography

- Add Lexend (sans) and Teko (display) to mobile assets.
- Update font family mappings in `apps/mobile/tailwind.config.js`.
- Add font size and letter spacing tokens to mirror web text styles (`text-hero`, `text-title`, `text-heading`, `text-caption`, `text-label`).

If font files are not available locally, add them as bundled assets or via `expo-google-fonts` packages.

### Primitives

Update shared UI components to use the new tokens and surface styling:

- `apps/mobile/components/ui/button.tsx`
- `apps/mobile/components/ui/card.tsx`
- `apps/mobile/components/ui/badge.tsx`
- `apps/mobile/components/ui/input.tsx`
- `apps/mobile/components/ui/label.tsx`
- `apps/mobile/components/ui/separator.tsx`

Add an optional surface rail treatment (accent bar) to match web `surface-panel-rail` styling.

## Screen Updates

### Dashboard

- Replace current list header with web-style hero block.
- Add stat cards for total tournaments, active, live matches, draft.
- Tournament cards adopt web styling (accent rail, status badges, live indicator).

### Tournament Detail

- Add a segmented control row (Bracket, Matches, Participants, Standings, Scorers).
- Keep Matches as primary; add a compact Participants list.
- Bracket view uses a mobile-optimized summary (round + match counts).

### Match Detail

- Match header and badges mirror web structure.
- Info section uses surface panels and consistent typography.
- Tennis scoring stays full-screen; non-tennis uses updated scoreboard styling.

### Quick Bracket (new)

- Mirror web flow: size + format, generate, edit slots.
- Mobile version supports share/export (optional) or view-only.
- No persistence; purely local state.

### Settings

- Match web sections (Profile, Account, Danger Zone).
- API keys section shows if feasible; otherwise link to web.

### Admin (new)

- Gate via `api.siteAdmin.checkIsSiteAdmin`.
- Segmented control: Users, Admins, Settings.
- Card-based lists instead of tables.

### Auth

- Restyle sign-in screen to use web-like ambient background and tokens.

### Scorer

- Keep flow and logic intact; update styling to the new token system.

## Data Flow

- Continue using existing Convex queries/mutations.
- New mobile hooks: `api.siteAdmin.checkIsSiteAdmin` (and optionally `api.siteAdmin.getMaintenanceStatus`).
- Quick Bracket is client-only with no server calls.

## Error Handling

- Continue to use `getDisplayMessage` / `Alert` for user-facing errors.
- Use consistent error surface styling (error badge + panel).

## Performance

- Avoid heavy animations; use minimal fade/slide transitions.
- Keep tournament lists virtualized if needed for large datasets.

## Testing

- `bun run lint`
- `bun run check-types`
- `bun run test --filter=mobile`
- Manual: verify navigation, dark/light theme, and scorer flow.

## Risks and Mitigations

- Font availability: bundle Lexend/Teko locally or use expo-google-fonts.
- Token mismatch: verify mobile colors against web tokens in both themes.
- Navigation regressions: preserve deep links and stack routes.

## Rollout Plan

1. Update tokens + typography + primitives.
2. Add header + navigation sheet and move dashboard into top-level route.
3. Restyle existing screens and add Quick Bracket + Settings parity.
4. Add Admin screen (gated).
5. Final polish and QA.
