import * as THREE from "three";

/* CPU particle pool rendered as additive points. Used for orb bursts and fireworks. */
const vertex = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aAlpha;
  uniform float uPixel;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vColor = aColor;
    vAlpha = aAlpha;
    gl_PointSize = uPixel * aSize * 60.0 / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;
const fragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d) * vAlpha;
    gl_FragColor = vec4(vColor * a, a);
  }
`;

export class ParticlePool {
  readonly points: THREE.Points;
  private pos: Float32Array; private vel: Float32Array; private col: Float32Array;
  private base: Float32Array; private size: Float32Array; private alpha: Float32Array;
  private life: Float32Array; private maxLife: Float32Array; private drag: Float32Array; private grav: Float32Array;
  private next = 0;

  constructor(readonly capacity: number) {
    this.pos = new Float32Array(capacity * 3); this.vel = new Float32Array(capacity * 3);
    this.col = new Float32Array(capacity * 3); this.base = new Float32Array(capacity * 3);
    this.size = new Float32Array(capacity); this.alpha = new Float32Array(capacity);
    this.life = new Float32Array(capacity); this.maxLife = new Float32Array(capacity);
    this.drag = new Float32Array(capacity); this.grav = new Float32Array(capacity);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(this.col, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(this.size, 1));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(this.alpha, 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: vertex, fragmentShader: fragment,
      uniforms: { uPixel: { value: Math.min(window.devicePixelRatio, 2) } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    });
    this.points = new THREE.Points(g, m);
    this.points.frustumCulled = false;
  }

  emit(p: THREE.Vector3Like, v: THREE.Vector3Like, color: THREE.Color, intensity: number, size: number, life: number, drag = 1.2, gravity = 3) {
    const i = this.next;
    this.next = (this.next + 1) % this.capacity;
    this.pos.set([p.x, p.y, p.z], i * 3);
    this.vel.set([v.x, v.y, v.z], i * 3);
    this.base.set([color.r * intensity, color.g * intensity, color.b * intensity], i * 3);
    this.size[i] = size; this.life[i] = life; this.maxLife[i] = life;
    this.drag[i] = drag; this.grav[i] = gravity;
  }

  update(dt: number) {
    for (let i = 0; i < this.capacity; i++) {
      if (this.life[i] <= 0) { this.alpha[i] = 0; continue; }
      this.life[i] -= dt;
      const k = Math.max(0, this.life[i] / this.maxLife[i]);
      const d = Math.exp(-this.drag[i] * dt);
      this.vel[i * 3] *= d; this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * d - this.grav[i] * dt; this.vel[i * 3 + 2] *= d;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      this.alpha[i] = Math.min(1, k * 1.6);
      const flicker = k < 0.35 ? 0.6 + 0.4 * Math.sin(i * 12.7 + k * 80) : 1;
      for (let c = 0; c < 3; c++) this.col[i * 3 + c] = this.base[i * 3 + c] * flicker * (0.4 + k * 0.6);
    }
    const g = this.points.geometry;
    g.attributes.position.needsUpdate = true;
    g.attributes.aColor.needsUpdate = true;
    g.attributes.aSize.needsUpdate = true;
    g.attributes.aAlpha.needsUpdate = true;
  }
}
