import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// Queries
// ============================================

/**
 * List participants for a tournament with team/user details
 */
export const listParticipants = query({
  args: { tournamentId: v.id("tournaments") },
  returns: v.array(
    v.object({
      _id: v.id("tournamentParticipants"),
      displayName: v.string(),
      seed: v.optional(v.number()),
      wins: v.number(),
      losses: v.number(),
      draws: v.number(),
      pointsFor: v.number(),
      pointsAgainst: v.number(),
      registeredAt: v.number(),
      teamId: v.optional(v.id("teams")),
      userId: v.optional(v.id("users")),
      // Additional details
      teamName: v.optional(v.string()),
      userName: v.optional(v.string()),
      userEmail: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const tournament = await ctx.db.get("tournaments", args.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Check if user is a member of the organization
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_and_user", (q) =>
        q.eq("organizationId", tournament.organizationId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      throw new Error("Not authorized");
    }

    const participants = await ctx.db
      .query("tournamentParticipants")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", args.tournamentId))
      .collect();

    // Enrich with team/user details
    const enriched = await Promise.all(
      participants.map(async (p) => {
        let teamName: string | undefined;
        let userName: string | undefined;
        let userEmail: string | undefined;

        if (p.teamId) {
          const team = await ctx.db.get("teams", p.teamId);
          if (team) {
            teamName = team.name;
          }
        }

        if (p.userId) {
          const user = await ctx.db.get("users", p.userId);
          if (user) {
            userName = user.name ?? undefined;
            userEmail = user.email ?? undefined;
          }
        }

        return {
          _id: p._id,
          displayName: p.displayName,
          seed: p.seed,
          wins: p.wins,
          losses: p.losses,
          draws: p.draws,
          pointsFor: p.pointsFor,
          pointsAgainst: p.pointsAgainst,
          registeredAt: p.registeredAt,
          teamId: p.teamId,
          userId: p.userId,
          teamName,
          userName,
          userEmail,
        };
      })
    );

    // Sort by seed (if set) then registration time
    enriched.sort((a, b) => {
      if (a.seed && b.seed) return a.seed - b.seed;
      if (a.seed) return -1;
      if (b.seed) return 1;
      return a.registeredAt - b.registeredAt;
    });

    return enriched;
  },
});

/**
 * Get a single participant
 */
export const getParticipant = query({
  args: { participantId: v.id("tournamentParticipants") },
  returns: v.union(
    v.object({
      _id: v.id("tournamentParticipants"),
      tournamentId: v.id("tournaments"),
      displayName: v.string(),
      seed: v.optional(v.number()),
      wins: v.number(),
      losses: v.number(),
      draws: v.number(),
      pointsFor: v.number(),
      pointsAgainst: v.number(),
      registeredAt: v.number(),
      teamId: v.optional(v.id("teams")),
      userId: v.optional(v.id("users")),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const participant = await ctx.db.get("tournamentParticipants", args.participantId);
    if (!participant) {
      return null;
    }

    const tournament = await ctx.db.get("tournaments", participant.tournamentId);
    if (!tournament) {
      return null;
    }

    // Check if user is a member of the organization
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_and_user", (q) =>
        q.eq("organizationId", tournament.organizationId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      return null;
    }

    return {
      _id: participant._id,
      tournamentId: participant.tournamentId,
      displayName: participant.displayName,
      seed: participant.seed,
      wins: participant.wins,
      losses: participant.losses,
      draws: participant.draws,
      pointsFor: participant.pointsFor,
      pointsAgainst: participant.pointsAgainst,
      registeredAt: participant.registeredAt,
      teamId: participant.teamId,
      userId: participant.userId,
    };
  },
});

// ============================================
// Mutations
// ============================================

/**
 * Register a team or individual for a tournament
 */
export const registerParticipant = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    teamId: v.optional(v.id("teams")),
    userId: v.optional(v.id("users")),
    displayName: v.optional(v.string()),
  },
  returns: v.id("tournamentParticipants"),
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      throw new Error("Not authenticated");
    }

    const tournament = await ctx.db.get("tournaments", args.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Check if user is a member of the organization
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_and_user", (q) =>
        q.eq("organizationId", tournament.organizationId).eq("userId", authUserId)
      )
      .first();

    if (!membership) {
      throw new Error("Not authorized");
    }

    // Check tournament status
    if (tournament.status !== "draft" && tournament.status !== "registration") {
      throw new Error("Tournament is not open for registration");
    }

    // Check max participants
    const currentParticipants = await ctx.db
      .query("tournamentParticipants")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", args.tournamentId))
      .collect();

    if (currentParticipants.length >= tournament.maxParticipants) {
      throw new Error("Tournament is full");
    }

    // Validate participant type
    if (tournament.participantType === "team") {
      if (!args.teamId) {
        throw new Error("Team ID is required for team tournaments");
      }

      // Check team exists and belongs to organization
      const team = await ctx.db.get("teams", args.teamId);
      if (!team || team.organizationId !== tournament.organizationId) {
        throw new Error("Team not found or doesn't belong to organization");
      }

      // Check if team is already registered
      const existing = await ctx.db
        .query("tournamentParticipants")
        .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
        .first();

      if (existing && existing.tournamentId === args.tournamentId) {
        throw new Error("Team is already registered");
      }

      const participantId = await ctx.db.insert("tournamentParticipants", {
        tournamentId: args.tournamentId,
        teamId: args.teamId,
        displayName: args.displayName || team.name,
        wins: 0,
        losses: 0,
        draws: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        registeredAt: Date.now(),
      });

      return participantId;
    } else {
      // Individual participant
      const participantUserId = args.userId || authUserId;

      // Check if user is already registered
      const existingParticipants = await ctx.db
        .query("tournamentParticipants")
        .withIndex("by_user", (q) => q.eq("userId", participantUserId))
        .collect();

      const alreadyRegistered = existingParticipants.some(
        (p) => p.tournamentId === args.tournamentId
      );

      if (alreadyRegistered) {
        throw new Error("User is already registered");
      }

      // Get user name for display
      let displayName = args.displayName;
      if (!displayName) {
        const user = await ctx.db.get("users", participantUserId);
        displayName = user?.name || user?.email || "Unknown";
      }

      const participantId = await ctx.db.insert("tournamentParticipants", {
        tournamentId: args.tournamentId,
        userId: participantUserId,
        displayName,
        wins: 0,
        losses: 0,
        draws: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        registeredAt: Date.now(),
      });

      return participantId;
    }
  },
});

