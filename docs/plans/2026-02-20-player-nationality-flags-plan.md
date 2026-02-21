# Player Nationality & Flag Display — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Import players from open tennis datasets (ATP/WTA) with nationality data, allow bulk import into tournaments, and display country flags in the display app scoreboard designer.

**Architecture:** New `playerDatabase` table seeded from JeffSackmann's open tennis CSV datasets. IOC country codes normalized to ISO 3166-1 alpha-2 at import time. `nationality` field added to `tournamentParticipants`. Bulk import UI in the web app. New `TennisPlayerFlag` component in the Rust display app renders flag PNG images embedded in the binary.

**Tech Stack:** Convex (schema, mutations, actions), Next.js (bulk import modal), Rust/egui (flag component with embedded PNG images), `flag-icons` CSS library (web), JeffSackmann CSV datasets (data source)

---

## Task 1: IOC-to-ISO Country Code Mapping Utility

**Files:**

- Create: `packages/convex/convex/lib/countryCodes.ts`

**Step 1: Create the mapping file**

Create `packages/convex/convex/lib/countryCodes.ts` with the IOC→ISO mapping table and a conversion function. IOC codes are 3-letter codes used in tennis datasets; ISO 3166-1 alpha-2 are the 2-letter codes used by flag libraries.

```typescript
/**
 * IOC (International Olympic Committee) to ISO 3166-1 alpha-2 country code mapping.
 * Only codes that differ between IOC and ISO are listed here.
 * If not in this map, the IOC code's first 2 letters are used as a fallback.
 */
const IOC_TO_ISO: Record<string, string> = {
  // Different codes
  GER: "DE",
  SUI: "CH",
  NED: "NL",
  CRO: "HR",
  GRE: "GR",
  POR: "PT",
  RSA: "ZA",
  CHI: "CL",
  TPE: "TW",
  KOR: "KR",
  MAS: "MY",
  INA: "ID",
  PHI: "PH",
  SIN: "SG",
  THA: "TH",
  VIE: "VN",
  MYA: "MM",
  SRI: "LK",
  BAN: "BD",
  NEP: "NP",
  IRI: "IR",
  UAE: "AE",
  KSA: "SA",
  PLE: "PS",
  LIB: "LB",
  SYR: "SY",
  BRN: "BH",
  OMA: "OM",
  YEM: "YE",
  HAI: "HT",
  PUR: "PR",
  ISV: "VI",
  VIN: "VC",
  SKN: "KN",
  ANT: "AG",
  BAR: "BB",
  CAY: "KY",
  BER: "BM",
  AHO: "AN",
  ARU: "AW",
  IVB: "VG",
  LCA: "LC",
  TTO: "TT",
  GUA: "GT",
  CRC: "CR",
  ESA: "SV",
  HON: "HN",
  NCA: "NI",
  PAN: "PA",
  PAR: "PY",
  URU: "UY",
  BOL: "BO",
  ECU: "EC",
  GUY: "GY",
  SUR: "SR",
  ALG: "DZ",
  ANG: "AO",
  BOT: "BW",
  BUR: "BF",
  CGO: "CG",
  CHA: "TD",
  CMR: "CM",
  COD: "CD",
  CIV: "CI",
  ERI: "ER",
  ETH: "ET",
  GAB: "GA",
  GAM: "GM",
  GBS: "GW",
  GUI: "GN",
  KEN: "KE",
  LES: "LS",
  MAD: "MG",
  MAW: "MW",
  MLI: "ML",
  MOZ: "MZ",
  MTN: "MR",
  NAM: "NA",
  NIG: "NE",
  NGR: "NG",
  RWA: "RW",
  SEN: "SN",
  SEY: "SC",
  SLE: "SL",
  SOM: "SO",
  SSD: "SS",
  SWZ: "SZ",
  TAN: "TZ",
  TOG: "TG",
  TUN: "TN",
  UGA: "UG",
  ZAM: "ZM",
  ZIM: "ZW",
  BRU: "BN",
  CAM: "KH",
  LAO: "LA",
  MGL: "MN",
  TKM: "TM",
  UZB: "UZ",
  AFG: "AF",
  PAK: "PK",
  BIH: "BA",
  MKD: "MK",
  MNE: "ME",
  SRB: "RS",
  SLO: "SI",
  LAT: "LV",
  LTU: "LT",
  EST: "EE",
  MDA: "MD",
  BUL: "BG",
  ROU: "RO",
  CZE: "CZ",
  SVK: "SK",
  HUN: "HU",
  POL: "PL",
  AUT: "AT",
  DEN: "DK",
  FIN: "FI",
  NOR: "NO",
  SWE: "SE",
  ISL: "IS",
  MON: "MC",
  LIE: "LI",
  AND: "AD",
  GEO: "GE",
  ARM: "AM",
  AZE: "AZ",
  KAZ: "KZ",
  KGZ: "KG",
  TJK: "TJ",
  // 3-letter IOC codes that map to 2-letter ISO directly
  USA: "US",
  GBR: "GB",
  FRA: "FR",
  ESP: "ES",
  ITA: "IT",
  AUS: "AU",
  CAN: "CA",
  BRA: "BR",
  ARG: "AR",
  JPN: "JP",
  CHN: "CN",
  IND: "IN",
  MEX: "MX",
  COL: "CO",
  PER: "PE",
  VEN: "VE",
  CUB: "CU",
  DOM: "DO",
  JAM: "JA",
  EGY: "EG",
  MAR: "MA",
  NZL: "NZ",
  ISR: "IL",
  JOR: "JO",
  IRQ: "IQ",
  KUW: "KW",
  QAT: "QA",
  LBY: "LY",
  RUS: "RU",
  UKR: "UA",
  BLR: "BY",
};

/**
 * Convert an IOC 3-letter country code to ISO 3166-1 alpha-2.
 * Returns lowercase 2-letter code suitable for flag-icons CSS classes.
 * Returns undefined if the code cannot be mapped.
 */
export function iocToIso(iocCode: string): string | undefined {
  if (!iocCode || iocCode.length < 2) return undefined;
  const upper = iocCode.trim().toUpperCase();
  const mapped = IOC_TO_ISO[upper];
  if (mapped) return mapped.toLowerCase();
  // Fallback: if 2 letters, treat as ISO already
  if (upper.length === 2) return upper.toLowerCase();
  return undefined;
}

/**
 * Validate that a string looks like an ISO 3166-1 alpha-2 code.
 */
export function isValidIsoCode(code: string): boolean {
  return /^[a-z]{2}$/.test(code);
}
```

