import { wrapAngle } from "../utils/math";

/*
  Yaw convention: yaw 0 looks north (−z); yaw grows counter-clockwise seen from above,
  so +π/2 looks west. Forward = (−sin yaw, −cos yaw), right = (cos yaw, −sin yaw).
*/
export const headingOf = (dx: number, dz: number) => Math.atan2(-dx, -dz);

export interface CompassTarget { id: number; rel: number; dist: number; dy: number }

/** Nearest uncollected orb, as an angle relative to the camera (positive = to the left). */
export function nearestTarget(px: number, py: number, pz: number, yaw: number, orbs: { id: number; pos: [number, number, number] }[], collected: boolean[]): CompassTarget | null {
  let best: CompassTarget | null = null;
  for (const o of orbs) {
    if (collected[o.id]) continue;
    const dx = o.pos[0] - px, dz = o.pos[2] - pz;
    const dist = Math.hypot(dx, dz, o.pos[1] - py);
    if (!best || dist < best.dist) best = { id: o.id, rel: wrapAngle(headingOf(dx, dz) - yaw), dist, dy: o.pos[1] - (py + 0.45) };
  }
  return best;
}

export const CARDINALS = [
  { label: "북", heading: 0 },
  { label: "동", heading: -Math.PI / 2 },
  { label: "남", heading: Math.PI },
  { label: "서", heading: Math.PI / 2 },
];
