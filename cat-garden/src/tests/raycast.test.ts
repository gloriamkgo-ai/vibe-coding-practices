import { describe, expect, it } from "vitest";
import { VoxelWorld } from "../world/voxelWorld";
import { B } from "../world/blocks";
import { raycastVoxels } from "../player/raycast";

describe("voxel raycast", () => {
  const w = new VoxelWorld(16, 16, 16);
  w.fill(0, 5, 10, 15, 8, 10, B.STONE);

  it("finds the first wall along the ray", () => {
    expect(raycastVoxels(w, 4.5, 6.5, 4.5, 0, 0, 1, 20)).toBeCloseTo(5.5, 5);
  });
  it("returns the max distance when the path is clear", () => {
    expect(raycastVoxels(w, 4.5, 6.5, 4.5, 0, 0, -1, 3)).toBe(3);
  });
  it("handles diagonal rays", () => {
    const d = raycastVoxels(w, 4.5, 6.5, 4.5, 1, 0, 1, 20);
    expect(d).toBeCloseTo(5.5 * Math.SQRT2, 4);
  });
});