**Step 2: Commit**

```bash
git add packages/convex/convex/lib/countryCodes.ts
git commit -m "feat: add IOC-to-ISO country code mapping utility"
```

---

## Task 2: playerDatabase Table Schema

**Files:**

- Modify: `packages/convex/convex/schema.ts`

**Step 1: Add the playerDatabase table to the schema**

In `packages/convex/convex/schema.ts`, add a new `playerDatabase` table definition alongside the existing tables. Add it after the existing table definitions (before the `export default` line):

```typescript
playerDatabase: defineTable({
  name: v.string(),
  countryCode: v.string(), // ISO 3166-1 alpha-2 (lowercase, e.g., "us", "rs")
  ranking: v.optional(v.number()),
  tour: v.string(), // "ATP" or "WTA"
  externalId: v.optional(v.string()), // player_id from dataset for dedup
})
  .index("by_tour", ["tour"])
  .index("by_tour_and_ranking", ["tour", "ranking"])
  .index("by_external_id", ["externalId"])
  .searchIndex("search_name", { searchField: "name" }),
```

**Step 2: Add nationality to tournamentParticipants**

In the existing `tournamentParticipants` table definition (around line 282-307), add:

```typescript
nationality: v.optional(v.string()), // ISO 3166-1 alpha-2 (e.g., "us")
```

