import { B } from "./blocks";
import { VoxelWorld } from "./voxelWorld";

/*
  Garden plan (x → east, z → south, y ↑). Ground surface is y = 4.
    z  2–12  upper terrace (surface 6): main hall, drum tower and its stone ramp
    z 13–22  lower terrace (surface 5)
    z 28–45  pond (x 9–24) with an arched bridge (z 34–35) and stepping stones (z 42–43)
    z 46–56  pagoda (x 44–52) and the torii gate (z 55)
  Every height and gap below is chosen against the player physics in player/physics.ts:
  jump ≈ 1.35 blocks high, ≈ 2.8 blocks far walking, ≈ 4.6 blocks sprinting.
*/

export const SPAWN = { x: 32, y: 4, z: 60.5, yaw: 0 };

function slabColumn(w: VoxelWorld, x: number, z: number, fromY: number, top: number, full: number, half: number) {
  const whole = Math.floor(top);
  if (whole - 1 >= fromY) w.fill(x, fromY, z, x, whole - 1, z, full);
  if (top - whole > 0.01) w.set(x, whole, z, half);
}

function lantern(w: VoxelWorld, x: number, z: number, base: number) {
  w.set(x, base, z, B.STONE);
  w.set(x, base + 1, z, B.STONE);
  w.set(x, base + 2, z, B.LANTERN);
  w.set(x, base + 3, z, B.TILE_SLAB);
}

function cherryTree(w: VoxelWorld, x: number, z: number, base: number, trunk: number, r = 3) {
  w.fill(x, base, z, x, base + trunk - 1, z, B.BARK);
  const cy = base + trunk + 1;
  for (let dy = -2; dy <= r; dy++)
    for (let dz = -r; dz <= r; dz++)
      for (let dx = -r; dx <= r; dx++) {
        const d = Math.sqrt(dx * dx + dy * dy * 1.3 + dz * dz);
        const jag = ((x + dx) * 7 + (z + dz) * 13 + (cy + dy) * 5) % 5 === 0 ? 0.6 : 0;
        if (d <= r + 0.3 - jag && w.get(x + dx, cy + dy, z + dz) === B.AIR) w.set(x + dx, cy + dy, z + dz, B.LEAVES);
      }
}

