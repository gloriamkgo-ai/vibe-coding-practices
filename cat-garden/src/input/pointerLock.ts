/** Pointer-lock helper: accumulates mouse movement while the pointer is locked. */
let dx = 0, dy = 0;
let attached = false;

export function attachPointer(onChange: (locked: boolean) => void) {
  if (attached) return;
  attached = true;
  let lockedAt = 0;
  document.addEventListener("mousemove", (e) => {
    if (!document.pointerLockElement) return;
    // Browsers can report one huge jump right after locking; drop it and any absurd spikes.
    if (performance.now() - lockedAt < 120) return;
    if (Math.abs(e.movementX) > 250 || Math.abs(e.movementY) > 250) return;
    dx += e.movementX; dy += e.movementY;
  });
  document.addEventListener("pointerlockchange", () => {
    if (document.pointerLockElement) lockedAt = performance.now();
    dx = 0; dy = 0;
    onChange(!!document.pointerLockElement);
  });
}

export function takeMouseDelta() {
  const r = { dx, dy };
  dx = 0; dy = 0;
  return r;
}

export async function requestLock() {
  const el = document.querySelector("canvas");
  if (!el || document.pointerLockElement) return;
  try {
    // Some browsers return a promise, some return nothing; both may reject.
    await (el as HTMLCanvasElement & { requestPointerLock: (o?: unknown) => Promise<void> | void }).requestPointerLock();
  } catch { /* the game stays paused until the next click */ }
}

export function releaseLock() {
  if (document.pointerLockElement) document.exitPointerLock();
}
