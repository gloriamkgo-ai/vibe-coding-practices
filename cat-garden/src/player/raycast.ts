import { def } from "../world/blocks";
import type { VoxelWorld } from "../world/voxelWorld";

/**
 * Amanatides–Woo voxel traversal. Returns the distance to the first solid block hit
 * along the ray (slabs count as full for camera purposes), or maxDist if clear.
 */
export function raycastVoxels(w: VoxelWorld, ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, maxDist: number): number {
  const len = Math.hypot(dx, dy, dz) || 1;
  dx /= len; dy /= len; dz /= len;
  let x = Math.floor(ox), y = Math.floor(oy), z = Math.floor(oz);
  const sx = Math.sign(dx), sy = Math.sign(dy), sz = Math.sign(dz);
  const tdx = dx !== 0 ? Math.abs(1 / dx) : Infinity;
  const tdy = dy !== 0 ? Math.abs(1 / dy) : Infinity;
  const tdz = dz !== 0 ? Math.abs(1 / dz) : Infinity;
  let tx = dx !== 0 ? ((sx > 0 ? x + 1 - ox : ox - x) * tdx) : Infinity;
  let ty = dy !== 0 ? ((sy > 0 ? y + 1 - oy : oy - y) * tdy) : Infinity;
  let tz = dz !== 0 ? ((sz > 0 ? z + 1 - oz : oz - z) * tdz) : Infinity;
  let t = 0;
  while (t <= maxDist) {
    const b = w.get(x, y, z);
    const d = def(b);
    if (d.solid && d.kind !== "none") return t;
    if (tx < ty && tx < tz) { x += sx; t = tx; tx += tdx; }
    else if (ty < tz) { y += sy; t = ty; ty += tdy; }
    else { z += sz; t = tz; tz += tdz; }
  }
  return maxDist;
}