export function buildGarden(): VoxelWorld {
  const w = new VoxelWorld(64, 32, 64);

  // Ground
  w.fill(0, 0, 0, 63, 2, 63, B.DIRT);
  w.fill(0, 3, 0, 63, 3, 63, B.GRASS);

  // Terraces
  w.fill(6, 4, 13, 57, 4, 22, B.GRASS);
  w.fill(6, 4, 22, 57, 4, 22, B.STONE);
  w.fill(6, 4, 13, 6, 4, 22, B.STONE);
  w.fill(57, 4, 13, 57, 4, 22, B.STONE);
  w.fill(6, 4, 2, 57, 4, 12, B.STONE);
  w.fill(6, 5, 2, 57, 5, 12, B.GRASS);
  w.fill(6, 5, 12, 57, 5, 12, B.STONE);

  // Hedge border
  for (const [a, b, c, d] of [[0, 0, 63, 0], [0, 63, 63, 63], [0, 0, 0, 63], [63, 0, 63, 63]])
    w.fill(a, 4, b, c, 5, d, B.HEDGE);

  // Stone paths
  w.fill(30, 3, 24, 33, 3, 62, B.PATH);
  w.fill(30, 4, 23, 33, 4, 23, B.PATH_SLAB);
  w.fill(30, 4, 13, 33, 4, 22, B.PATH);
  w.fill(30, 5, 13, 33, 5, 13, B.PATH_SLAB);
  w.fill(30, 5, 12, 33, 5, 12, B.PATH);
  w.fill(25, 3, 34, 29, 3, 35, B.PATH);
  w.fill(25, 3, 42, 29, 3, 43, B.PATH);
  w.fill(2, 3, 34, 7, 3, 35, B.PATH);
  w.fill(4, 3, 36, 5, 3, 43, B.PATH);

  // Pond with a stone rim
  w.fill(8, 3, 27, 25, 3, 46, B.STONE);
  w.fill(9, 1, 28, 24, 3, 45, B.WATER);
  w.fill(25, 3, 34, 25, 3, 35, B.PATH);
  w.fill(25, 3, 42, 25, 3, 43, B.PATH);

  // Arched bridge across the pond (z 34–35)
  const deck: [number, number][] = [[8, 4.5], [9, 5], [10, 5.5], [11, 6], [12, 6.5]];
  for (let x = 13; x <= 20; x++) deck.push([x, 7]);
  deck.push([21, 6.5], [22, 6], [23, 5.5], [24, 5], [25, 4.5]);
  for (const [x, top] of deck) {
    for (const z of [34, 35]) slabColumn(w, x, z, x === 8 || x === 25 ? 4 : Math.max(4, Math.floor(top) - 1), top, B.RED, B.RED_SLAB);
    for (const z of [33, 36]) w.set(x, Math.floor(top), z, x % 2 === 0 ? B.DARK : B.RED);
  }
  for (const x of [13, 20]) w.fill(x, 1, 34, x, 5, 35, B.DARK);

  // Stepping stones (z 42–43)
  for (const x of [22, 19, 16, 13, 10]) w.fill(x, 1, 42, x, 3, 43, B.STONE);

  // Torii gate at the entrance
  w.fill(28, 4, 55, 28, 9, 55, B.RED);
  w.fill(35, 4, 55, 35, 9, 55, B.RED);
  w.fill(29, 8, 55, 34, 8, 55, B.RED);
  w.fill(26, 10, 55, 37, 10, 55, B.RED);
  w.fill(25, 11, 55, 38, 11, 55, B.DARK);
  w.fill(31, 9, 55, 32, 9, 55, B.GOLD);

  // Stone lanterns
  for (const [x, z] of [[27, 46], [36, 46], [27, 28], [36, 28]]) lantern(w, x, z, 4);
  for (const [x, z] of [[25, 16], [38, 16]]) lantern(w, x, z, 5);

  // Cherry tree with a climbable branch (orb 4) and its rockery
  w.fill(44, 4, 36, 44, 8, 36, B.BARK);
  w.fill(40, 7, 36, 43, 7, 36, B.BARK);
  for (let dy = 0; dy <= 3; dy++)
    for (let dz = -3; dz <= 3; dz++)
      for (let dx = -4; dx <= 3; dx++) {
        const x = 44 + dx, y = 9 + dy, z = 36 + dz;
        const d = Math.hypot(dx * 0.85, (dy - 1.5) * 1.3, dz);
        if (d <= 3.2 && w.get(x, y, z) === B.AIR) w.set(x, y, z, B.LEAVES);
      }
  w.set(36, 4, 36, B.STONE);
  w.fill(37, 4, 36, 37, 5, 36, B.STONE);
  w.fill(38, 4, 36, 38, 6, 36, B.STONE);

  // Decorative cherry trees
  cherryTree(w, 52, 19, 5, 5);
  cherryTree(w, 12, 54, 4, 5);
  cherryTree(w, 55, 38, 4, 6);
  cherryTree(w, 4, 24, 4, 5);
  cherryTree(w, 20, 58, 4, 4, 2);

  // Pagoda (orb 5)
  w.fill(46, 4, 46, 50, 6, 50, B.PLASTER);
  for (const [x, z] of [[46, 46], [50, 46], [46, 50], [50, 50]]) w.fill(x, 4, z, x, 6, z, B.RED);
  w.fill(46, 7, 46, 50, 7, 50, B.TILE);
  w.fill(47, 8, 47, 49, 9, 49, B.RED);
  w.fill(47, 10, 47, 49, 10, 49, B.TILE);
  const ramp: [number, number][] = [[56, 4.5], [55, 5], [54, 5.5], [53, 6], [52, 6.5], [51, 7], [50, 7.5]];
  for (const [z, top] of ramp) for (const x of [44, 45]) slabColumn(w, x, z, 4, top, B.STONE, B.STONE_SLAB);
  w.set(50, 8, 50, B.STONE);                 // step A, top 9
  w.fill(52, 4, 50, 52, 9, 50, B.STONE);     // pillar B, top 10
  w.fill(52, 4, 46, 52, 10, 47, B.STONE);    // pillar C, top 11

  // Main hall (orbs 6 and 7)
  w.fill(22, 6, 4, 41, 10, 12, B.PLASTER);
  w.fill(23, 6, 5, 40, 10, 11, B.AIR);
  w.fill(23, 5, 5, 40, 5, 11, B.DARK);
  w.fill(30, 6, 12, 33, 8, 12, B.AIR);
  for (const x of [22, 25, 28, 35, 38, 41]) w.fill(x, 6, 12, x, 10, 12, B.RED);
  for (const x of [22, 41]) for (const z of [4, 8]) w.fill(x, 6, z, x, 10, z, B.RED);
  w.fill(22, 10, 12, 41, 10, 12, B.RED);
  w.fill(29, 9, 12, 34, 9, 12, B.RED);
  for (const x of [22, 41]) w.fill(x, 8, 5, x, 8, 11, B.DARK);
  w.fill(31, 6, 6, 32, 6, 6, B.STONE_SLAB);  // altar, top 6.5
  w.fill(31, 6, 5, 32, 7, 5, B.GOLD);
  w.set(24, 6, 5, B.LANTERN);
  w.set(39, 6, 5, B.LANTERN);
  // Tiered roof
  w.fill(20, 11, 2, 43, 11, 14, B.TILE);
  w.fill(22, 12, 4, 41, 12, 12, B.TILE);
  w.fill(24, 13, 5, 39, 13, 11, B.TILE);
  w.fill(27, 14, 7, 36, 14, 9, B.TILE);
  for (const [x, z] of [[20, 2], [43, 2], [20, 14], [43, 14]]) w.set(x, 12, z, B.TILE_SLAB);
  w.set(36, 15, 8, B.GOLD);

  // Drum tower and the stone ramp that leads to it
  w.fill(13, 6, 6, 17, 9, 10, B.RED);
  w.fill(14, 6, 7, 16, 9, 9, B.PLASTER);
  w.fill(13, 10, 6, 17, 10, 10, B.TILE);
  for (let i = 0; i <= 10; i++) for (const x of [11, 12]) slabColumn(w, x, 20 - i, 4, 5.5 + i * 0.5, B.STONE, B.STONE_SLAB);

  return w;
}
