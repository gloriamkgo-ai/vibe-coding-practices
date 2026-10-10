import { B, def } from "./blocks";

export class VoxelWorld {
  readonly sx: number;
  readonly sy: number;
  readonly sz: number;
  readonly data: Uint8Array;

  constructor(sx = 64, sy = 32, sz = 64) {
    this.sx = sx; this.sy = sy; this.sz = sz;
    this.data = new Uint8Array(sx * sy * sz);
  }

  private idx(x: number, y: number, z: number) { return (y * this.sz + z) * this.sx + x; }

  inBounds(x: number, y: number, z: number) {
    return x >= 0 && y >= 0 && z >= 0 && x < this.sx && y < this.sy && z < this.sz;
  }

  /** Outside the garden is an invisible wall; below the floor is solid; above the sky is air. */
  get(x: number, y: number, z: number): number {
    if (y >= this.sy) return B.AIR;
    if (y < 0) return B.STONE;
    if (x < 0 || z < 0 || x >= this.sx || z >= this.sz) return B.BOUNDARY;
    return this.data[this.idx(x, y, z)];
  }

  set(x: number, y: number, z: number, b: number) {
    if (this.inBounds(x, y, z)) this.data[this.idx(x, y, z)] = b;
  }

  /** Inclusive box fill. */
  fill(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, b: number) {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
      for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++)
        for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.set(x, y, z, b);
  }

  isSolid(x: number, y: number, z: number) { return def(this.get(x, y, z)).solid; }

  /** Height of the top surface of the highest solid block in a column at or below maxY. */
  surfaceY(x: number, z: number, maxY = this.sy - 1): number {
    for (let y = maxY; y >= 0; y--) {
      const d = def(this.get(x, y, z));
      if (d.solid) return y + d.height;
    }
    return 0;
  }
}
