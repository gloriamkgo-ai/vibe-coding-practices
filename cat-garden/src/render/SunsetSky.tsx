import { useMemo } from "react";
import * as THREE from "three";
import { SKY, SUN_DIR } from "./palette";

const vertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize((modelMatrix * vec4(position, 0.0)).xyz);
    vec4 p = projectionMatrix * viewMatrix * vec4(cameraPosition + vDir * 900.0, 1.0);
    gl_Position = p.xyww;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uHorizon, uLow, uMid, uZenith, uGround, uSun, uSunDir;
  varying vec3 vDir;
  float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    float s = max(dot(d, uSunDir), 0.0);
    // Altitude gradient, warmer toward the sun
    vec3 col = mix(uHorizon, uLow, smoothstep(0.0, 0.14, h));
    col = mix(col, uMid, smoothstep(0.12, 0.38, h));
    col = mix(col, uZenith, smoothstep(0.35, 0.85, h));
    col = mix(col, uHorizon * 1.15, pow(s, 6.0) * (1.0 - smoothstep(0.0, 0.5, h)) * 0.7);
    // Below the horizon
    col = mix(col, uGround, smoothstep(0.0, -0.08, h));
    // Sun disc and glow (HDR so it blooms)
    float disc = smoothstep(0.99935, 0.99965, s);
    col += uSun * disc * 8.0;
    col += uSun * (pow(s, 90.0) * 1.6 + pow(s, 14.0) * 0.32);
    // Faint stars high in the east
    vec3 g = floor(d * 380.0);
    float star = step(0.9975, hash(g)) * smoothstep(0.38, 0.75, h) * (1.0 - s);
    col += vec3(star) * 1.4;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function SunsetSky() {
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: {
      uHorizon: { value: SKY.horizon }, uLow: { value: SKY.low }, uMid: { value: SKY.mid },
      uZenith: { value: SKY.zenith }, uGround: { value: SKY.ground }, uSun: { value: SKY.sun },
      uSunDir: { value: SUN_DIR },
    },
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: true,
    fog: false,
    toneMapped: false,
  }), []);
  return (
    <mesh material={material} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[1, 32, 16]} />
    </mesh>
  );
}