Add it after the `isPlaceholder` field.

**Step 3: Commit**

```bash
git add packages/convex/convex/schema.ts
git commit -m "feat: add playerDatabase table and nationality field to participants"
```

---

## Task 3: Seed Action — Fetch and Import Player Data

**Files:**

- Create: `packages/convex/convex/playerDatabase.ts`

**Step 1: Create the playerDatabase module**

Create `packages/convex/convex/playerDatabase.ts` with an internal action to fetch CSV data from GitHub and upsert into the database, plus queries for the bulk import UI:

```typescript
"use node";

import { v } from "convex/values";
import { action, internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { iocToIso } from "./lib/countryCodes";
import { getCurrentUserOrThrow } from "./users";

const ATP_CSV_URL =
  "https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master/atp_players.csv";
const WTA_CSV_URL =
  "https://raw.githubusercontent.com/JeffSackmann/tennis_wta/master/wta_players.csv";

// ============================================
// Queries
// ============================================

/**
 * Search players by name (for bulk import UI).
 */
export const searchPlayers = query({
  args: {
    tour: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("playerDatabase"),
      name: v.string(),
      countryCode: v.string(),
      ranking: v.optional(v.number()),
      tour: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    const limit = args.limit ?? 50;

    if (args.searchQuery && args.searchQuery.trim().length > 0) {
      // Use search index for name search
      let results = await ctx.db
        .query("playerDatabase")
        .withSearchIndex("search_name", (q) => {
          let search = q.search("name", args.searchQuery!);
          if (args.tour) {
            search = search.eq("tour", args.tour);
          }
          return search;
        })
        .take(limit);

      return results.map((p) => ({
        _id: p._id,
        name: p.name,
        countryCode: p.countryCode,
        ranking: p.ranking,
        tour: p.tour,
      }));
    }

    // No search query — return by ranking
    if (args.tour) {
      const results = await ctx.db
        .query("playerDatabase")
        .withIndex("by_tour_and_ranking", (q) => q.eq("tour", args.tour!))
        .take(limit);
      return results.map((p) => ({
        _id: p._id,
        name: p.name,
        countryCode: p.countryCode,
        ranking: p.ranking,
        tour: p.tour,
      }));
    }

    const results = await ctx.db.query("playerDatabase").take(limit);
    return results.map((p) => ({
      _id: p._id,
      name: p.name,
      countryCode: p.countryCode,
      ranking: p.ranking,
      tour: p.tour,
    }));
  },
});

// ============================================
// Seed Action
// ============================================

/**
 * Parse a CSV line handling quoted fields.
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

/**
 * Fetch players CSV from GitHub and upsert into playerDatabase.
 */
export const seedPlayerDatabase = action({
  args: {
    tour: v.string(), // "ATP" or "WTA"
  },
  returns: v.object({
    imported: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx, args) => {
    const url = args.tour === "ATP" ? ATP_CSV_URL : WTA_CSV_URL;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }
    const csvText = await response.text();
    const lines = csvText.split("\n").filter((line) => line.trim().length > 0);

    if (lines.length < 2) {
      return { imported: 0, skipped: 0 };
    }

    // CSV columns: player_id,name_first,name_last,hand,dob,ioc,height,wikidata_id
    let imported = 0;
    let skipped = 0;

    // Process in batches for the internal mutation
    const BATCH_SIZE = 100;
    let batch: {
      externalId: string;
      name: string;
      countryCode: string;
      tour: string;
    }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i]!);
      const playerId = fields[0] ?? "";
      const firstName = fields[1] ?? "";
      const lastName = fields[2] ?? "";
      const iocCode = fields[5] ?? "";

      if (!firstName && !lastName) {
        skipped++;
        continue;
      }

      const name = `${firstName} ${lastName}`.trim();
      const isoCode = iocToIso(iocCode);

      if (!isoCode) {
        skipped++;
        continue;
      }

      batch.push({
        externalId: `${args.tour.toLowerCase()}_${playerId}`,
        name,
        countryCode: isoCode,
        tour: args.tour,
      });

      if (batch.length >= BATCH_SIZE) {
        const result = await ctx.runMutation(internal.playerDatabase.upsertPlayerBatch, {
          players: batch,
        });
        imported += result.upserted;
        batch = [];
      }
    }

    // Process remaining batch
    if (batch.length > 0) {
      const result = await ctx.runMutation(internal.playerDatabase.upsertPlayerBatch, {
        players: batch,
      });
      imported += result.upserted;
    }

    return { imported, skipped };
  },
});

// ============================================
// Internal Mutations
// ============================================

export const upsertPlayerBatch = internalMutation({
  args: {
    players: v.array(
      v.object({
        externalId: v.string(),
        name: v.string(),
        countryCode: v.string(),
        tour: v.string(),
      })
    ),
  },
  returns: v.object({ upserted: v.number() }),
  handler: async (ctx, args) => {
    let upserted = 0;

    for (const player of args.players) {
      // Check if player already exists by externalId
      const existing = await ctx.db
        .query("playerDatabase")
        .withIndex("by_external_id", (q) => q.eq("externalId", player.externalId))
        .first();

      if (existing) {
        // Update name and country if changed
        await ctx.db.patch(existing._id, {
          name: player.name,
          countryCode: player.countryCode,
        });
      } else {
        await ctx.db.insert("playerDatabase", {
          name: player.name,
          countryCode: player.countryCode,
          tour: player.tour,
          externalId: player.externalId,
        });
      }
      upserted++;
    }

    return { upserted };
  },
});
```

