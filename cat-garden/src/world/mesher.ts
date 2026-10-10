import { def, B } from "./blocks";
import type { VoxelWorld } from "./voxelWorld";

export interface MeshData {
  positions: number[];
  normals: number[];
  uvs: number[];
  colors: number[];
  indices: number[];
}

const empty = (): MeshData => ({ positions: [], normals: [], uvs: [], colors: [], indices: [] });

// Face definitions: normal, four corners (unit cube, counter-clockwise from outside), and the
// two in-plane axes used for ambient-occlusion sampling.
const FACES = [
  { n: [1, 0, 0], c: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], kind: "side" },
  { n: [-1, 0, 0], c: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], kind: "side" },
  { n: [0, 1, 0], c: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], kind: "top" },
  { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], kind: "bottom" },
  { n: [0, 0, 1], c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], kind: "side" },
  { n: [0, 0, -1], c: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], kind: "side" },
] as const;

const AO_LEVELS = [0.42, 0.62, 0.82, 1.0];

export interface Meshes { opaque: MeshData; cutout: MeshData; water: MeshData; emissive: MeshData }

/** Build visible-face meshes with per-vertex ambient occlusion. */
export function buildMeshes(w: VoxelWorld, tiles: number): Meshes {
  const out: Meshes = { opaque: empty(), cutout: empty(), water: empty(), emissive: empty() };
  const occ = (x: number, y: number, z: number) => def(w.get(x, y, z)).occludes ? 1 : 0;
  const tileUV = (t: number) => {
    const s = 1 / tiles, pad = 0.0005;
    const u0 = (t % tiles) * s + pad, v1 = 1 - Math.floor(t / tiles) * s - pad;
    return { u0, u1: u0 + s - 2 * pad, v0: v1 - s + 2 * pad, v1 };
  };

  for (let y = 0; y < w.sy; y++)
    for (let z = 0; z < w.sz; z++)
      for (let x = 0; x < w.sx; x++) {
        const b = w.get(x, y, z);
        if (b === B.AIR) continue;
        const d = def(b);
        if (d.kind === "none") continue;
        const target = d.kind === "water" ? out.water : d.kind === "cutout" ? out.cutout : d.kind === "emissive" ? out.emissive : out.opaque;
        const h = d.height;
        for (const f of FACES) {
          const nx = x + f.n[0], ny = y + f.n[1], nz = z + f.n[2];
          const nb = w.get(nx, ny, nz);
          const nd = def(nb);
          if (d.kind === "water") {
            if (nb === B.WATER || nd.occludes) continue;
            if (f.n[1] === 0 && nd.solid) continue;
          } else {
            // A slab's top is never hidden by the block above unless that block touches it.
            const touching = !(f.n[1] === 1 && h < 1);
            if (touching && nd.occludes) continue;
            if (d.kind === "cutout" && nb === b) continue;
          }
          const tile = f.kind === "top" ? d.tiles.top : f.kind === "bottom" ? d.tiles.bottom : d.tiles.side;
          const uv = tileUV(tile);
          const base = target.positions.length / 3;
          const ao: number[] = [];
          for (let i = 0; i < 4; i++) {
            const c = f.c[i];
            const py = c[1] === 1 ? h : 0;
            target.positions.push(x + c[0], y + py, z + c[2]);
            target.normals.push(f.n[0], f.n[1], f.n[2]);
            const vTop = c[1] === 1 ? uv.v0 + (uv.v1 - uv.v0) * (f.kind === "side" ? h : 1) : uv.v0;
            let u: number, v: number;
            if (f.kind === "side") { u = i === 0 || i === 3 ? uv.u0 : uv.u1; v = c[1] === 1 ? vTop : uv.v0; }
            else { u = c[0] === 0 ? uv.u0 : uv.u1; v = c[2] === 0 ? uv.v0 : uv.v1; }
            if (d.kind === "water") { u = (x + c[0]) * 0.5; v = (z + c[2]) * 0.5; }
            target.uvs.push(u, v);
            // Ambient occlusion: sample the three blocks touching this corner on the outer side.
            let a = 3;
            if (d.kind === "opaque" || d.kind === "emissive") {
              const ax = f.n[0] !== 0 ? 0 : 1, az = f.n[2] !== 0 ? 0 : 1;
              const s1 = [0, 0, 0], s2 = [0, 0, 0];
              if (f.n[0] !== 0) { s1[1] = c[1] ? 1 : -1; s2[2] = c[2] ? 1 : -1; }
              else if (f.n[1] !== 0) { s1[0] = c[0] ? 1 : -1; s2[2] = c[2] ? 1 : -1; }
              else { s1[0] = c[0] ? 1 : -1; s2[1] = c[1] ? 1 : -1; }
              void ax; void az;
              const o1 = occ(nx + s1[0], ny + s1[1], nz + s1[2]);
              const o2 = occ(nx + s2[0], ny + s2[1], nz + s2[2]);
              const oc = occ(nx + s1[0] + s2[0], ny + s1[1] + s2[1], nz + s1[2] + s2[2]);
              a = o1 && o2 ? 0 : 3 - (o1 + o2 + oc);
            }
            ao.push(a);
            // Faces facing away from the sun are a touch darker for readable shape.
            const shade = f.n[1] === 1 ? 1 : f.n[1] === -1 ? 0.55 : f.n[0] !== 0 ? 0.86 : 0.78;
            const k = AO_LEVELS[a] * shade;
            target.colors.push(k, k, k);
          }
          // Flip the quad diagonal to avoid AO artefacts.
          if (ao[0] + ao[2] > ao[1] + ao[3]) target.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
          else target.indices.push(base + 1, base + 2, base + 3, base + 1, base + 3, base);
        }
      }
  return out;
}
