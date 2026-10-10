import { describe, expect, it } from "vitest";
import { VoxelWorld } from "../world/voxelWorld";
import { B } from "../world/blocks";
import { createPlayer, stepPlayer, PHYS, collides } from "../player/physics";

const idle = { moveX: 0, moveZ: 0, sprint: false, jumpPressed: false };

function flat() {
  const w = new VoxelWorld(16, 16, 16);
  w.fill(0, 0, 0, 15, 3, 15, B.STONE);
  return w;
}
const run = (w: VoxelWorld, p: ReturnType<typeof createPlayer>, input: typeof idle, seconds: number) => {
  for (let t = 0; t < seconds; t += PHYS.fixedDt) stepPlayer(p, input, w);
};

describe("player collision", () => {
  it("lands on the ground and stays there", () => {
    const w = flat();
    const p = createPlayer(8, 8, 8);
    run(w, p, idle, 2);
    expect(p.y).toBeCloseTo(4, 3);
    expect(p.onGround).toBe(true);
  });

  it("stops at a full-block wall instead of passing through", () => {
    const w = flat();
    w.fill(10, 4, 0, 10, 6, 15, B.STONE);
    const p = createPlayer(8, 4, 8);
    run(w, p, { ...idle, moveX: 1, sprint: true }, 3);
    expect(p.x).toBeLessThan(10 - PHYS.halfWidth + 0.01);
    expect(collides(w, p.x, p.y, p.z)).toBe(false);
  });

  it("walks up a slab without jumping but not up a full block", () => {
    const w = flat();
    w.fill(10, 4, 0, 15, 4, 15, B.STONE_SLAB);
    const p = createPlayer(8, 4, 8);
    run(w, p, { ...idle, moveX: 1 }, 1.5);
    expect(p.y).toBeCloseTo(4.5, 2);

    const w2 = flat();
    w2.fill(10, 4, 0, 15, 4, 15, B.STONE);
    const q = createPlayer(8, 4, 8);
    run(w2, q, { ...idle, moveX: 1 }, 1.5);
    expect(q.y).toBeCloseTo(4, 2);
  });

  it("jumps about 1.35 blocks high", () => {
    const w = flat();
    const p = createPlayer(8, 4, 8);
    run(w, p, idle, 0.2);
    stepPlayer(p, { ...idle, jumpPressed: true }, w);
    let top = p.y;
    for (let i = 0; i < 120; i++) { stepPlayer(p, idle, w); top = Math.max(top, p.y); }
    expect(top - 4).toBeGreaterThan(1.25);
    expect(top - 4).toBeLessThan(1.45);
  });

  it("still jumps shortly after walking off a ledge (coyote time)", () => {
    const w = flat();
    w.fill(0, 4, 0, 7, 4, 15, B.STONE);
    const p = createPlayer(7.5, 5, 8);
    run(w, p, idle, 0.3);
    let jumped = false;
    for (let i = 0; i < 120 && !jumped; i++) {
      const offEdge = p.x - PHYS.halfWidth > 8.0 && !p.onGround;
      stepPlayer(p, { ...idle, moveX: 1, jumpPressed: offEdge }, w);
      if (p.jumped) jumped = true;
    }
    expect(jumped).toBe(true);
  });

  it("returns to the last safe spot after falling into water", () => {
    const w = flat();
    w.fill(10, 1, 0, 15, 3, 15, B.WATER);
    const p = createPlayer(8, 4, 8);
    run(w, p, idle, 0.5);
    for (let i = 0; i < 400 && p.respawns === 0; i++) stepPlayer(p, { ...idle, moveX: 1 }, w);
    expect(p.respawns).toBe(1);
    expect(p.x).toBeLessThan(10);
    expect(p.y).toBeCloseTo(4, 1);
  });
});
