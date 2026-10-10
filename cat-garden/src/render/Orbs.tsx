import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ORBS } from "../world/orbs";
import { runtime, world } from "../systems/runtime";
import { ParticlePool } from "./particles";

const ORB_COLOR = new THREE.Color("#6ff7e8");

function haloTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(160,255,245,0.55)");
  g.addColorStop(1, "rgba(80,200,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function Orbs() {
  const groups = useRef<(THREE.Group | null)[]>([]);
  const fade = useRef(ORBS.map(() => 1));
  const { core, shell, halo, ring, pool } = useMemo(() => ({
    core: new THREE.MeshStandardMaterial({ color: "#b8fff6", emissive: ORB_COLOR, emissiveIntensity: 4.5, toneMapped: false }),
    shell: new THREE.MeshBasicMaterial({ color: new THREE.Color("#7ff5ff").multiplyScalar(1.6), wireframe: true, transparent: true, opacity: 0.55, toneMapped: false }),
    halo: new THREE.SpriteMaterial({ map: haloTexture(), color: new THREE.Color("#9ffcff").multiplyScalar(1.4), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }),
    ring: new THREE.MeshBasicMaterial({ color: new THREE.Color("#5ff0ff").multiplyScalar(1.3), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }),
    pool: new ParticlePool(700),
  }), []);
  const floors = useMemo(() => ORBS.map((o) => world.surfaceY(Math.floor(o.pos[0]), Math.floor(o.pos[2]), Math.floor(o.pos[1]))), []);

  useFrame((s, dt) => {
    const t = s.clock.elapsedTime;
    ORBS.forEach((o, i) => {
      const g = groups.current[i];
      if (!g) return;
      const target = runtime.collected[o.id] ? 0 : 1;
      fade.current[i] += (target - fade.current[i]) * Math.min(1, dt * 6);
      const f = fade.current[i];
      g.visible = f > 0.01;
      g.position.set(o.pos[0], o.pos[1] + Math.sin(t * 2 + i) * 0.12, o.pos[2]);
      const spin = g.children[0];
      spin.rotation.y = t * 1.3 + i;
      spin.rotation.x = Math.sin(t * 0.7 + i) * 0.3;
      g.scale.setScalar(f * (1 + Math.sin(t * 3 + i) * 0.04));
      g.children[1].scale.setScalar(2.2 + Math.sin(t * 2.4 + i) * 0.25);
      const ringMesh = g.children[2];
      ringMesh.position.y = floors[i] + 0.03 - g.position.y;
      ringMesh.scale.setScalar(1 + Math.sin(t * 2 + i) * 0.1);
      if (target === 1 && Math.random() < dt * 6) {
        pool.emit({ x: o.pos[0] + (Math.random() - 0.5) * 0.6, y: o.pos[1] - 0.3, z: o.pos[2] + (Math.random() - 0.5) * 0.6 },
          { x: 0, y: 0.5 + Math.random() * 0.4, z: 0 }, ORB_COLOR, 2.2, 0.12, 1.6, 0.4, -0.2);
      }
    });
    while (runtime.burstQueue.length) {
      const b = runtime.burstQueue.shift()!;
      for (let k = 0; k < 120; k++) {
        const th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * 2 - 1), sp = 2 + Math.random() * 4;
        pool.emit(b, { x: Math.sin(ph) * Math.cos(th) * sp, y: Math.cos(ph) * sp + 1.5, z: Math.sin(ph) * Math.sin(th) * sp },
          k % 3 ? ORB_COLOR : new THREE.Color("#fff2c8"), 3, 0.22, 1.1 + Math.random() * 0.6, 2.2, 2.5);
      }
    }
    pool.update(dt);
  });

  return (
    <>
      {ORBS.map((o, i) => (
        <group key={o.id} ref={(g) => { groups.current[i] = g; }}>
          <group>
            <mesh material={core}><octahedronGeometry args={[0.28, 0]} /></mesh>
            <mesh material={shell}><octahedronGeometry args={[0.42, 0]} /></mesh>
          </group>
          <sprite material={halo} />
          <mesh material={ring} rotation-x={-Math.PI / 2}><ringGeometry args={[0.45, 0.62, 32]} /></mesh>
        </group>
      ))}
      <primitive object={pool.points} />
    </>
  );
}
