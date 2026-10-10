import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { runtime } from "../systems/runtime";
import { ParticlePool } from "./particles";
import { playFirework } from "../systems/audio";

const COLORS = ["#6ff7e8", "#ff9ec4", "#ffd27a", "#b9a2ff", "#ffffff"].map((c) => new THREE.Color(c));

/** Celebration fireworks: rockets rise from behind the hall and burst into shells. */
export function Fireworks() {
  const pool = useMemo(() => new ParticlePool(3200), []);
  const rockets = useMemo(() => [] as { p: THREE.Vector3; v: THREE.Vector3; fuse: number; color: THREE.Color; shape: number }[], []);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    while (runtime.fireworkQueue.length) {
      const f = runtime.fireworkQueue.shift()!;
      rockets.push({ p: new THREE.Vector3(f.x, f.y, f.z), v: new THREE.Vector3((Math.random() - 0.5) * 2, 19 + Math.random() * 5, (Math.random() - 0.5) * 2), fuse: 1.0 + Math.random() * 0.4, color: COLORS[f.hue % COLORS.length], shape: Math.floor(Math.random() * 3) });
    }
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.fuse -= dt;
      r.v.y -= 9 * dt;
      r.p.addScaledVector(r.v, dt);
      pool.emit(r.p, { x: (Math.random() - 0.5) * 0.6, y: -1, z: (Math.random() - 0.5) * 0.6 }, new THREE.Color("#ffcf8a"), 3.5, 0.32, 0.5, 1.5, 2);
      if (r.fuse <= 0) {
        const n = 260;
        const alt = COLORS[(COLORS.indexOf(r.color) + 2) % COLORS.length];
        for (let k = 0; k < n; k++) {
          const th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * 2 - 1);
          let sp = 9 + Math.random() * 3;
          if (r.shape === 1) sp = k % 2 ? 11.5 : 6;            // double ring
          if (r.shape === 2) sp *= 0.6 + 0.4 * Math.abs(Math.sin(th * 3)); // flower
          pool.emit(r.p, { x: Math.sin(ph) * Math.cos(th) * sp, y: Math.cos(ph) * sp, z: Math.sin(ph) * Math.sin(th) * sp },
            k % 4 === 0 ? alt : r.color, 5.5, 0.95, 1.8 + Math.random() * 0.9, 1.5, 4.2);
        }
        playFirework();
        rockets.splice(i, 1);
      }
    }
    pool.update(dt);
  });

  return <primitive object={pool.points} />;
}
