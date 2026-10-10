import { useCallback, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CatModel, type CatRig } from "./CatModel";
import { PHYS, stepPlayer, type PlayerInput } from "./physics";
import { raycastVoxels } from "./raycast";
import { runtime, world, FLAGS } from "../systems/runtime";
import { autopilotInput } from "../systems/autopilot";
import { useGame } from "../state/gameStore";
import { isDown, consumePress } from "../input/keyboard";
import { takeMouseDelta } from "../input/pointerLock";
import { ORBS, COLLECT_RADIUS } from "../world/orbs";
import { nearestTarget, headingOf } from "../systems/compass";
import { clamp, damp, wrapAngle } from "../utils/math";
import { playCollect, playFanfare, playJump, playLand } from "../systems/audio";
import { SPAWN } from "../world/layout";

const PITCH_MIN = -0.55, PITCH_MAX = 1.1;
const tmp = new THREE.Vector3();
const camTarget = new THREE.Vector3();
const camPos = new THREE.Vector3();

let hudTimer = 0;
let gameTime = 0;
export const getGameTime = () => gameTime;
export const resetGameTime = () => { gameTime = 0; hudTimer = 0; };

/** The cat, its controller, the third-person camera and the orb rules, driven from one frame loop. */
export function Player() {
  const rig = useRef<CatRig | null>(null);
  const onRig = useCallback((r: CatRig) => { rig.current = r; }, []);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const smoothCam = useRef(new THREE.Vector3(32, 14, 70));
  const camDist = useRef(4.5);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const store = useGame.getState();
    const { phase, settings } = store;
    const p = runtime.player;
    const t = state.clock.elapsedTime;

    // ---------- Input & physics ----------
    if (phase === "playing") {
      const m = takeMouseDelta();
      const sens = 0.0024 * settings.sensitivity;
      runtime.yaw -= m.dx * sens;
      runtime.pitch = clamp(runtime.pitch + m.dy * sens * (settings.invertY ? -1 : 1), PITCH_MIN, PITCH_MAX);

      const fwd = (isDown("KeyW", "ArrowUp") ? 1 : 0) - (isDown("KeyS", "ArrowDown") ? 1 : 0);
      const side = (isDown("KeyD", "ArrowRight") ? 1 : 0) - (isDown("KeyA", "ArrowLeft") ? 1 : 0);
      const sy = Math.sin(runtime.yaw), cy = Math.cos(runtime.yaw);
      let mx = -sy * fwd + cy * side, mz = -cy * fwd - sy * side;
      const ml = Math.hypot(mx, mz);
      if (ml > 1) { mx /= ml; mz /= ml; }
      const manual: PlayerInput = { moveX: mx, moveZ: mz, sprint: isDown("ShiftLeft", "ShiftRight"), jumpPressed: consumePress("Space") };

      runtime.accumulator += dt * FLAGS.speed;
      let steps = 0;
      while (runtime.accumulator >= PHYS.fixedDt && steps < 60) {
        const input = FLAGS.autopilot ? autopilotInput(runtime.autopilot, p, PHYS.fixedDt) : { ...manual, jumpPressed: steps === 0 && manual.jumpPressed };
        stepPlayer(p, input, world);
        runtime.accumulator -= PHYS.fixedDt;
        gameTime += PHYS.fixedDt;
        steps++;
        if (p.jumped) playJump();
        if (p.landed > 0.25) { playLand(p.landed); runtime.landKick = p.landed; }
        // Orb pickup
        for (const o of ORBS) {
          if (runtime.collected[o.id]) continue;
          const d = Math.hypot(p.x - o.pos[0], p.y + PHYS.height / 2 - o.pos[1], p.z - o.pos[2]);
          if (d < COLLECT_RADIUS) {
            runtime.collected[o.id] = true;
            runtime.burstQueue.push({ x: o.pos[0], y: o.pos[1], z: o.pos[2] });
            const count = runtime.collected.filter(Boolean).length;
            playCollect(count);
            store.set({ collected: count, toast: { text: o.name, sub: `영혼의 구슬 ${count} / ${ORBS.length}`, key: Date.now() } });
            if (count === ORBS.length) {
              store.finish(gameTime * 1000);
              store.set({ phase: "celebrating", compass: null });
              runtime.celebrateT = 0;
              playFanfare();
            }
          }
        }
        if (useGame.getState().phase !== "playing") break;
      }
      if (FLAGS.autopilot) {
        const sp = Math.hypot(p.vx, p.vz);
        if (sp > 1) runtime.yaw += wrapAngle(headingOf(p.vx, p.vz) - runtime.yaw) * damp(2.2, dt);
        runtime.pitch += (0.42 - runtime.pitch) * damp(2, dt);
      }
      hudTimer += dt;
      if (hudTimer > 0.1 && useGame.getState().phase === "playing") {
        hudTimer = 0;
        const c = nearestTarget(p.x, p.y, p.z, runtime.yaw, ORBS, runtime.collected);
        store.set({ elapsed: gameTime * 1000, compass: c ? { rel: c.rel, dist: c.dist, dy: c.dy } : null });
      }
    }

    // ---------- Cat pose & animation ----------
    const r = rig.current;
    if (r) {
      r.root.position.set(p.x, p.y, p.z);
      const speed = Math.hypot(p.vx, p.vz);
      if (speed > 0.3) runtime.catYaw += wrapAngle(headingOf(p.vx, p.vz) - runtime.catYaw) * damp(12, dt);
      if (phase === "title") runtime.catYaw = wrapAngle(SPAWN.yaw + Math.sin(t * 0.3) * 0.4);
      r.root.rotation.y = runtime.catYaw;
      const celebrating = phase === "celebrating" || phase === "results";
      const moving = phase === "playing" ? Math.min(1, speed / PHYS.walkSpeed) : 0;
      runtime.walkPhase += dt * (4 + speed * 2.2) * (moving > 0.05 ? 1 : 0);
      const ph = runtime.walkPhase;
      const air = !p.onGround && phase === "playing";
      r.legs.forEach((leg, i) => {
        const dir = i === 0 || i === 3 ? 1 : -1;
        const swing = air ? (i < 2 ? -0.7 : 0.6) : Math.sin(ph) * 0.85 * moving * dir;
        leg.rotation.x += (swing - leg.rotation.x) * damp(18, dt);
      });
      runtime.landKick = Math.max(0, runtime.landKick - dt * 4);
      const hop = celebrating ? Math.abs(Math.sin(t * 5)) * 0.35 : 0;
      r.body.position.y = Math.abs(Math.sin(ph)) * 0.05 * moving + Math.sin(t * 2) * 0.012 + hop;
      r.body.scale.set(1 + runtime.landKick * 0.12, 1 - runtime.landKick * 0.18, 1 + runtime.landKick * 0.12);
      r.body.rotation.x = air ? (p.vy > 0 ? -0.18 : 0.12) : moving * 0.06;
      r.head.rotation.y = celebrating ? Math.sin(t * 3) * 0.3 : Math.sin(t * 0.8) * 0.08;
      r.head.rotation.x = celebrating ? -0.35 : 0;
      r.tail.forEach((s, i) => {
        s.rotation.y = Math.sin(t * (celebrating ? 9 : 2.4) - i * 0.6) * (0.25 + i * 0.12) * (celebrating ? 1.6 : 1);
        s.rotation.x = 0.45 + (air ? -0.3 : 0) + moving * 0.12;
      });
      r.cape.rotation.x = -0.12 - moving * 0.5 - (air ? 0.4 : 0) - Math.sin(t * 3) * 0.04;
      r.hat.rotation.x = Math.sin(ph * 2) * 0.05 * moving;
    }

    // ---------- Celebration choreography ----------
    if (phase === "celebrating" || phase === "results") {
      runtime.celebrateT += dt;
      const ct = runtime.celebrateT;
      // Launch rockets beyond the cat, in the direction the celebration camera is looking.
      const launch = () => {
        tmp.set(p.x - camera.position.x, 0, p.z - camera.position.z).normalize();
        const side = (Math.random() - 0.5) * 22, ahead = 12 + Math.random() * 10;
        runtime.fireworkQueue.push({ x: p.x + tmp.x * ahead - tmp.z * side, y: p.y - 6, z: p.z + tmp.z * ahead + tmp.x * side, hue: Math.floor(Math.random() * 5) });
      };
      if (phase === "celebrating" && Math.floor((ct - dt) * 1.8) !== Math.floor(ct * 1.8) && ct < 7.6) { launch(); launch(); }
      if (phase === "results" && Math.random() < dt * 0.9) launch();
      if (phase === "celebrating" && ct > 8.2) store.set({ phase: "results" });
    }

    // ---------- Camera ----------
    const fovTarget = phase === "playing" && isDown("ShiftLeft", "ShiftRight") && !settings.reduceMotion && Math.hypot(p.vx, p.vz) > 5 ? 77 : 70;
    camera.fov += (fovTarget - camera.fov) * damp(6, dt);
    camera.updateProjectionMatrix();

    if (phase === "title") {
      // Slow crane around the garden, framing the hall against the sunset.
      const a = Math.sin(t * 0.045) * 0.55 + 0.15;
      camPos.set(32 + Math.sin(a) * 36, 19 + Math.sin(t * 0.17) * 1.5, 32 + Math.cos(a) * 36);
      camTarget.set(30, 8, 14);
      smoothCam.current.lerp(camPos, damp(1.5, dt));
      camera.position.copy(smoothCam.current);
      camera.lookAt(camTarget);
      return;
    }

    if (phase === "celebrating" || phase === "results") {
      const ct = runtime.celebrateT;
      // Over-the-shoulder shot: the cat in the lower third, the sky full of fireworks beyond.
      const a = runtime.catYaw + Math.sin(ct * 0.2) * 0.35;
      camTarget.set(p.x - Math.sin(a) * 6, p.y + 1.4 + Math.min(ct, 3) * 0.75, p.z - Math.cos(a) * 6);
      camPos.set(p.x + Math.sin(a) * 4.2, p.y + 1.5, p.z + Math.cos(a) * 4.2);
      smoothCam.current.lerp(camPos, damp(2, dt));
      camera.position.copy(smoothCam.current);
      camera.lookAt(camTarget);
      return;
    }

    // Third-person follow with collision against blocks
    camTarget.set(p.x, p.y + 1.15, p.z);
    const cp = Math.cos(runtime.pitch);
    tmp.set(Math.sin(runtime.yaw) * cp, Math.sin(runtime.pitch), Math.cos(runtime.yaw) * cp);
    const indoor = world.isSolid(Math.floor(p.x), Math.floor(p.y + 3), Math.floor(p.z));
    const want = indoor ? 3.0 : 4.6;
    const hit = raycastVoxels(world, camTarget.x, camTarget.y, camTarget.z, tmp.x, tmp.y, tmp.z, want + 0.4);
    const allowed = Math.max(0.7, Math.min(want, hit - 0.35));
    camDist.current = allowed < camDist.current ? allowed : camDist.current + (allowed - camDist.current) * damp(4, dt);
    camPos.copy(camTarget).addScaledVector(tmp, camDist.current);
    smoothCam.current.lerp(camPos, damp(20, dt));
    camera.position.copy(smoothCam.current);
    camera.lookAt(camTarget);
  });

  return <CatModel onRig={onRig} />;
}
