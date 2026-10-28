import { describe, expect, it } from "vitest";
import { projectWealth, targetYear } from "./projectionUtils";

describe("wealth projection", () => {
  it("compounds the starting balance and monthly contributions", () => {
    const points = projectWealth(10_000, 500, 6, 2.5, 10);
    expect(points).toHaveLength(11);
    expect(points.at(-1)?.nominal).toBeGreaterThan(90_000);
    expect(points.at(-1)?.real).toBeLessThan(points.at(-1)?.nominal ?? 0);
  });

  it("finds the first projected year that reaches a target", () => {
    expect(targetYear(projectWealth(0, 1_000, 0, 0, 10), 50_000)).toBe(5);
  });
});
