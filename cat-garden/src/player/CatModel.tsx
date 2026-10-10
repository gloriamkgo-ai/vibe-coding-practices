import { forwardRef, useMemo } from "react";
import * as THREE from "three";
import { makeFurTexture } from "../render/textures";

export interface CatRig {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  legs: THREE.Group[];
  tail: THREE.Group[];
  hat: THREE.Group;
  cape: THREE.Mesh;
}

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);

/**
 * A blocky ginger cat in tall boots, a plumed hat and a short cape.
 * Faces −z at rotation 0. Feet at y = 0, about 0.9 blocks tall.
 */
export const CatModel = forwardRef<THREE.Group, { onRig: (r: CatRig) => void }>(function CatModel({ onRig }, ref) {
  const m = useMemo(() => {
    const fur = makeFurTexture("#e8893a", "#b85a22", 3);
    const furLight = makeFurTexture("#f2a85a", "#d07a35", 5);
    return {
      fur: new THREE.MeshStandardMaterial({ map: fur, roughness: 0.85 }),
      furLight: new THREE.MeshStandardMaterial({ map: furLight, roughness: 0.85 }),
      cream: new THREE.MeshStandardMaterial({ color: "#fbe9d2", roughness: 0.9 }),
      pink: new THREE.MeshStandardMaterial({ color: "#f39ab0", roughness: 0.7 }),
      boot: new THREE.MeshStandardMaterial({ color: "#5a3420", roughness: 0.55, metalness: 0.05 }),
      cuff: new THREE.MeshStandardMaterial({ color: "#7a4a2a", roughness: 0.6 }),
      buckle: new THREE.MeshStandardMaterial({ color: "#ffd36a", emissive: "#ffb43a", emissiveIntensity: 0.6, metalness: 0.6, roughness: 0.3 }),
      eye: new THREE.MeshStandardMaterial({ color: "#d8ff6a", emissive: "#c8ff4a", emissiveIntensity: 1.6, toneMapped: false }),
      pupil: new THREE.MeshBasicMaterial({ color: "#1a1220" }),
      hat: new THREE.MeshStandardMaterial({ color: "#7a2236", roughness: 0.7 }),
      band: new THREE.MeshStandardMaterial({ color: "#ffd36a", metalness: 0.5, roughness: 0.35 }),
      feather: new THREE.MeshStandardMaterial({ color: "#fff4f8", emissive: "#ffd0e0", emissiveIntensity: 0.25, roughness: 0.6 }),
      cape: new THREE.MeshStandardMaterial({ color: "#a32a3e", roughness: 0.75, side: THREE.DoubleSide }),
    };
  }, []);

  const rig = useMemo(() => {
    const root = new THREE.Group();
    const body = new THREE.Group();
    root.add(body);
    const add = (parent: THREE.Object3D, g: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(g, mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      parent.add(mesh);
      return mesh;
    };
    // Torso
    add(body, box(0.42, 0.34, 0.6), m.fur, 0, 0.5, 0.02);
    add(body, box(0.34, 0.06, 0.48), m.cream, 0, 0.33, 0.0);
    // Cape
    const cape = add(body, box(0.46, 0.04, 0.42), m.cape, 0, 0.69, 0.16);
    cape.rotation.x = -0.12;
    // Head
    const head = new THREE.Group();
    head.position.set(0, 0.74, -0.3);
    body.add(head);
    add(head, box(0.44, 0.38, 0.38), m.furLight, 0, 0.06, 0);
    add(head, box(0.22, 0.12, 0.06), m.cream, 0, -0.04, -0.2);
    add(head, box(0.06, 0.04, 0.03), m.pink, 0, 0.02, -0.235);
    for (const s of [-1, 1]) {
      add(head, box(0.08, 0.08, 0.02), m.eye, s * 0.11, 0.1, -0.195);
      add(head, box(0.03, 0.07, 0.02), m.pupil, s * 0.11, 0.1, -0.205);
      const ear = add(head, box(0.12, 0.14, 0.08), m.furLight, s * 0.14, 0.31, 0.02);
      ear.rotation.z = s * -0.18;
      add(ear, box(0.06, 0.08, 0.02), m.pink, 0, -0.01, -0.045);
    }
    // Plumed hat
    const hat = new THREE.Group();
    hat.position.set(0, 0.28, 0.02);
    hat.rotation.z = 0.12;
    head.add(hat);
    add(hat, box(0.62, 0.04, 0.56), m.hat, 0, 0, 0);
    add(hat, box(0.36, 0.16, 0.34), m.hat, 0, 0.1, 0);
    add(hat, box(0.37, 0.04, 0.35), m.band, 0, 0.04, 0);
    const feather = add(hat, box(0.06, 0.05, 0.42), m.feather, 0.16, 0.2, 0.1);
    feather.rotation.x = -0.6;
    // Legs with tall boots
    const legs: THREE.Group[] = [];
    for (const [x, z] of [[-0.13, -0.18], [0.13, -0.18], [-0.13, 0.22], [0.13, 0.22]]) {
      const leg = new THREE.Group();
      leg.position.set(x, 0.36, z);
      body.add(leg);
      add(leg, box(0.13, 0.12, 0.13), m.fur, 0, -0.04, 0);
      add(leg, box(0.15, 0.2, 0.15), m.boot, 0, -0.22, 0);
      add(leg, box(0.18, 0.06, 0.18), m.cuff, 0, -0.1, 0);
      add(leg, box(0.15, 0.06, 0.2), m.boot, 0, -0.33, -0.03);
      add(leg, box(0.05, 0.04, 0.02), m.buckle, 0, -0.18, -0.08);
      legs.push(leg);
    }
    // Tail: three segments curling upward
    const tail: THREE.Group[] = [];
    let parent: THREE.Object3D = body;
    let pos: [number, number, number] = [0, 0.58, 0.32];
    for (let i = 0; i < 3; i++) {
      const seg = new THREE.Group();
      seg.position.set(...pos);
      parent.add(seg);
      add(seg, box(0.1, 0.1, 0.22), i === 2 ? m.cream : m.fur, 0, 0, 0.1);
      seg.rotation.x = 0.45;
      tail.push(seg);
      parent = seg;
      pos = [0, 0, 0.2];
    }
    const r: CatRig = { root, body, head, legs, tail, hat, cape };
    onRig(r);
    return r;
  }, [m, onRig]);

  return <primitive ref={ref} object={rig.root} />;
});