**Step 2: Verify types compile**

Run: `cd packages/convex && npx convex dev --once` (or just typecheck)

**Step 3: Commit**

```bash
git add packages/convex/convex/playerDatabase.ts
git commit -m "feat: add playerDatabase seed action and search query"
```

---

## Task 4: Nationality on Participant Mutations

**Files:**

- Modify: `packages/convex/convex/tournamentParticipants.ts`

**Step 1: Add nationality arg to addParticipant mutation**

In `packages/convex/convex/tournamentParticipants.ts`, find the `addParticipant` mutation args (around line 232-246). Add:

```typescript
nationality: v.optional(v.string()),
```

**Step 2: Pass nationality to db.insert()**

In the same mutation's `ctx.db.insert()` call (around line 343-356), add `nationality: args.nationality` to the inserted document.

**Step 3: Add nationality arg to any batch/CSV import mutations**

Check if there are batch insert mutations (e.g., CSV import handlers). If so, add `nationality` support to those as well.

**Step 4: Commit**

```bash
git add packages/convex/convex/tournamentParticipants.ts
git commit -m "feat: add nationality field to addParticipant mutation"
```

---

## Task 5: Public API — Nationality in Responses

**Files:**

- Modify: `packages/convex/convex/publicApi.ts`

**Step 1: Add nationality to participantReturn validator**

In `packages/convex/convex/publicApi.ts`, find the `participantReturn` validator (lines 22-37). Add:

```typescript
nationality: v.optional(v.string()),
```

**Step 2: Include nationality in all participant enrichment sections**

There are 4 places where participant data is built (watchMatch, watchCourt, getMatch, listMatches). In each, add `nationality: participant.nationality` to the returned object. Search for `displayName: p1.displayName` or similar patterns — these are the participant enrichment blocks.

**Step 3: Commit**

```bash
git add packages/convex/convex/publicApi.ts
git commit -m "feat: include nationality in public API participant responses"
```

---

## Task 6: Web App — Bulk Import Modal

**Files:**

- Create: `apps/web/app/(app)/tournaments/[id]/participants/add/ImportPlayersModal.tsx`
- Modify: `apps/web/app/(app)/tournaments/[id]/participants/add/page.tsx`

**Step 1: Install flag-icons CSS library**

```bash
cd apps/web && bun add flag-icons
```

