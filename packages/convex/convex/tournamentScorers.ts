import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * List scorers assigned to a tournament
 */
export const listScorers = query({
  args: { tournamentId: v.id("tournaments") },
  returns: v.array(
    v.object({
      _id: v.id("tournamentScorers"),
      userId: v.id("users"),
      userName: v.optional(v.string()),
      userEmail: v.optional(v.string()),
      assignedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const tournament = await ctx.db.get("tournaments", args.tournamentId);
    if (!tournament) {
      return [];
    }

    // Check if user is owner/admin of the organization
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_and_user", (q) =>
        q.eq("organizationId", tournament.organizationId).eq("userId", userId)
      )
      .first();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      return [];
    }

    const scorers = await ctx.db
      .query("tournamentScorers")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", args.tournamentId))
      .collect();

    const results = await Promise.all(
      scorers.map(async (scorer) => {
        const user = await ctx.db.get("users", scorer.userId);
        return {
          _id: scorer._id,
          userId: scorer.userId,
          userName: user?.name,
          userEmail: user?.email,
          assignedAt: scorer.assignedAt,
        };
      })
    );

    return results;
  },
});

/**
 * Assign a scorer to a tournament (owner/admin only)
 */
export const assignScorer = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    userId: v.id("users"),
  },
  returns: v.id("tournamentScorers"),
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const tournament = await ctx.db.get("tournaments", args.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Check if current user is owner/admin of the organization
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_and_user", (q) =>
        q.eq("organizationId", tournament.organizationId).eq("userId", currentUserId)
      )
      .first();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Not authorized. Only owners and admins can assign scorers.");
    }

    // Check if user being assigned is a member of the organization
    const targetMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_and_user", (q) =>
        q.eq("organizationId", tournament.organizationId).eq("userId", args.userId)
      )
      .first();

    if (!targetMembership) {
      throw new Error("User must be a member of the organization");
    }

    // Check if already assigned
    const existing = await ctx.db
      .query("tournamentScorers")
      .withIndex("by_tournament_and_user", (q) =>
        q.eq("tournamentId", args.tournamentId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      throw new Error("User is already assigned to this tournament");
    }

    const scorerId = await ctx.db.insert("tournamentScorers", {
      tournamentId: args.tournamentId,
      userId: args.userId,
      assignedBy: currentUserId,
      assignedAt: Date.now(),
    });

    return scorerId;
  },
});

/**
 * Remove a scorer from a tournament (owner/admin only)
 */
export const removeScorer = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const tournament = await ctx.db.get("tournaments", args.tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Check if current user is owner/admin of the organization
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_and_user", (q) =>
        q.eq("organizationId", tournament.organizationId).eq("userId", currentUserId)
      )
      .first();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Not authorized. Only owners and admins can remove scorers.");
    }

    // Find the assignment
    const assignment = await ctx.db
      .query("tournamentScorers")
      .withIndex("by_tournament_and_user", (q) =>
        q.eq("tournamentId", args.tournamentId).eq("userId", args.userId)
      )
      .first();

    if (!assignment) {
      throw new Error("User is not assigned to this tournament");
    }

    await ctx.db.delete(assignment._id);
    return null;
  },
});

/**
 * Check if current user is assigned to a tournament
 */
export const isAssigned = query({
  args: { tournamentId: v.id("tournaments") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false;
    }

    const assignment = await ctx.db
      .query("tournamentScorers")
      .withIndex("by_tournament_and_user", (q) =>
        q.eq("tournamentId", args.tournamentId).eq("userId", userId)
      )
      .first();

    return !!assignment;
  },
});
