import { describe, expect, it } from "vitest";
import { getTestContext } from "./testSetup";
import { api } from "../convex/_generated/api";

type TestCtx = ReturnType<typeof getTestContext>;

async function setupUser(t: TestCtx, subject: string) {
  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      name: "Display Owner",
      email: "display-owner@example.com",
      externalId: subject,
    });
  });
  return t.withIdentity({ subject });
}

describe("devicePairing.startPairing", () => {
  it("creates a pending pairing session with code and secret", async () => {
    const t = getTestContext();
    const result = await t.mutation(api.devicePairing.startPairing, {});

    expect(result.pairingCode).toHaveLength(6);
    expect(result.pairingSecret.length).toBeGreaterThanOrEqual(32);
    expect(result.expiresAt).toBeGreaterThan(Date.now());
    expect(result.pollIntervalMs).toBe(2000);

    const stored = await t.run(async (ctx) => ctx.db.get(result.pairingId));
    expect(stored).not.toBeNull();
    expect(stored!.status).toBe("pending");
    expect(stored!.pairingCode).toBe(result.pairingCode);
    expect(stored!.pairingSecretHash).not.toBe(result.pairingSecret);
  });
});

describe("devicePairing pairing lifecycle", () => {
  it("pairs and delivers API key exactly once", async () => {
    const t = getTestContext();
    const started = await t.mutation(api.devicePairing.startPairing, {});

    const pending = await t.mutation(api.devicePairing.pollPairing, {
      pairingId: started.pairingId,
      pairingSecret: started.pairingSecret,
    });
    expect(pending.status).toBe("pending");

    const asUser = await setupUser(t, "clerk_user_device_pairing");
    const completed = await asUser.mutation(api.devicePairing.completePairing, {
      pairingCode: started.pairingCode,
      deviceName: "Center Court Screen",
    });
    expect(completed.pairingCode).toBe(started.pairingCode);
    expect(completed.keyPrefix.startsWith("sf_")).toBe(true);

    const paired = await t.mutation(api.devicePairing.pollPairing, {
      pairingId: started.pairingId,
      pairingSecret: started.pairingSecret,
    });
    expect(paired.status).toBe("paired");
    if (paired.status === "paired") {
      expect(paired.apiKey.startsWith("sf_")).toBe(true);
    }

    const claimed = await t.mutation(api.devicePairing.pollPairing, {
      pairingId: started.pairingId,
      pairingSecret: started.pairingSecret,
    });
    expect(claimed.status).toBe("claimed");
  });

  it("returns invalid for wrong pairing secret", async () => {
    const t = getTestContext();
    const started = await t.mutation(api.devicePairing.startPairing, {});

    const result = await t.mutation(api.devicePairing.pollPairing, {
      pairingId: started.pairingId,
      pairingSecret: "wrong-secret",
    });
    expect(result.status).toBe("invalid");
  });
});