**Step 2: Import flag-icons CSS**

In `apps/web/app/layout.tsx`, add the import:

```typescript
import "flag-icons/css/flag-icons.min.css";
```

**Step 3: Create the ImportPlayersModal component**

Create `apps/web/app/(app)/tournaments/[id]/participants/add/ImportPlayersModal.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@repo/convex";

type Player = {
  _id: string;
  name: string;
  countryCode: string;
  ranking?: number;
  tour: string;
};

type ImportPlayersModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onImport: (players: { name: string; nationality: string }[]) => void;
};

export function ImportPlayersModal({ isOpen, onClose, onImport }: ImportPlayersModalProps) {
  const [tour, setTour] = useState<"ATP" | "WTA">("ATP");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<Map<string, Player>>(new Map());

  const players = useQuery(
    api.playerDatabase.searchPlayers,
    isOpen ? { tour, searchQuery: searchQuery || undefined, limit: 50 } : "skip"
  );

  if (!isOpen) return null;

  const togglePlayer = (player: Player) => {
    setSelectedPlayers((prev) => {
      const next = new Map(prev);
      if (next.has(player._id)) {
        next.delete(player._id);
      } else {
        next.set(player._id, player);
      }
      return next;
    });
  };

  const handleImport = () => {
    const importData = Array.from(selectedPlayers.values()).map((p) => ({
      name: p.name,
      nationality: p.countryCode,
    }));
    onImport(importData);
    setSelectedPlayers(new Map());
    setSearchQuery("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-bg-primary border-border w-full max-w-2xl rounded-3xl border p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Import Players</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            ✕
          </button>
        </div>

        {/* Tour selector */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setTour("ATP")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              tour === "ATP" ? "bg-brand text-black" : "bg-bg-secondary text-text-secondary"
            }`}
          >
            ATP
          </button>
          <button
            onClick={() => setTour("WTA")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              tour === "WTA" ? "bg-brand text-black" : "bg-bg-secondary text-text-secondary"
            }`}
          >
            WTA
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search players..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-bg-secondary border-border text-text-primary placeholder:text-text-muted mb-4 w-full rounded-full border px-4 py-2"
        />

        {/* Player list */}
        <div className="border-border mb-4 max-h-80 overflow-y-auto rounded-2xl border">
          {!players ? (
            <div className="text-text-muted p-4 text-center">Loading...</div>
          ) : players.length === 0 ? (
            <div className="text-text-muted p-4 text-center">No players found</div>
          ) : (
            players.map((player) => (
              <button
                key={player._id}
                onClick={() => togglePlayer(player as Player)}
                className={`flex w-full items-center gap-3 border-b px-4 py-3 last:border-b-0 ${
                  selectedPlayers.has(player._id) ? "bg-brand/10" : "hover:bg-bg-secondary"
                }`}
              >
                <span
                  className={`fi fi-${player.countryCode} rounded-sm`}
                  style={{ fontSize: "1.2em" }}
                />
                <span className="text-text-primary flex-1 text-left font-medium">
                  {player.name}
                </span>
                {player.ranking && (
                  <span className="text-text-muted text-sm">#{player.ranking}</span>
                )}
                {selectedPlayers.has(player._id) && <span className="text-brand font-bold">✓</span>}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-text-muted text-sm">
            {selectedPlayers.size} player{selectedPlayers.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary rounded-full px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={selectedPlayers.size === 0}
              className="bg-brand disabled:bg-brand/50 rounded-full px-6 py-2 text-sm font-semibold text-black"
            >
              Add {selectedPlayers.size > 0 ? `${selectedPlayers.size} ` : ""}Players
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Integrate ImportPlayersModal into the add participants page**

In `apps/web/app/(app)/tournaments/[id]/participants/add/page.tsx`:

1. Import the modal component
2. Add state: `const [showImportModal, setShowImportModal] = useState(false);`
3. Add an "Import from Database" button near the existing CSV import section
4. Add the modal to the JSX
5. Handle the `onImport` callback to call `addParticipant` for each imported player (with `nationality` set)

**Step 5: Add nationality field to manual entry form**

In the same page, add an optional "Nationality" text input after the seed field. This allows manual entry of 2-letter country codes for manually-added participants.

**Step 6: Commit**

```bash
git add apps/web/app/(app)/tournaments/[id]/participants/add/ImportPlayersModal.tsx
git add apps/web/app/(app)/tournaments/[id]/participants/add/page.tsx
git add apps/web/app/layout.tsx
git commit -m "feat: add bulk player import modal with flag display"
```

---

## Task 7: Display App — TennisLiveData Nationality Fields

**Files:**

- Modify: `apps/display/src/data/live_data.rs`
- Modify: `apps/display/src/data/convex.rs`

**Step 1: Add nationality fields to TennisLiveData**

In `apps/display/src/data/live_data.rs`, add to the `TennisLiveData` struct:

```rust
pub player1_nationality: Option<String>,
pub player2_nationality: Option<String>,
```

**Step 2: Parse nationality from Convex data**

In `apps/display/src/data/convex.rs`, in the `parse_match_data()` function, extract nationality from participant data. The public API includes nationality in participant objects. Add parsing like:

```rust
let player1_nationality = participant1_obj
    .and_then(|p| get_str(p, "nationality"))
    .map(|s| s.to_string());
