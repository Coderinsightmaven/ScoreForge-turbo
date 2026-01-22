# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development - starts all apps and Convex backend
bun run dev

# Build all apps and packages
bun run build

# Lint all packages (zero warnings allowed)
bun run lint

# Type checking
bun run check-types

# Format code with Prettier
bun run format

# Filter to specific app/package
bun run dev --filter=web
bun run dev --filter=docs
bun run dev --filter=@repo/convex
```

### Convex-specific commands (from packages/convex)
```bash
bun run dev          # Start Convex dev server
bun run logs         # View Convex logs
npx convex run myFunctions:myQuery '{"arg": "value"}'  # Run a function
```

## Architecture

This is a **Turborepo monorepo** using **Bun** as the package manager.

### Structure
- `apps/web` - Next.js 16 app (port 3000)
- `apps/docs` - Next.js 16 docs site (port 3001)
- `packages/convex` - Convex serverless backend
- `packages/ui` - Shared React component library (`@repo/ui`)
- `packages/eslint-config` - Shared ESLint configs
- `packages/typescript-config` - Shared TypeScript configs

### Key Technologies
- **Next.js 16** with **React 19**
- **Convex** for serverless backend (database, functions, real-time)
- **TypeScript** in strict mode
- **ESLint 9** with Convex plugin

### Package Imports
- UI components: `import { Button } from "@repo/ui/button"`
- Convex functions use file-based routing: `api.filename.functionName`

## Convex Guidelines

These patterns are required when working with Convex code in `packages/convex/convex/`:

### Function Syntax
Always use the object syntax with validators:
```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const myFunction = query({
  args: { name: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    return `Hello ${args.name}`;
  },
});
```

### Public vs Internal Functions
- `query`, `mutation`, `action` - Public API, exposed to clients
- `internalQuery`, `internalMutation`, `internalAction` - Private, only callable by other Convex functions
- Reference public functions via `api.file.func`, internal via `internal.file.func`

### Database Queries
- Do NOT use `.filter()` - use `.withIndex()` with a defined index instead
- Always define indexes in `convex/schema.ts` with descriptive names (e.g., `by_channel_and_user`)
- Use `.order("desc")` or `.order("asc")` for ordering

### Validators
- Always include `returns` validator (use `v.null()` for void functions)
- Use `v.id("tableName")` for document IDs, not `v.string()`
- Use `v.int64()` not `v.bigint()` (deprecated)

### Actions
- Add `"use node";` at top of files using Node.js modules
- Actions cannot access `ctx.db` - use `ctx.runQuery`/`ctx.runMutation` instead
