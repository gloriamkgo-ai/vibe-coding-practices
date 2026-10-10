import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SKY, SUN_DIR } from "./palette";
import type { Quality } from "../state/gameStore";

const CENTER = new THREE.Vector3(32, 6, 32);

export function Lighting({ quality }: { quality: Quality }) {
  const sun = useRef<THREE.DirectionalLight>(null);
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    scene.fog = new THREE.FogExp2(SKY.fog.clone(), 0.0085);
    return () => { scene.fog = null; };
  }, [scene]);

  useEffect(() => {
    const l = sun.current;
    if (!l) return;
    l.position.copy(CENTER).addScaledVector(SUN_DIR, 90);
    l.target.position.copy(CENTER);
    l.target.updateMatrixWorld();
    const cam = l.shadow.camera as THREE.OrthographicCamera;
    cam.left = -46; cam.right = 46; cam.top = 46; cam.bottom = -46; cam.near = 10; cam.far = 200;
    cam.updateProjectionMatrix();
    l.shadow.bias = -0.0004;
    l.shadow.normalBias = 0.04;
  }, [quality]);

  const size = quality === "high" ? 2048 : 1024;
  return (
    <>
      <hemisphereLight args={["#c79be0", "#6a4632", 1.35]} />
      <directionalLight
        ref={sun}
        color="#ffb27a"
        intensity={2.6}
        castShadow={quality !== "low"}
        shadow-mapSize-width={size}
        shadow-mapSize-height={size}
      />
      <ambientLight color="#3a2c5a" intensity={0.35} />
    </>
  );
}