let player2_nationality = participant2_obj
    .and_then(|p| get_str(p, "nationality"))
    .map(|s| s.to_string());
```

Pass these into the `TennisLiveData` struct construction.

**Step 3: Update all TennisLiveData construction sites**

Make sure every place `TennisLiveData` is constructed now includes the new fields (default to `None`).

**Step 4: Commit**

```bash
git add apps/display/src/data/live_data.rs apps/display/src/data/convex.rs
git commit -m "feat: add player nationality fields to TennisLiveData"
```

---

## Task 8: Display App — Embed Flag PNG Images

**Files:**

- Create: `apps/display/src/flags/mod.rs`
- Create: `apps/display/flags/` directory with PNG files
- Modify: `apps/display/Cargo.toml` (if needed)

**Step 1: Source flag PNG images**

Download a set of small (e.g., 64x42px) flag PNG images for all countries. A good source is the `flag-icons` project's SVGs converted to small PNGs, or a pre-made set like `lipis/flag-icons` PNG exports. Place them in `apps/display/flags/` named by ISO code (e.g., `us.png`, `rs.png`).

Alternatively, use Rust's `include_bytes!` macro to embed a subset of commonly-needed flag PNGs directly into the binary. For a simpler initial approach, embed flags for the top ~50 tennis nations.

**Step 2: Create the flags module**

Create `apps/display/src/flags/mod.rs`:

```rust
use std::collections::HashMap;
use egui::{ColorImage, TextureHandle, TextureOptions};

/// Embedded flag images (PNG bytes).
/// Each flag is a small PNG (~2-4KB).
macro_rules! include_flag {
    ($code:expr) => {
        ($code, include_bytes!(concat!("../../flags/", $code, ".png")).as_slice())
    };
}

/// Get all embedded flag PNG data.
fn embedded_flags() -> Vec<(&'static str, &'static [u8])> {
    vec![
        include_flag!("us"),
        include_flag!("gb"),
        include_flag!("es"),
        include_flag!("fr"),
        include_flag!("de"),
        include_flag!("it"),
        include_flag!("rs"),
        include_flag!("hr"),
        include_flag!("ch"),
        include_flag!("au"),
        include_flag!("ca"),
        include_flag!("ar"),
        include_flag!("br"),
        include_flag!("jp"),
        include_flag!("cn"),
        include_flag!("kr"),
        include_flag!("ru"),
        include_flag!("pl"),
        include_flag!("cz"),
        include_flag!("bg"),
        include_flag!("ro"),
        include_flag!("gr"),
        include_flag!("nl"),
        include_flag!("be"),
        include_flag!("at"),
        include_flag!("dk"),
        include_flag!("se"),
        include_flag!("no"),
        include_flag!("fi"),
        include_flag!("ge"),
        include_flag!("ua"),
        include_flag!("za"),
        include_flag!("in"),
        include_flag!("cl"),
        include_flag!("co"),
        include_flag!("tw"),
        include_flag!("th"),
        include_flag!("kz"),
        include_flag!("tn"),
        include_flag!("pt"),
        // Add more as needed
    ]
}

