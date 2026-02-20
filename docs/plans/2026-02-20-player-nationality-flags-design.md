# Player Nationality & Flag Display — Design

**Date:** 2026-02-20
**Status:** Approved

## Overview

Import players from open tennis datasets (ATP/WTA) with nationality data, allow bulk import into tournaments, and display country flags in the display app scoreboard designer.

## Data Pipeline

### 1. Player Database Table

New `playerDatabase` table in Convex:

- `name: string` — full player name
- `countryCode: string` — ISO 3166-1 alpha-2 (e.g., "US", "RS", "ES")
- `ranking: optional number` — current ranking
- `tour: string` — "ATP" or "WTA"

### 2. Data Source

JeffSackmann's open tennis datasets (MIT license):

- `tennis_atp` repo: ~3,000+ ATP players with name + IOC country code
- `tennis_wta` repo: ~2,000+ WTA players with name + IOC country code
- CSV format, well-maintained, updated regularly

IOC country codes are normalized to ISO 3166-1 alpha-2 at import time using a mapping table.

### 3. Seed/Import Process

A Convex action fetches the CSV from GitHub raw URLs, parses it, normalizes country codes, and upserts into the `playerDatabase` table. This can be triggered from an admin UI or CLI.

## Tournament Integration

### 4. Nationality Field on Participants

Add `nationality: v.optional(v.string())` to the `tournamentParticipants` table. Stores ISO 3166-1 alpha-2 country code.

### 5. Bulk Import UI

In the web app tournament setup (participants tab):

- "Import Players" button opens a modal
- User selects tour (ATP/WTA) and optionally filters by ranking range
- Searchable/filterable list of players from `playerDatabase`
- Multi-select players, click "Add to Tournament"
- Creates `tournamentParticipants` with `displayName` and `nationality` pre-filled

Manual participant entry unchanged — nationality field is optional.

## Flag Display

### 6. Flag Assets

- Web app: `flag-icons` CSS library (SVG flags via CSS classes like `fi fi-us`)
- Display app (Rust): Bundle small PNG flag images (~250 flags, ~2-4KB each) embedded in the binary or loaded from an assets directory

### 7. Display App — TennisPlayerFlag Component

New component type in the scoreboard designer:

- `ComponentType::TennisPlayerFlag`
- `ComponentData::TennisPlayerFlag { player_number: u8 }` — which player's flag to show (1 or 2)
- Renders the country flag image at the component's position/size
- Falls back to no render if nationality is absent or flag image not found

### 8. TennisLiveData Additions

```rust
pub player1_nationality: Option<String>,
pub player2_nationality: Option<String>,
```

### 9. Public API

`watchCourt` response includes `nationality` for each participant so the display app can access it.

## Edge Cases

| Edge Case                     | Solution                                                             |
| ----------------------------- | -------------------------------------------------------------------- |
| Player not in dataset         | Manual entry works — nationality optional, no flag shown             |
| IOC vs ISO country codes      | Normalize IOC→ISO at import time (mapping table in code)             |
| Dataset outdated              | Admin can re-trigger seed; new players added manually                |
| Doubles — different countries | TennisPlayerFlag shows flag per player_number (1 or 2), not per team |
| Flag image missing            | No render (display app) or hidden element (web)                      |
| Country code invalid          | Treat as absent — no flag shown                                      |
