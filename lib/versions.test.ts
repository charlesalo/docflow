import { describe, expect, it } from "vitest";
import { shouldCreateSnapshot, SNAPSHOT_THROTTLE_MS } from "@/lib/versions";

describe("shouldCreateSnapshot", () => {
  it("snapshots immediately when there is no prior version", () => {
    expect(shouldCreateSnapshot(null, new Date())).toBe(true);
  });

  it("does not snapshot again within the throttle window", () => {
    const now = new Date("2026-01-01T00:10:00.000Z");
    const lastVersionAt = new Date(now.getTime() - (SNAPSHOT_THROTTLE_MS - 1000));
    expect(shouldCreateSnapshot(lastVersionAt, now)).toBe(false);
  });

  it("snapshots again once the throttle window has elapsed", () => {
    const now = new Date("2026-01-01T00:10:00.000Z");
    const lastVersionAt = new Date(now.getTime() - SNAPSHOT_THROTTLE_MS);
    expect(shouldCreateSnapshot(lastVersionAt, now)).toBe(true);
  });
});
