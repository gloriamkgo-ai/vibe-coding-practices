import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { rng } from "../utils/rng";
import { SUN_DIR } from "./palette";

/** Distant blocky mountains and lit clouds that give the garden depth. */
export function Backdrop() {
  const mountains = useRef<THREE.InstancedMesh>(null);
  const clouds = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => {
    const r = rng(7);
    const m: { x: number; z: number; h: number; s: number; c: THREE.Color }[] = [];
    // Three rings of stepped, squat peaks: low hills near, tall ranges far away.
    for (let ring = 0; ring < 3; ring++) {
      const radius = 150 + ring * 80;
      const n = 90 + ring * 40;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const ridge = Math.max(0, Math.sin(a * 2 + ring * 1.7) * 0.55 + Math.sin(a * 5.1 + ring) * 0.3 + Math.sin(a * 11.3) * 0.15);
        const peak = (6 + ring * 14) + ridge * (14 + ring * 26);
        const s = 12 + ring * 6;
        const c = new THREE.Color().setHSL(0.8 - ring * 0.02, 0.3, 0.16 + ring * 0.05);
        // Stack two stepped boxes per peak for a terraced silhouette
        m.push({ x: 32 + Math.cos(a) * radius, z: 32 + Math.sin(a) * radius, h: Math.max(4, peak), s, c });
        m.push({ x: 32 + Math.cos(a) * (radius + s * 0.4), z: 32 + Math.sin(a) * (radius + s * 0.4), h: Math.max(3, peak * 0.62), s: s * 1.8, c: c.clone().offsetHSL(0, 0, -0.02) });
      }
    }
    const cl: { x: number; y: number; z: number; w: number; d: number; c: THREE.Color }[] = [];
    for (let i = 0; i < 46; i++) {
      const a = r() * Math.PI * 2, radius = 90 + r() * 170;
      const x = 32 + Math.cos(a) * radius, z = 32 + Math.sin(a) * radius, y = 55 + r() * 45;
      const dir = new THREE.Vector3(x - 32, y, z - 32).normalize();
      const toSun = Math.max(0, dir.dot(SUN_DIR));
      const c = new THREE.Color("#7b5a9a").lerp(new THREE.Color("#ffb08a"), Math.pow(toSun, 1.5) * 1.1 + 0.15);
      cl.push({ x, y, z, w: 14 + r() * 26, d: 8 + r() * 14, c });
    }
    return { m, cl };
  }, []);

  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    data.m.forEach((v, i) => {
      o.position.set(v.x, v.h / 2 - 2, v.z);
      o.scale.set(v.s, v.h, v.s);
      o.updateMatrix();
      mountains.current!.setMatrixAt(i, o.matrix);
      mountains.current!.setColorAt(i, v.c);
    });
    mountains.current!.instanceMatrix.needsUpdate = true;
    if (mountains.current!.instanceColor) mountains.current!.instanceColor.needsUpdate = true;
    data.cl.forEach((v, i) => {
      o.position.set(v.x, v.y, v.z);
      o.scale.set(v.w, 2.2, v.d);
      o.updateMatrix();
      clouds.current!.setMatrixAt(i, o.matrix);
      clouds.current!.setColorAt(i, v.c);
    });
    clouds.current!.instanceMatrix.needsUpdate = true;
    if (clouds.current!.instanceColor) clouds.current!.instanceColor.needsUpdate = true;
  }, [data]);

  return (
    <>
      {/* Meadow beyond the hedge, just below the garden's grass so it never shows through */}
      <mesh rotation-x={-Math.PI / 2} position={[32, 3.9, 32]} receiveShadow>
        <circleGeometry args={[600, 48]} />
        <meshLambertMaterial color="#3d3a2a" />
      </mesh>
      <instancedMesh ref={mountains} args={[undefined, undefined, data.m.length]} frustumCulled={false}>
        <boxGeometry />
        <meshLambertMaterial />
      </instancedMesh>
      <instancedMesh ref={clouds} args={[undefined, undefined, data.cl.length]} frustumCulled={false}>
        <boxGeometry />
        <meshBasicMaterial fog={false} transparent opacity={0.88} />
      </instancedMesh>
    </>
  );
}
