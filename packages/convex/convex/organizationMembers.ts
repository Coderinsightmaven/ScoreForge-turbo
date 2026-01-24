import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { organizationRoles } from "./schema";

// Role hierarchy: owner > admin > scorer
const roleHierarchy = { owner: 3, admin: 2, scorer: 1 };

type Role = "owner" | "admin" | "scorer";

function canManageRole(actorRole: Role, targetRole: Role): boolean {
  return roleHierarchy[actorRole] > roleHierarchy[targetRole];
}

// ============================================
// Queries
// ============================================

/**
 * Get all members of an organization
 */
export const listMembers = query({
  args: { organizationId: v.id("organizations") },
  returns: v.array(
    v.object({
      _id: v.id("organizationMembers"),
      userId: v.id("users"),
      role: organizationRoles,
      joinedAt: v.number(),
      user: v.object({
        _id: v.id("users"),
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        image: v.optional(v.string()),
      }),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Check if user is a member of the organization
    const myMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_and_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", userId)
      )
      .first();

    if (!myMembership) {
      return [];
    }

    // Get all members
    const members = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    // Fetch user details for each member
    const membersWithUsers = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          _id: member._id,
          userId: member.userId,
          role: member.role,
          joinedAt: member.joinedAt,
          user: {
            _id: member.userId,
            name: user?.name,
            email: user?.email,
            image: user?.image,
          },
        };
      })
    );

    // Sort by role hierarchy (owners first, then admins, then scorers)
    return membersWithUsers.sort(
      (a, b) => roleHierarchy[b.role] - roleHierarchy[a.role]
    );
  },
});

/**
 * Get my membership in an organization
 */
export const getMyMembership = query({
  args: { organizationId: v.id("organizations") },
  returns: v.union(
    v.object({
      _id: v.id("organizationMembers"),
      role: organizationRoles,
      joinedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_and_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      return null;
    }

    return {
      _id: membership._id,
      role: membership.role,
      joinedAt: membership.joinedAt,
    };
  },
});

/**
 * Search for users to add to an organization
 * Returns users who are not already members
 */
export const searchUsersToAdd = query({
  args: {
    organizationId: v.id("organizations"),
    searchTerm: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("users"),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      image: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Check if user is admin or owner
    const myMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_and_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", userId)
      )
      .first();

    if (!myMembership || myMembership.role === "scorer") {
      return [];
    }

    // Get existing member user IDs
    const existingMembers = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    const existingUserIds = new Set(existingMembers.map((m) => m.userId));

    // Search for users by name or email
    const searchLower = args.searchTerm.toLowerCase();
    const allUsers = await ctx.db.query("users").collect();

    const matchingUsers = allUsers
      .filter((user) => {
        // Exclude existing members
        if (existingUserIds.has(user._id)) return false;
        // Match by name or email
        const nameMatch = user.name?.toLowerCase().includes(searchLower);
        const emailMatch = user.email?.toLowerCase().includes(searchLower);
        return nameMatch || emailMatch;
      })
      .slice(0, 10); // Limit results

    return matchingUsers.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
    }));
  },
});

// ============================================
// Mutations
// ============================================

/**
 * Add a user to an organization (admin/owner only)
 */
export const addMember = mutation({
  args: {
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: organizationRoles,
  },
  returns: v.id("organizationMembers"),
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    // Check user's role
    const myMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_and_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", currentUserId)
      )
      .first();

    if (!myMembership) {
      throw new Error("Not a member of this organization");
    }

    // Only owners and admins can add members
    if (myMembership.role === "scorer") {
      throw new Error("Scorers cannot add members");
    }

    // Admins cannot add owners or other admins
    if (myMembership.role === "admin" && args.role !== "scorer") {
      throw new Error("Admins can only add scorers");
    }

    // Verify the user exists
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Check if already a member
    const existingMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_and_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId)
      )
      .first();

    if (existingMembership) {
      throw new Error("User is already a member of this organization");
    }

    // Add the member
    const membershipId = await ctx.db.insert("organizationMembers", {
      organizationId: args.organizationId,
      userId: args.userId,
      role: args.role,
      invitedBy: currentUserId,
      joinedAt: Date.now(),
    });

    return membershipId;
  },
});

