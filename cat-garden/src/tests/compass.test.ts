import { describe, expect, it } from "vitest";
import { headingOf, nearestTarget } from "../systems/compass";

describe("compass", () => {
  it("uses yaw 0 = north (−z) and counter-clockwise headings", () => {
    expect(headingOf(0, -1)).toBeCloseTo(0);
    expect(headingOf(-1, 0)).toBeCloseTo(Math.PI / 2);   // west
    expect(headingOf(1, 0)).toBeCloseTo(-Math.PI / 2);   // east
  });

  const orbs = [
    { id: 0, pos: [0, 0, -10] as [number, number, number] },
    { id: 1, pos: [20, 0, 0] as [number, number, number] },
  ];

  it("points at the nearest orb that is still uncollected", () => {
    expect(nearestTarget(0, 0, 0, 0, orbs, [false, false])!.id).toBe(0);
    expect(nearestTarget(0, 0, 0, 0, orbs, [true, false])!.id).toBe(1);
    expect(nearestTarget(0, 0, 0, 0, orbs, [true, true])).toBeNull();
  });

  it("reports the orb straight ahead as 0 and an orb to the right as negative", () => {
    expect(nearestTarget(0, 0, 0, 0, orbs, [false, false])!.rel).toBeCloseTo(0);
    expect(nearestTarget(0, 0, 0, 0, orbs, [true, false])!.rel).toBeCloseTo(-Math.PI / 2);
    // Turn to face east: the east orb is now dead ahead
    expect(nearestTarget(0, 0, 0, -Math.PI / 2, orbs, [true, false])!.rel).toBeCloseTo(0);
  });
});
