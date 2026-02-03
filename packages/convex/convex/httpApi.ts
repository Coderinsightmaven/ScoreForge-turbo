/**
 * HTTP API Actions for external access to public API endpoints.
 *
 * These HTTP actions wrap the public API functionality and provide
 * proper HTTP endpoint handling with CORS support for external clients
 * like the desktop scoreboard app.
 */
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Helper to create JSON response with CORS headers
 */
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

/**
 * Helper to handle CORS preflight requests
 */
function corsPreflightResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

/**
 * GET /api/public/match - Get a single match by ID
 *
 * Query params:
 * - apiKey: API key for authentication
 * - matchId: Match ID to fetch
 */
export const getMatch = httpAction(async (ctx, request) => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return corsPreflightResponse();
  }

  try {
    const url = new URL(request.url);
    const apiKey = url.searchParams.get("apiKey");
    const matchId = url.searchParams.get("matchId");

    if (!apiKey || !matchId) {
      return jsonResponse({ error: "Missing required parameters: apiKey and matchId" }, 400);
    }

    const result = await ctx.runMutation(api.publicApi.getMatch, {
      apiKey,
      matchId,
    });

    if ("error" in result) {
      return jsonResponse({ error: result.error }, 400);
    }

    return jsonResponse(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return jsonResponse({ error: message }, 500);
  }
});

/**
 * GET /api/public/matches - List matches for a tournament
 *
 * Query params:
 * - apiKey: API key for authentication
 * - tournamentId: Tournament ID
 * - bracketId: (optional) Filter by bracket
 * - status: (optional) Filter by status
 * - round: (optional) Filter by round
 * - court: (optional) Filter by court
 * - sortBy: (optional) Sort by field
 */
export const listMatches = httpAction(async (ctx, request) => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return corsPreflightResponse();
  }

  try {
    const url = new URL(request.url);
    const apiKey = url.searchParams.get("apiKey");
    const tournamentId = url.searchParams.get("tournamentId");

    if (!apiKey || !tournamentId) {
      return jsonResponse({ error: "Missing required parameters: apiKey and tournamentId" }, 400);
    }

    const args: {
      apiKey: string;
      tournamentId: string;
      bracketId?: string;
      status?: "pending" | "scheduled" | "live" | "completed" | "bye";
      round?: number;
      court?: string;
      sortBy?: "round" | "court" | "scheduledTime";
    } = { apiKey, tournamentId };

    const bracketId = url.searchParams.get("bracketId");
    if (bracketId) args.bracketId = bracketId;

    const status = url.searchParams.get("status");
    if (status && ["pending", "scheduled", "live", "completed", "bye"].includes(status)) {
      args.status = status as typeof args.status;
    }

    const round = url.searchParams.get("round");
    if (round) args.round = parseInt(round, 10);

    const court = url.searchParams.get("court");
    if (court) args.court = court;

    const sortBy = url.searchParams.get("sortBy");
    if (sortBy && ["round", "court", "scheduledTime"].includes(sortBy)) {
      args.sortBy = sortBy as typeof args.sortBy;
    }

    const result = await ctx.runMutation(api.publicApi.listMatches, args);

    if ("error" in result) {
      return jsonResponse({ error: result.error }, 400);
    }

    return jsonResponse(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return jsonResponse({ error: message }, 500);
  }
});

/**
 * GET /api/public/tournaments - List all tournaments for the user
 *
 * Query params:
 * - apiKey: API key for authentication
 * - status: (optional) Filter by status
 */
export const listTournaments = httpAction(async (ctx, request) => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return corsPreflightResponse();
  }

  try {
    const url = new URL(request.url);
    const apiKey = url.searchParams.get("apiKey");

    if (!apiKey) {
      return jsonResponse({ error: "Missing required parameter: apiKey" }, 400);
    }

    const args: {
      apiKey: string;
      status?: "draft" | "active" | "completed" | "cancelled";
    } = { apiKey };

    const status = url.searchParams.get("status");
    if (status && ["draft", "active", "completed", "cancelled"].includes(status)) {
      args.status = status as typeof args.status;
    }

    const result = await ctx.runMutation(api.publicApi.listTournaments, args);

    if ("error" in result) {
      return jsonResponse({ error: result.error }, 400);
    }

    return jsonResponse(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return jsonResponse({ error: message }, 500);
  }
});

/**
 * GET /api/public/brackets - List brackets for a tournament
 *
 * Query params:
 * - apiKey: API key for authentication
 * - tournamentId: Tournament ID
 */
export const listBrackets = httpAction(async (ctx, request) => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return corsPreflightResponse();
  }

  try {
    const url = new URL(request.url);
    const apiKey = url.searchParams.get("apiKey");
    const tournamentId = url.searchParams.get("tournamentId");

    if (!apiKey || !tournamentId) {
      return jsonResponse({ error: "Missing required parameters: apiKey and tournamentId" }, 400);
    }

    const result = await ctx.runMutation(api.publicApi.listBrackets, {
      apiKey,
      tournamentId,
    });

    if ("error" in result) {
      return jsonResponse({ error: result.error }, 400);
    }

    return jsonResponse(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return jsonResponse({ error: message }, 500);
  }
});
