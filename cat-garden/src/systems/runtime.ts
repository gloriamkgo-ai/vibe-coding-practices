import { buildGarden, SPAWN } from "../world/layout";
import { createPlayer, type PlayerState } from "../player/physics";
import { createAutopilot, type Autopilot } from "./autopilot";

/*
  Per-frame game state lives here, outside React, so the render loop can mutate it
  without re-rendering components. React reads the slower-changing parts via the store.
*/
const params = new URLSearchParams(typeof location !== "undefined" ? location.search : "");

export const FLAGS = {
  autopilot: params.has("autopilot"),
  speed: Math.max(1, Math.min(8, Number(params.get("speed")) || 1)),
  quality: (params.get("quality") as "low" | "medium" | "high" | null) ?? null,
};

export const world = buildGarden();

export const runtime = {
  player: createPlayer(SPAWN.x, SPAWN.y, SPAWN.z) as PlayerState,
  autopilot: createAutopilot() as Autopilot,
  yaw: SPAWN.yaw,
  pitch: 0.32,
  catYaw: 0,
  collected: [false, false, false, false, false, false, false],
  accumulator: 0,
  /** Seconds since the 7th orb, drives the celebration. */
  celebrateT: 0,
  fireworkQueue: [] as { x: number; y: number; z: number; hue: number }[],
  burstQueue: [] as { x: number; y: number; z: number }[],
  walkPhase: 0,
  landKick: 0,
};

export function resetRun() {
  runtime.player = createPlayer(SPAWN.x, SPAWN.y, SPAWN.z);
  runtime.autopilot = createAutopilot();
  runtime.yaw = SPAWN.yaw;
  runtime.pitch = 0.32;
  runtime.catYaw = 0;
  runtime.collected = runtime.collected.map(() => false);
  runtime.accumulator = 0;
  runtime.celebrateT = 0;
  runtime.fireworkQueue.length = 0;
  runtime.burstQueue.length = 0;
}
