import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { rng } from "../utils/rng";
import { world } from "../systems/runtime";

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixel;
  attribute float aSeed;
  varying float vGlow;
  void main() {
    vec3 p = position;
    float t = uTime * (0.35 + aSeed * 0.4) + aSeed * 40.0;
    p += vec3(sin(t) * 0.9, sin(t * 1.7) * 0.35, cos(t * 0.8) * 0.9);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vGlow = pow(0.5 + 0.5 * sin(uTime * (1.5 + aSeed * 2.0) + aSeed * 30.0), 3.0);
    gl_PointSize = uPixel * (0.6 + vGlow) * 22.0 / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;
const fragment = /* glsl */ `
  varying float vGlow;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    vec3 c = mix(vec3(0.9, 1.0, 0.45), vec3(1.0, 0.85, 0.4), vGlow) * (0.6 + vGlow * 3.4);
    gl_FragColor = vec4(c * a, a);
  }
`;

export function Fireflies({ count }: { count: number }) {
  const { geometry, material } = useMemo(() => {
    const r = rng(42);
    const pos: number[] = [], seed: number[] = [];
    let tries = 0;
    while (pos.length / 3 < count && tries++ < count * 20) {
      // Gather near the pond and shrubs
      const nearPond = r() < 0.55;
      const x = nearPond ? 8 + r() * 20 : 3 + r() * 58;
      const z = nearPond ? 26 + r() * 22 : 14 + r() * 46;
      const ground = world.surfaceY(Math.floor(x), Math.floor(z), 20);
      pos.push(x, ground + 0.6 + r() * 2.2, z);
      seed.push(r());
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.Float32BufferAttribute(seed, 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: vertex, fragmentShader: fragment,
      uniforms: { uTime: { value: 0 }, uPixel: { value: Math.min(window.devicePixelRatio, 2) } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    });
    return { geometry: g, material: m };
  }, [count]);
  useFrame((s) => { material.uniforms.uTime.value = s.clock.elapsedTime; });
  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
