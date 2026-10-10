/** Global key state. Listeners attach once; components read the current snapshot. */
const down = new Set<string>();
const pressed = new Set<string>();
let attached = false;

const GAME_KEYS = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "ShiftLeft", "ShiftRight"]);

export function attachKeyboard(onKey?: (code: string) => void) {
  if (attached) return;
  attached = true;
  window.addEventListener("keydown", (e) => {
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    if (!down.has(e.code)) pressed.add(e.code);
    down.add(e.code);
    if (!e.repeat) onKey?.(e.code);
  });
  window.addEventListener("keyup", (e) => down.delete(e.code));
  window.addEventListener("blur", () => down.clear());
}

export const isDown = (...codes: string[]) => codes.some((c) => down.has(c));
/** True once per key press; consumed by the caller. */
export function consumePress(...codes: string[]) {
  let hit = false;
  for (const c of codes) if (pressed.delete(c)) hit = true;
  return hit;
}
export const clearPresses = () => pressed.clear();
