import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { teamMemberRoles } from "./schema";

// ============================================
// Queries
// ============================================

/**
 * List teams for an organization
 */
export const listByOrganization = query({
  args: { organizationId: v.id("organizations") },
  returns: v.array(
    v.object({
      _id: v.id("teams"),
      _creationTime: v.number(),
      name: v.string(),
      image: v.optional(v.string()),
      captainUserId: v.id("users"),
      captainName: v.optional(v.string()),
      memberCount: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Check if user is a member of the organization
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_and_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      return [];
    }

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();

    const enriched = await Promise.all(
      teams.map(async (team) => {
        // Get captain info
        const captain = await ctx.db.get("users", team.captainUserId);

        // Count members
        const members = await ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", team._id))
          .collect();

        return {
          _id: team._id,
          _creationTime: team._creationTime,
          name: team.name,
          image: team.image,
          captainUserId: team.captainUserId,
          captainName: captain?.name ?? undefined,
          memberCount: members.length,
        };
      })
    );

    return enriched;
  },
});

/**
 * Get a single team with members
 */
export const getTeam = query({
  args: { teamId: v.id("teams") },
  returns: v.union(
    v.object({
      _id: v.id("teams"),
      _creationTime: v.number(),
      organizationId: v.id("organizations"),
      name: v.string(),
      image: v.optional(v.string()),
      captainUserId: v.id("users"),
      members: v.array(
        v.object({
          _id: v.id("teamMembers"),
          userId: v.id("users"),
          userName: v.optional(v.string()),
          userEmail: v.optional(v.string()),
          role: teamMemberRoles,
          joinedAt: v.number(),
        })
      ),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const team = await ctx.db.get("teams", args.teamId);
    if (!team) {
      return null;
    }

    // Check if user is a member of the organization
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_and_user", (q) =>
        q.eq("organizationId", team.organizationId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      return null;
    }

    // Get team members
    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const membersWithDetails = await Promise.all(
      teamMembers.map(async (member) => {
        const user = await ctx.db.get("users", member.userId);
        return {
          _id: member._id,
          userId: member.userId,
          userName: user?.name ?? undefined,
          userEmail: user?.email ?? undefined,
          role: member.role,
          joinedAt: member.joinedAt,
        };
      })
    );

    return {
      _id: team._id,
      _creationTime: team._creationTime,
      organizationId: team.organizationId,
      name: team.name,
      image: team.image,
      captainUserId: team.captainUserId,
      members: membersWithDetails,
    };
  },
});

/**
 * List teams that a user is a member of
 */
export const listMyTeams = query({
  args: { organizationId: v.id("organizations") },
  returns: v.array(
    v.object({
      _id: v.id("teams"),
      name: v.string(),
      image: v.optional(v.string()),
      myRole: teamMemberRoles,
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get all team memberships for this user
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const teams = await Promise.all(
      memberships.map(async (membership) => {
        const team = await ctx.db.get("teams", membership.teamId);
        if (!team || team.organizationId !== args.organizationId) {
          return null;
        }
        return {
          _id: team._id,
          name: team.name,
          image: team.image,
          myRole: membership.role,
        };
      })
    );

    return teams.filter((t) => t !== null);
  },
});

// ============================================
// Mutations
// ============================================

/**
 * Create a new team (creator becomes captain)
 */
export const createTeam = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
  },
  returns: v.id("teams"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user is a member of the organization
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_and_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      throw new Error("Not authorized");
    }

    // Create team
    const teamId = await ctx.db.insert("teams", {
      organizationId: args.organizationId,
      name: args.name,
      captainUserId: userId,
    });

    // Add creator as captain
    await ctx.db.insert("teamMembers", {
      teamId,
      userId,
      role: "captain",
      joinedAt: Date.now(),
    });

    return teamId;
  },
});

/**
 * Update team details (captain only)
 */
export const updateTeam = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const team = await ctx.db.get("teams", args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Check if user is captain or org admin/owner
    const isCaptain = team.captainUserId === userId;

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_and_user", (q) =>
        q.eq("organizationId", team.organizationId).eq("userId", userId)
      )
      .first();

    const isOrgAdmin =
      membership?.role === "owner" || membership?.role === "admin";

    if (!isCaptain && !isOrgAdmin) {
      throw new Error("Not authorized");
    }

    const updates: { name?: string } = {};
    if (args.name !== undefined) updates.name = args.name;

    await ctx.db.patch("teams", args.teamId, updates);
    return null;
  },
});