/**
 * Update a member's role (admin/owner only)
 */
export const updateMemberRole = mutation({
  args: {
    memberId: v.id("organizationMembers"),
    newRole: organizationRoles,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const targetMembership = await ctx.db.get(args.memberId);
    if (!targetMembership) {
      throw new Error("Member not found");
    }

    // Check user's role
    const myMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_and_user", (q) =>
        q.eq("organizationId", targetMembership.organizationId).eq("userId", userId)
      )
      .first();

    if (!myMembership) {
      throw new Error("Not a member of this organization");
    }

    // Cannot change your own role
    if (targetMembership.userId === userId) {
      throw new Error("Cannot change your own role");
    }

    // Check permissions based on role hierarchy
    if (!canManageRole(myMembership.role, targetMembership.role)) {
      throw new Error("Cannot modify this member's role");
    }

    if (!canManageRole(myMembership.role, args.newRole) && myMembership.role !== args.newRole) {
      throw new Error("Cannot assign this role");
    }

    // Only owner can create new owners
    if (args.newRole === "owner" && myMembership.role !== "owner") {
      throw new Error("Only owners can promote to owner");
    }

    await ctx.db.patch(args.memberId, { role: args.newRole });
    return null;
  },
});

/**
 * Remove a member from the organization (admin/owner only)
 */
export const removeMember = mutation({
  args: { memberId: v.id("organizationMembers") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const targetMembership = await ctx.db.get(args.memberId);
    if (!targetMembership) {
      throw new Error("Member not found");
    }

    // Check user's role
    const myMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_and_user", (q) =>
        q.eq("organizationId", targetMembership.organizationId).eq("userId", userId)
      )
      .first();

    if (!myMembership) {
      throw new Error("Not a member of this organization");
    }

    // Cannot remove yourself (use leaveOrganization instead)
    if (targetMembership.userId === userId) {
      throw new Error("Cannot remove yourself. Use leave organization instead.");
    }

    // Check permissions based on role hierarchy
    if (!canManageRole(myMembership.role, targetMembership.role)) {
      throw new Error("Cannot remove this member");
    }

    await ctx.db.delete(args.memberId);
    return null;
  },
});

/**
 * Leave an organization (any member)
 */
export const leaveOrganization = mutation({
  args: { organizationId: v.id("organizations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_and_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      throw new Error("Not a member of this organization");
    }

    // Owner cannot leave if they're the only owner
    if (membership.role === "owner") {
      const owners = await ctx.db
        .query("organizationMembers")
        .withIndex("by_organization_and_role", (q) =>
          q.eq("organizationId", args.organizationId).eq("role", "owner")
        )
        .collect();

      if (owners.length === 1) {
        throw new Error(
          "Cannot leave organization as the only owner. Transfer ownership or delete the organization."
        );
      }
    }

    await ctx.db.delete(membership._id);
    return null;
  },
});

/**
 * Transfer ownership to another member (owner only)
 */
export const transferOwnership = mutation({
  args: {
    organizationId: v.id("organizations"),
    newOwnerId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check current user is owner
    const myMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_and_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", userId)
      )
      .first();

    if (!myMembership || myMembership.role !== "owner") {
      throw new Error("Only owners can transfer ownership");
    }

    // Check new owner is a member
    const newOwnerMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_and_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.newOwnerId)
      )
      .first();

    if (!newOwnerMembership) {
      throw new Error("New owner must be a member of the organization");
    }

    // Update roles
    await ctx.db.patch(newOwnerMembership._id, { role: "owner" });
    await ctx.db.patch(myMembership._id, { role: "admin" });

    // Update organization createdBy
    await ctx.db.patch(args.organizationId, { createdBy: args.newOwnerId });

    return null;
  },
});
