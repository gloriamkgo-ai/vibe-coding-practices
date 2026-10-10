import { def, B } from "../world/blocks";
import type { VoxelWorld } from "../world/voxelWorld";

export const PHYS = {
  gravity: 28,
  jumpVelocity: 8.7,      // ≈ 1.35 blocks
  walkSpeed: 4.5,
  sprintSpeed: 7.5,
  groundAccel: 42,
  airAccel: 17,           // ≈ 40 % of ground control
  halfWidth: 0.3,
  height: 0.9,
  stepHeight: 0.55,       // walks up slabs without jumping
  coyoteTime: 0.1,
  jumpBuffer: 0.12,
  maxFall: 40,
  fixedDt: 1 / 120,
};

export interface PlayerInput {
  /** Desired horizontal direction in world space; length 0–1. */
  moveX: number;
  moveZ: number;
  sprint: boolean;
  /** True on the frame the jump key goes down. */
  jumpPressed: boolean;
}

export interface PlayerState {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  onGround: boolean;
  coyote: number;
  buffer: number;
  safe: { x: number; y: number; z: number };
  safeTimer: number;
  respawns: number;
  /** Seconds spent in the air; drives landing effects. */
  airTime: number;
  landed: number;
  jumped: boolean;
}

export function createPlayer(x: number, y: number, z: number): PlayerState {
  return { x, y, z, vx: 0, vy: 0, vz: 0, onGround: false, coyote: 0, buffer: 0, safe: { x, y, z }, safeTimer: 0, respawns: 0, airTime: 0, landed: 0, jumped: false };
}

const EPS = 1e-4;

function overlaps(w: VoxelWorld, x: number, y: number, z: number): { min: number[]; max: number[] }[] {
  const h = PHYS.halfWidth;
  const out: { min: number[]; max: number[] }[] = [];
  const x0 = Math.floor(x - h + EPS), x1 = Math.floor(x + h - EPS);
  const y0 = Math.floor(y + EPS), y1 = Math.floor(y + PHYS.height - EPS);
  const z0 = Math.floor(z - h + EPS), z1 = Math.floor(z + h - EPS);
  for (let by = y0; by <= y1; by++)
    for (let bz = z0; bz <= z1; bz++)
      for (let bx = x0; bx <= x1; bx++) {
        const d = def(w.get(bx, by, bz));
        if (!d.solid) continue;
        const top = by + d.height;
        if (y + EPS >= top || y + PHYS.height - EPS <= by) continue;
        out.push({ min: [bx, by, bz], max: [bx + 1, top, bz + 1] });
      }
  return out;
}

export const collides = (w: VoxelWorld, x: number, y: number, z: number) => overlaps(w, x, y, z).length > 0;

/** Move along one axis and push out of any block hit. Returns true on contact. */
function moveAxis(p: PlayerState, w: VoxelWorld, axis: 0 | 1 | 2, d: number): boolean {
  if (d === 0) return false;
  const pos = [p.x, p.y, p.z];
  pos[axis] += d;
  const boxes = overlaps(w, pos[0], pos[1], pos[2]);
  let hit = false;
  for (const b of boxes) {
    hit = true;
    if (axis === 1) pos[1] = d > 0 ? Math.min(pos[1], b.min[1] - PHYS.height - EPS) : Math.max(pos[1], b.max[1]);
    else pos[axis] = d > 0 ? Math.min(pos[axis], b.min[axis] - PHYS.halfWidth - EPS) : Math.max(pos[axis], b.max[axis] + PHYS.halfWidth + EPS);
  }
  [p.x, p.y, p.z] = pos;
  return hit;
}

/** Horizontal move with automatic step-up onto slabs and half-height ledges. */
function moveHorizontal(p: PlayerState, w: VoxelWorld, axis: 0 | 2, d: number, grounded: boolean) {
  const before = { x: p.x, y: p.y, z: p.z };
  const hit = moveAxis(p, w, axis, d);
  if (!hit || !grounded) {
    if (hit) { if (axis === 0) p.vx = 0; else p.vz = 0; }
    return;
  }
  const blocked = { x: p.x, y: p.y, z: p.z };
  if (!collides(w, before.x, before.y + PHYS.stepHeight, before.z)) {
    p.x = before.x; p.y = before.y + PHYS.stepHeight; p.z = before.z;
    if (!moveAxis(p, w, axis, d)) {
      moveAxis(p, w, 1, -PHYS.stepHeight - 0.01);
      return;
    }
  }
  p.x = blocked.x; p.y = blocked.y; p.z = blocked.z;
  if (axis === 0) p.vx = 0; else p.vz = 0;
}

function blockUnder(p: PlayerState, w: VoxelWorld) {
  return w.get(Math.floor(p.x), Math.floor(p.y - 0.05), Math.floor(p.z));
}

/** One fixed physics step. */
export function stepPlayer(p: PlayerState, input: PlayerInput, w: VoxelWorld, dt = PHYS.fixedDt) {
  p.jumped = false;
  p.landed = 0;
  const speed = input.sprint ? PHYS.sprintSpeed : PHYS.walkSpeed;
  const tx = input.moveX * speed, tz = input.moveZ * speed;
  const accel = (p.onGround ? PHYS.groundAccel : PHYS.airAccel) * dt;
  const dvx = tx - p.vx, dvz = tz - p.vz;
  const dl = Math.hypot(dvx, dvz);
  if (dl > 0) {
    const k = Math.min(1, accel / dl);
    p.vx += dvx * k;
    p.vz += dvz * k;
  }

  if (input.jumpPressed) p.buffer = PHYS.jumpBuffer;
  else p.buffer = Math.max(0, p.buffer - dt);
  p.coyote = p.onGround ? PHYS.coyoteTime : Math.max(0, p.coyote - dt);
  if (p.buffer > 0 && p.coyote > 0) {
    p.vy = PHYS.jumpVelocity;
    p.buffer = 0;
    p.coyote = 0;
    p.onGround = false;
    p.jumped = true;
  }

  p.vy = Math.max(-PHYS.maxFall, p.vy - PHYS.gravity * dt);
  const grounded = p.onGround;
  moveHorizontal(p, w, 0, p.vx * dt, grounded);
  moveHorizontal(p, w, 2, p.vz * dt, grounded);

  const wasGround = p.onGround;
  const hitY = moveAxis(p, w, 1, p.vy * dt);
  if (hitY && p.vy < 0) {
    if (!wasGround && p.airTime > 0.15) p.landed = Math.min(1, -p.vy / 18);
    p.onGround = true;
    p.vy = 0;
  } else {
    if (hitY && p.vy > 0) p.vy = 0;
    p.onGround = hitY && p.vy <= 0 ? true : collides(w, p.x, p.y - 0.02, p.z) && p.vy <= 0;
  }
  p.airTime = p.onGround ? 0 : p.airTime + dt;

  // Remember the last firm footing; fall into the pond or out of the world → return there.
  if (p.onGround && blockUnder(p, w) !== B.WATER) {
    p.safeTimer += dt;
    if (p.safeTimer > 0.25) { p.safe = { x: p.x, y: p.y, z: p.z }; }
  } else p.safeTimer = 0;
  const inWater = w.get(Math.floor(p.x), Math.floor(p.y + 0.2), Math.floor(p.z)) === B.WATER;
  if (inWater || p.y < -5) {
    p.x = p.safe.x; p.y = p.safe.y + 0.05; p.z = p.safe.z;
    p.vx = p.vy = p.vz = 0;
    p.respawns++;
  }
}