/**
 * Remove a participant from a tournament (before start)
 */
export const removeParticipant = mutation({
  args: { participantId: v.id("tournamentParticipants") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const participant = await ctx.db.get("tournamentParticipants", args.participantId);
    if (!participant) {
      throw new Error("Participant not found");
    }

    const tournament = await ctx.db.get("tournaments", participant.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Check user's role
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_and_user", (q) =>
        q.eq("organizationId", tournament.organizationId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      throw new Error("Not authorized");
    }

    // Only admins/owners can remove participants, or the participant themselves
    const canRemove =
      membership.role === "owner" ||
      membership.role === "admin" ||
      participant.userId === userId;

    if (!canRemove) {
      throw new Error("Not authorized to remove this participant");
    }

    // Can only remove before tournament starts
    if (tournament.status !== "draft" && tournament.status !== "registration") {
      throw new Error("Cannot remove participants after tournament has started");
    }

    await ctx.db.delete("tournamentParticipants", args.participantId);
    return null;
  },
});

/**
 * Update participant seeding (before start, admin/owner only)
 */
export const updateSeeding = mutation({
  args: {
    participantId: v.id("tournamentParticipants"),
    seed: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const participant = await ctx.db.get("tournamentParticipants", args.participantId);
    if (!participant) {
      throw new Error("Participant not found");
    }

    const tournament = await ctx.db.get("tournaments", participant.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Check user's role
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_and_user", (q) =>
        q.eq("organizationId", tournament.organizationId).eq("userId", userId)
      )
      .first();

    if (
      !membership ||
      (membership.role !== "owner" && membership.role !== "admin")
    ) {
      throw new Error("Not authorized");
    }

    // Can only update seeding before tournament starts
    if (tournament.status !== "draft" && tournament.status !== "registration") {
      throw new Error("Cannot update seeding after tournament has started");
    }

    await ctx.db.patch("tournamentParticipants", args.participantId, { seed: args.seed });
    return null;
  },
});

/**
 * Batch update seeding for multiple participants
 */
export const updateSeedingBatch = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    seedings: v.array(
      v.object({
        participantId: v.id("tournamentParticipants"),
        seed: v.number(),
      })
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const tournament = await ctx.db.get("tournaments", args.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Check user's role
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_and_user", (q) =>
        q.eq("organizationId", tournament.organizationId).eq("userId", userId)
      )
      .first();

    if (
      !membership ||
      (membership.role !== "owner" && membership.role !== "admin")
    ) {
      throw new Error("Not authorized");
    }

    // Can only update seeding before tournament starts
    if (tournament.status !== "draft" && tournament.status !== "registration") {
      throw new Error("Cannot update seeding after tournament has started");
    }

    // Update all seedings
    for (const { participantId, seed } of args.seedings) {
      const participant = await ctx.db.get("tournamentParticipants", participantId);
      if (participant && participant.tournamentId === args.tournamentId) {
        await ctx.db.patch("tournamentParticipants", participantId, { seed });
      }
    }

    return null;
  },
});
