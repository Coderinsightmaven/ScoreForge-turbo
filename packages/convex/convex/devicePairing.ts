import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { randomString } from "./lib/crypto";
import { errors } from "./lib/errors";
import { getCurrentUserOrThrow } from "./users";
import { assertNotInMaintenance } from "./lib/maintenance";
import { validateStringLength, MAX_LENGTHS } from "./lib/validation";
import { createApiKeyForUser, hashKey } from "./apiKeys";

const PAIRING_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PAIRING_SECRET_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const PAIRING_CODE_LENGTH = 6;
const PAIRING_SECRET_LENGTH = 40;
const PAIRING_EXPIRY_MS = 10 * 60 * 1000;
const PAIRING_POLL_INTERVAL_MS = 2_000;

async function generateUniquePairingCode(ctx: { db: any }): Promise<string> {
  const now = Date.now();

  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomString(PAIRING_CODE_LENGTH, PAIRING_CODE_ALPHABET);
    const existing = await ctx.db
      .query("displayPairings")
      .withIndex("by_pairing_code", (q: any) => q.eq("pairingCode", code))
      .collect();
    const hasActiveCode = existing.some((session: any) => {
      return session.status === "pending" && session.expiresAt > now;
    });
    if (!hasActiveCode) {
      return code;
    }
  }

  throw errors.conflict("Unable to generate a unique pairing code. Please try again.");
}

/**
 * Start device pairing from the display app.
 * Returns a short code for the user to enter in the web app and a secret for polling.
 */
export const startPairing = mutation({
  args: {},
  returns: v.object({
    pairingId: v.id("displayPairings"),
    pairingCode: v.string(),
    pairingSecret: v.string(),
    expiresAt: v.number(),
    pollIntervalMs: v.number(),
  }),
  handler: async (ctx) => {
    const pairingCode = await generateUniquePairingCode(ctx);
    const pairingSecret = randomString(PAIRING_SECRET_LENGTH, PAIRING_SECRET_ALPHABET);
    const pairingSecretHash = await hashKey(pairingSecret);
    const createdAt = Date.now();
    const expiresAt = createdAt + PAIRING_EXPIRY_MS;

    const pairingId = await ctx.db.insert("displayPairings", {
      pairingCode,
      pairingSecretHash,
      status: "pending",
      createdAt,
      expiresAt,
    });

    return {
      pairingId,
      pairingCode,
      pairingSecret,
      expiresAt,
      pollIntervalMs: PAIRING_POLL_INTERVAL_MS,
    };
  },
});

/**
 * Complete pairing from the authenticated web app user.
 * Creates a display API key and binds it to the pairing session for one-time claim.
 */
export const completePairing = mutation({
  args: {
    pairingCode: v.string(),
    deviceName: v.optional(v.string()),
  },
  returns: v.object({
    pairingCode: v.string(),
    keyPrefix: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const userId = user._id;
    await assertNotInMaintenance(ctx, userId);

    const normalizedCode = args.pairingCode.trim().toUpperCase();
    if (!/^[A-Z2-9]{6}$/.test(normalizedCode)) {
      throw errors.invalidInput("Pairing code must be a 6-character code.");
    }

    const sessions = await ctx.db
      .query("displayPairings")
      .withIndex("by_pairing_code", (q) => q.eq("pairingCode", normalizedCode))
      .collect();
    const session = sessions.sort((a, b) => b.createdAt - a.createdAt)[0];
    if (!session) {
      throw errors.notFound("Pairing session");
    }

    if (session.status !== "pending") {
      throw errors.invalidState("Pairing code is no longer pending.");
    }
    if (session.expiresAt <= Date.now()) {
      await ctx.db.patch("displayPairings", session._id, { status: "expired" });
      throw errors.invalidState("Pairing code has expired.");
    }

    const normalizedDeviceName = args.deviceName?.trim() || undefined;
    validateStringLength(normalizedDeviceName, "Device name", MAX_LENGTHS.apiKeyName);

    const apiKeyName = normalizedDeviceName
      ? `Display - ${normalizedDeviceName}`
      : `Display ${normalizedCode}`;
    const { keyId, fullKey, keyPrefix } = await createApiKeyForUser(ctx, {
      userId,
      name: apiKeyName,
    });

    await ctx.db.patch("displayPairings", session._id, {
      status: "paired",
      pairedAt: Date.now(),
      pairedByUserId: userId,
      apiKeyId: keyId,
      apiKeyValue: fullKey,
      deviceName: normalizedDeviceName,
    });

    return {
      pairingCode: normalizedCode,
      keyPrefix,
    };
  },
});

/**
 * Poll from display app to check pairing status and claim API key once available.
 */
export const pollPairing = mutation({
  args: {
    pairingId: v.id("displayPairings"),
    pairingSecret: v.string(),
  },
  returns: v.union(
    v.object({
      status: v.literal("pending"),
      expiresAt: v.number(),
    }),
    v.object({
      status: v.literal("paired"),
      apiKey: v.string(),
    }),
    v.object({
      status: v.literal("claimed"),
    }),
    v.object({
      status: v.literal("expired"),
    }),
    v.object({
      status: v.literal("invalid"),
    })
  ),
  handler: async (ctx, args) => {
    const session = await ctx.db.get("displayPairings", args.pairingId);
    if (!session) {
      return { status: "invalid" as const };
    }

    const pairingSecretHash = await hashKey(args.pairingSecret);
    if (pairingSecretHash !== session.pairingSecretHash) {
      return { status: "invalid" as const };
    }

    const now = Date.now();
    if (session.status === "pending" && session.expiresAt <= now) {
      await ctx.db.patch("displayPairings", session._id, { status: "expired" });
      return { status: "expired" as const };
    }

    if (session.status === "pending") {
      return {
        status: "pending" as const,
        expiresAt: session.expiresAt,
      };
    }

    if (session.status === "paired") {
      if (!session.apiKeyValue) {
        return { status: "claimed" as const };
      }
      const apiKey = session.apiKeyValue;
      await ctx.db.patch("displayPairings", session._id, {
        status: "claimed",
        claimedAt: now,
        apiKeyValue: undefined,
      });
      return {
        status: "paired" as const,
        apiKey,
      };
    }

    return { status: session.status };
  },
});
