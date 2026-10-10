export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
/** Frame-rate independent exponential smoothing factor. */
export const damp = (lambda: number, dt: number) => 1 - Math.exp(-lambda * dt);
export const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