pub struct FlagCache {
    textures: HashMap<String, TextureHandle>,
    loaded: bool,
}

impl FlagCache {
    pub fn new() -> Self {
        Self {
            textures: HashMap::new(),
            loaded: false,
        }
    }

    /// Load all embedded flags into textures. Call once after egui context is available.
    pub fn ensure_loaded(&mut self, ctx: &egui::Context) {
        if self.loaded {
            return;
        }
        for (code, png_data) in embedded_flags() {
            if let Ok(img) = image::load_from_memory(png_data) {
                let rgba = img.into_rgba8();
                let size = [rgba.width() as usize, rgba.height() as usize];
                let color_image = ColorImage::from_rgba_unmultiplied(size, &rgba);
                let handle = ctx.load_texture(
                    format!("flag-{code}"),
                    color_image,
                    TextureOptions::LINEAR,
                );
                self.textures.insert(code.to_string(), handle);
            }
        }
        self.loaded = true;
    }

    /// Get a flag texture by ISO country code (lowercase).
    pub fn get(&self, country_code: &str) -> Option<&TextureHandle> {
        self.textures.get(country_code)
    }
}
```

**Step 3: Wire FlagCache into the app**

Add `pub mod flags;` to `src/main.rs` or `src/lib.rs`. Create a `FlagCache` instance in the app state (alongside `TextureCache`). Call `flag_cache.ensure_loaded(ctx)` during the first frame.

**Step 4: Commit**

```bash
git add apps/display/src/flags/ apps/display/flags/
git commit -m "feat: add embedded flag images and FlagCache for display app"
```

---

## Task 9: Display App — TennisPlayerFlag Component

**Files:**

- Create: `apps/display/src/components/tennis_flag.rs`
- Modify: `apps/display/src/components/mod.rs`
- Modify: `apps/display/src/designer/component_library.rs`
- Modify: `apps/display/src/designer/property_panel.rs`

**Step 1: Add TennisPlayerFlag to ComponentType and ComponentData**

In `apps/display/src/components/mod.rs`:

Add `TennisPlayerFlag` to the `ComponentType` enum:

```rust
TennisPlayerFlag,
```

Add its label:

```rust
Self::TennisPlayerFlag => "Player Flag",
```

Add `TennisPlayerFlag` to the `ComponentData` enum:

```rust
TennisPlayerFlag {
    player_number: u8,
},
```

Add default data in `ScoreboardComponent::new()`:

```rust
ComponentType::TennisPlayerFlag => ComponentData::TennisPlayerFlag { player_number: 1 },
```

**Step 2: Create the render function**

Create `apps/display/src/components/tennis_flag.rs`:

```rust
use egui::Rect;

use crate::data::live_data::TennisLiveData;
use crate::flags::FlagCache;

