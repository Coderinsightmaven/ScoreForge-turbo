# Sidebar Collapse Design

## Overview

Add a collapsible desktop sidebar that can shrink into an icon-only rail while preserving navigation clarity and accessibility. The collapsed state should persist across page loads and remain separate from mobile drawer behavior.

## Goals

- Provide a compact icon-only rail on desktop to increase workspace.
- Preserve fast navigation with clear active states and tooltips.
- Persist the collapsed state via localStorage.
- Keep mobile behavior unchanged (drawer overlay).

## Non-Goals

- Redesigning the navigation visual style or information architecture.
- Adding new navigation items or routes.
- Changing mobile navigation patterns.

## UX Behavior

- Desktop sidebar toggles between expanded (current `w-72`) and collapsed (narrow rail ~`w-16` to `w-20`).
- In collapsed mode:
  - Brand text and section headings are hidden.
  - Nav items show icons only; labels are visually hidden but remain accessible.
  - Nav items use `title` for hover tooltips.
  - User card reduces to avatar + compact icon buttons (theme toggle + sign out).
- Toggle button sits inside the sidebar (top or bottom) and updates `aria-expanded`.

## Implementation Plan

1. Add `collapsed` state in `apps/web/app/(app)/layout.tsx` with `useEffect` to load from localStorage.
2. Pass `collapsed` and `onToggleCollapse` into `apps/web/app/components/Navigation.tsx`.
3. Apply conditional Tailwind classes to reduce width/padding and hide text in collapsed mode.
4. Add a compact toggle button with a chevron icon; update localStorage on toggle.
5. Ensure nav labels use `sr-only` when collapsed and `title` on links for tooltips.

## Data & State

- LocalStorage key: `scoreforge-sidebar-collapsed`.
- Default: expanded on first load.
- Mobile drawer ignores the collapsed state.

## Accessibility

- Keep nav labels available to screen readers.
- Toggle button uses `aria-expanded` and `aria-label`.

## Testing

- Verify on desktop: collapse/expand persists after refresh.
- Verify nav items remain keyboard accessible and show tooltips on hover.
- Verify mobile drawer behavior unchanged.