/**
 * Delete a team (captain or org admin/owner only)
 */
export const deleteTeam = mutation({
  args: { teamId: v.id("teams") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const team = await ctx.db.get("teams", args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Check if user is captain or org admin/owner
    const isCaptain = team.captainUserId === userId;

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_and_user", (q) =>
        q.eq("organizationId", team.organizationId).eq("userId", userId)
      )
      .first();

    const isOrgAdmin =
      membership?.role === "owner" || membership?.role === "admin";

    if (!isCaptain && !isOrgAdmin) {
      throw new Error("Not authorized");
    }

    // Delete team members
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    for (const member of members) {
      await ctx.db.delete("teamMembers", member._id);
    }

    // Delete team
    await ctx.db.delete("teams", args.teamId);
    return null;
  },
});

/**
 * Add a member to a team
 */
export const addMember = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: v.optional(teamMemberRoles),
  },
  returns: v.id("teamMembers"),
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      throw new Error("Not authenticated");
    }

    const team = await ctx.db.get("teams", args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Check if user is captain or org admin/owner
    const isCaptain = team.captainUserId === authUserId;

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_and_user", (q) =>
        q.eq("organizationId", team.organizationId).eq("userId", authUserId)
      )
      .first();

    const isOrgAdmin =
      membership?.role === "owner" || membership?.role === "admin";

    if (!isCaptain && !isOrgAdmin) {
      throw new Error("Not authorized");
    }

    // Check if user to add is a member of the organization
    const targetMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_and_user", (q) =>
        q.eq("organizationId", team.organizationId).eq("userId", args.userId)
      )
      .first();

    if (!targetMembership) {
      throw new Error("User is not a member of this organization");
    }

    // Check if user is already a team member
    const existingMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", args.userId)
      )
      .first();

    if (existingMember) {
      throw new Error("User is already a team member");
    }

    const memberId = await ctx.db.insert("teamMembers", {
      teamId: args.teamId,
      userId: args.userId,
      role: args.role || "player",
      joinedAt: Date.now(),
    });

    return memberId;
  },
});

/**
 * Remove a member from a team
 */
export const removeMember = mutation({
  args: { memberId: v.id("teamMembers") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const teamMember = await ctx.db.get("teamMembers", args.memberId);
    if (!teamMember) {
      throw new Error("Team member not found");
    }

    const team = await ctx.db.get("teams", teamMember.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Check if user is captain, org admin/owner, or removing themselves
    const isCaptain = team.captainUserId === userId;
    const isSelf = teamMember.userId === userId;

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_and_user", (q) =>
        q.eq("organizationId", team.organizationId).eq("userId", userId)
      )
      .first();

    const isOrgAdmin =
      membership?.role === "owner" || membership?.role === "admin";

    if (!isCaptain && !isOrgAdmin && !isSelf) {
      throw new Error("Not authorized");
    }

    // Cannot remove captain unless transferring captaincy
    if (teamMember.userId === team.captainUserId) {
      throw new Error("Cannot remove team captain. Transfer captaincy first.");
    }

    await ctx.db.delete("teamMembers", args.memberId);
    return null;
  },
});

/**
 * Transfer team captaincy
 */
export const transferCaptaincy = mutation({
  args: {
    teamId: v.id("teams"),
    newCaptainUserId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const team = await ctx.db.get("teams", args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Only current captain or org admin/owner can transfer
    const isCaptain = team.captainUserId === userId;

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_and_user", (q) =>
        q.eq("organizationId", team.organizationId).eq("userId", userId)
      )
      .first();

    const isOrgAdmin =
      membership?.role === "owner" || membership?.role === "admin";

    if (!isCaptain && !isOrgAdmin) {
      throw new Error("Not authorized");
    }

    // Check new captain is a team member
    const newCaptainMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", args.newCaptainUserId)
      )
      .first();

    if (!newCaptainMembership) {
      throw new Error("New captain must be a team member");
    }

    // Update old captain's role
    const oldCaptainMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", team.captainUserId)
      )
      .first();

    if (oldCaptainMembership) {
      await ctx.db.patch("teamMembers", oldCaptainMembership._id, { role: "player" });
    }

    // Update new captain's role
    await ctx.db.patch("teamMembers", newCaptainMembership._id, { role: "captain" });

    // Update team captain
    await ctx.db.patch("teams", args.teamId, { captainUserId: args.newCaptainUserId });

    return null;
  },
});
