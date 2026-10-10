import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { rng } from "../utils/rng";

/* Falling cherry petals, animated entirely in the vertex shader. */
const vertex = /* glsl */ `
  uniform float uTime;
  attribute vec3 aOrigin;
  attribute float aSeed;
  varying float vShade;
  mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
  mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }
  void main() {
    float range = 14.0;
    float fall = mod(uTime * (0.55 + aSeed * 0.35) + aSeed * range, range);
    vec3 p = aOrigin;
    p.y += range * 0.5 - fall;
    float sway = uTime * (0.6 + aSeed) + aSeed * 20.0;
    p.x += sin(sway) * 1.3 + fall * 0.55;   // gentle wind toward the east
    p.z += cos(sway * 0.8) * 0.9 + fall * 0.2;
    mat3 r = rotY(sway * 1.4) * rotX(sway * 2.1);
    vec3 local = r * position;
    vShade = 0.65 + 0.35 * abs((r * vec3(0.0, 0.0, 1.0)).y);
    gl_Position = projectionMatrix * viewMatrix * vec4(p + local, 1.0);
  }
`;
const fragment = /* glsl */ `
  varying float vShade;
  void main() {
    vec3 c = vec3(1.0, 0.52, 0.68) * vShade;
    gl_FragColor = vec4(c, 0.92);
  }
`;

export function Petals({ count }: { count: number }) {
  const mesh = useMemo(() => {
    const base = new THREE.PlaneGeometry(0.14, 0.1);
    const g = new THREE.InstancedBufferGeometry();
    g.index = base.index;
    g.attributes.position = base.attributes.position;
    const r = rng(9);
    const origin = new Float32Array(count * 3), seed = new Float32Array(count);
    const trees = [[44, 12, 36], [52, 13, 19], [12, 12, 54], [55, 13, 38], [4, 12, 24], [20, 10, 58], [32, 14, 34]];
    for (let i = 0; i < count; i++) {
      const t = trees[i % trees.length];
      origin[i * 3] = t[0] - 4 + r() * 8;
      origin[i * 3 + 1] = t[1] + r() * 2;
      origin[i * 3 + 2] = t[2] - 4 + r() * 8;
      seed[i] = r();
    }
    g.setAttribute("aOrigin", new THREE.InstancedBufferAttribute(origin, 3));
    g.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seed, 1));
    g.instanceCount = count;
    const m = new THREE.ShaderMaterial({
      vertexShader: vertex, fragmentShader: fragment, uniforms: { uTime: { value: 0 } },
      side: THREE.DoubleSide, transparent: true, depthWrite: false, toneMapped: false,
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.frustumCulled = false;
    return mesh;
  }, [count]);
  useFrame((s) => { (mesh.material as THREE.ShaderMaterial).uniforms.uTime.value = s.clock.elapsedTime; });
  return <primitive object={mesh} />;
}
