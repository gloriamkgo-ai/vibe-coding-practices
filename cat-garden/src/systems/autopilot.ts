import type { PlayerInput, PlayerState } from "../player/physics";

/*
  A demo / test driver that plays the game through the normal input path.
  It only sees the player's position and produces the same input a keyboard
  would (direction, sprint, jump); it never moves the cat directly.
*/
export interface Waypoint {
  x: number;
  z: number;
  /** Press jump on arrival (this waypoint is a take-off point). */
  jump?: boolean;
  sprint?: boolean;
  /** Arrival radius. */
  r?: number;
  /** Wait until standing on something before moving on. */
  ground?: boolean;
  /** Ease off near the point instead of arriving at full speed. */
  slow?: boolean;
}

const wp = (x: number, z: number, o: Partial<Waypoint> = {}): Waypoint => ({ x, z, ...o });

/** Route through all seven orbs, in the order the garden is meant to be explored. */
export const ROUTE: Waypoint[] = [
  // 1 · torii
  wp(32, 55.5), wp(32, 36),
  // 2 · arched bridge (deck z 34–35, slabs climb by half blocks)
  wp(29, 35), wp(17, 35, { ground: true }),
  // 3 · stepping stones from the east shore (2-cell gaps, walking jumps)
  wp(27, 35), wp(27, 43), wp(25.8, 43, { slow: true, ground: true }),
  wp(25.45, 43, { jump: true, r: 0.12 }), wp(22.5, 43, { ground: true, slow: true, r: 0.25 }),
  wp(22.45, 43, { jump: true, r: 0.12 }), wp(19.5, 43, { ground: true, slow: true, r: 0.25 }),
  wp(19.45, 43, { jump: true, r: 0.12 }), wp(16.5, 43, { ground: true, slow: true, r: 0.25 }),
  wp(16.45, 43, { jump: true, r: 0.12 }), wp(13.5, 43, { ground: true, slow: true, r: 0.25 }),
  wp(13.45, 43, { jump: true, r: 0.12 }), wp(10.5, 43, { ground: true, slow: true, r: 0.25 }),
  wp(10.45, 43, { jump: true, r: 0.12 }), wp(7, 43, { ground: true }),
  // back over the bridge to the east side
  wp(5, 43), wp(5, 35), wp(8, 35), wp(17, 35), wp(28, 35), wp(28, 36.5),
  // 4 · rockery → cherry branch (z 36, 1 block wide)
  wp(34.5, 36.5, { slow: true, ground: true }), wp(35.3, 36.5, { jump: true, r: 0.15 }),
  wp(36.5, 36.5, { ground: true, slow: true, r: 0.25 }), wp(36.4, 36.5, { jump: true, r: 0.15 }),
  wp(37.5, 36.5, { ground: true, slow: true, r: 0.25 }), wp(37.4, 36.5, { jump: true, r: 0.15 }),
  wp(38.5, 36.5, { ground: true, slow: true, r: 0.25 }), wp(38.6, 36.5, { jump: true, r: 0.12 }),
  wp(40.6, 36.5, { ground: true, slow: true, r: 0.25 }), wp(42.6, 36.5, { ground: true, slow: true }),
  // down and round to the pagoda ramp
  wp(42.6, 39.5), wp(42.6, 58), wp(44.9, 58), wp(44.9, 50.6, { ground: true }),
  // 5 · pagoda: tier roof → step A → pillar B → sprint to pillar C → top
  wp(46.6, 50.6), wp(49.0, 50.55, { slow: true, ground: true }), wp(49.5, 50.55, { jump: true, r: 0.15 }),
  wp(50.5, 50.55, { ground: true, slow: true, r: 0.2 }), wp(50.6, 50.55, { jump: true, r: 0.12 }),
  wp(52.5, 50.5, { ground: true, slow: true, r: 0.2 }),
  wp(52.5, 50.7, { slow: true, r: 0.12, ground: true }),
  wp(52.5, 50.35, { jump: true, sprint: true, r: 0.12 }), wp(52.5, 47.2, { ground: true, slow: true, r: 0.25 }),
  wp(52.6, 47.5, { slow: true, r: 0.15, ground: true }), wp(52.25, 47.5, { jump: true, r: 0.12 }),
  wp(48.5, 47.6, { ground: true, slow: true }), wp(48.5, 48.5, { ground: true, slow: true }),
  // off the pagoda and up the main path
  wp(48.5, 52), wp(48.5, 58, { ground: true }), wp(41, 58), wp(39, 44), wp(33.5, 38), wp(32.5, 25), wp(32, 16), wp(32, 12.5),
  // 6 · altar inside the hall
  wp(32, 6.6, { ground: true, slow: true }),
  // out again and west along the lower terrace to the stone ramp
  wp(32, 13.6), wp(32, 21), wp(12, 21), wp(12, 10.6, { ground: true }), wp(15, 10.4), wp(15.2, 8.5, { ground: true }),
  // 7 · sprint jump from the drum tower onto the hall roof, then up the roof tiers
  wp(14.0, 8.5, { slow: true, ground: true }), wp(17.55, 8.5, { jump: true, sprint: true, r: 0.12 }),
  wp(21, 8.5, { ground: true, slow: true, r: 0.3 }), wp(21.2, 8.5, { jump: true, r: 0.15 }),
  wp(22.8, 8.5, { ground: true, slow: true, r: 0.3 }), wp(23.2, 8.5, { jump: true, r: 0.15 }),
  wp(24.8, 8.5, { ground: true, slow: true, r: 0.3 }), wp(26.2, 8.5, { jump: true, r: 0.15 }),
  wp(27.8, 8.5, { ground: true, slow: true, r: 0.3 }), wp(31.5, 8.5, { ground: true, slow: true }),
];

export interface Autopilot {
  index: number;
  pendingJump: boolean;
  stuck: number;
  done: boolean;
}

export const createAutopilot = (): Autopilot => ({ index: 0, pendingJump: false, stuck: 0, done: false });

/** Produce this step's input. Mutates the autopilot cursor. */
export function autopilotInput(a: Autopilot, p: PlayerState, dt: number, route = ROUTE): PlayerInput {
  const input: PlayerInput = { moveX: 0, moveZ: 0, sprint: false, jumpPressed: false };
  if (a.index >= route.length) { a.done = true; return input; }
  let w = route[a.index];
  let dx = w.x - p.x, dz = w.z - p.z;
  let dist = Math.hypot(dx, dz);
  const arrived = dist < (w.r ?? 0.35) && (!w.ground || p.onGround);
  if (arrived) {
    if (w.jump) input.jumpPressed = true;
    a.index++;
    a.stuck = 0;
    if (a.index >= route.length) { a.done = true; return input; }
    const prevSprint = w.sprint;
    w = route[a.index];
    dx = w.x - p.x; dz = w.z - p.z; dist = Math.hypot(dx, dz);
    if (prevSprint) input.sprint = true;
  }
  if (dist > 1e-3) {
    const mag = w.slow ? Math.min(1, dist / 0.9 + 0.08) : 1;
    input.moveX = (dx / dist) * mag;
    input.moveZ = (dz / dist) * mag;
  }
  input.sprint = input.sprint || !!w.sprint || (!p.onGround && !!route[a.index - 1]?.sprint);
  // Step up full-block ledges on ordinary walking legs.
  const speed = Math.hypot(p.vx, p.vz);
  if (p.onGround && speed < 0.4 && dist > 0.8 && !w.slow) {
    a.stuck += dt;
    if (a.stuck > 0.2) { input.jumpPressed = true; a.stuck = 0; }
  }
  return input;
}