pub fn render_tennis_flag(
    painter: &egui::Painter,
    rect: Rect,
    player_number: u8,
    live_data: Option<&TennisLiveData>,
    flag_cache: &FlagCache,
) {
    let nationality = if let Some(data) = live_data {
        match player_number {
            1 => data.player1_nationality.as_deref(),
            2 => data.player2_nationality.as_deref(),
            _ => None,
        }
    } else {
        // Designer preview — show a placeholder flag
        Some("us")
    };

    if let Some(code) = nationality {
        if let Some(texture) = flag_cache.get(code) {
            let uv = Rect::from_min_max(egui::pos2(0.0, 0.0), egui::pos2(1.0, 1.0));
            painter.image(texture.id(), rect, uv, egui::Color32::WHITE);
        }
        // If no texture found for this country, render nothing (graceful fallback)
    }
}
```

**Step 3: Add render dispatch**

In `render_component()` in `mod.rs`, add the match arm:

```rust
ComponentData::TennisPlayerFlag { player_number } => {
    tennis_flag::render_tennis_flag(
        painter,
        rect,
        *player_number,
        live_data,
        flag_cache,
    );
}
```

Note: This requires passing `flag_cache: &FlagCache` into `render_component()`. Update the function signature and all call sites.

**Step 4: Add to component library**

In `apps/display/src/designer/component_library.rs`, add a "Player Flag" button in the Tennis section:

```rust
if ui.button("Player Flag").clicked() {
    add_component(ComponentType::TennisPlayerFlag, project, ui);
}
```

Add a size case in `add_component()`:

```rust
ComponentType::TennisPlayerFlag => (60.0, 40.0), // Flag aspect ratio ~3:2
```

**Step 5: Add property panel support**

In `apps/display/src/designer/property_panel.rs`, add a match arm:

```rust
ComponentData::TennisPlayerFlag { player_number } => {
    show_player_picker(ui, player_number);
}
```

**Step 6: Add module declaration**

In `apps/display/src/components/mod.rs`, add:

```rust
pub mod tennis_flag;
```

**Step 7: Build and test**

Run: `cd apps/display && cargo build`
Run: `cd apps/display && cargo test`

**Step 8: Commit**

```bash
git add apps/display/src/components/tennis_flag.rs
git add apps/display/src/components/mod.rs
git add apps/display/src/designer/component_library.rs
git add apps/display/src/designer/property_panel.rs
git commit -m "feat: add TennisPlayerFlag component to display app designer"
```

---

## Task 10: Web App — Flag Display on Participants Tab

**Files:**

- Modify: `apps/web/app/(app)/tournaments/[id]/components/ParticipantsTab.tsx`

**Step 1: Show flag icon next to participant names**

In the participants tab, wherever participant names are displayed in the list, add a flag icon before the name using the `flag-icons` CSS class:

```tsx
{
  participant.nationality && (
    <span
      className={`fi fi-${participant.nationality} mr-2 rounded-sm`}
      style={{ fontSize: "1em" }}
    />
  );
}
```

**Step 2: Show nationality in participant details/editing**

If there's a participant detail view or edit form, add nationality display/editing there.

**Step 3: Commit**

```bash
git add apps/web/app/(app)/tournaments/[id]/components/ParticipantsTab.tsx
git commit -m "feat: display country flags next to participant names"
```

---

## Task 11: Admin Seed UI (Optional)

**Files:**

- Modify: An admin page or create a simple seed trigger

**Step 1: Add seed trigger**

Add a button in the web app (either on the import modal or in a settings/admin page) that calls the `seedPlayerDatabase` action. This can be a simple button that triggers:

```tsx
const seedAction = useAction(api.playerDatabase.seedPlayerDatabase);

const handleSeed = async (tour: "ATP" | "WTA") => {
  const result = await seedAction({ tour });
  toast.success(`Imported ${result.imported} ${tour} players (${result.skipped} skipped)`);
};
```

**Step 2: Commit**

```bash
git add <modified files>
git commit -m "feat: add player database seed trigger UI"
```

---

## Task 12: Final Verification

**Step 1: Type check**

```bash
cd /Users/liammarincik/projects/tempuz/scoreforge-turbo
bun run check-types
```

**Step 2: Lint**

```bash
bun run lint
```

**Step 3: Build display app**

```bash
cd apps/display && cargo build
```

**Step 4: Run display app tests**

```bash
cd apps/display && cargo test
```

**Step 5: Fix any issues found**

**Step 6: Final commit if needed**

```bash
git add -A
git commit -m "fix: address lint and type issues from nationality feature"
```
