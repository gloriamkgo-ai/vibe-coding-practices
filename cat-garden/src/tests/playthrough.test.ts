import { describe, expect, it } from "vitest";
import { buildGarden, SPAWN } from "../world/layout";
import { ORBS, COLLECT_RADIUS } from "../world/orbs";
import { createPlayer, stepPlayer, PHYS } from "../player/physics";
import { autopilotInput, createAutopilot, ROUTE } from "../systems/autopilot";

describe("full playthrough with the autopilot", () => {
  it("collects all seven orbs without falling in the pond", () => {
    const w = buildGarden();
    const p = createPlayer(SPAWN.x, SPAWN.y, SPAWN.z);
    const ap = createAutopilot();
    const got: number[] = [];
    const log: string[] = [];
    let t = 0;
    let lastIdx = -1, idxSince = 0;
    while (!ap.done && t < 400) {
      const input = autopilotInput(ap, p, PHYS.fixedDt);
      const r0 = p.respawns;
      stepPlayer(p, input, w);
      t += PHYS.fixedDt;
      if (p.respawns !== r0) log.push(`respawn at t=${t.toFixed(2)} wp=${ap.index} (${ROUTE[ap.index]?.x},${ROUTE[ap.index]?.z})`);
      for (const o of ORBS) {
        if (got.includes(o.id)) continue;
        const d = Math.hypot(p.x - o.pos[0], p.y + PHYS.height / 2 - o.pos[1], p.z - o.pos[2]);
        if (d < COLLECT_RADIUS) { got.push(o.id); log.push(`orb ${o.id + 1} at t=${t.toFixed(1)}s`); }
      }
      if (ap.index !== lastIdx) { lastIdx = ap.index; idxSince = 0; } else idxSince += PHYS.fixedDt;
      if (idxSince > 12) { log.push(`stuck at wp ${ap.index} ${JSON.stringify(ROUTE[ap.index])} pos=(${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)})`); break; }
    }
    console.log(log.join("\n"));
    expect(p.respawns).toBe(0);
    expect(got.sort()).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});
