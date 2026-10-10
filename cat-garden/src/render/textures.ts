import * as THREE from "three";
import { rng } from "../utils/rng";
import { TILE } from "../world/blocks";

export const ATLAS_TILES = 4; // 4 × 4 tiles
const PX = 16;

type Painter = (set: (x: number, y: number, c: string) => void, r: () => number) => void;

const hex = (h: number, s: number, l: number) => `hsl(${h} ${s}% ${l}%)`;
const noiseFill = (h: number, s: number, l: number, spread: number): Painter => (set, r) => {
  for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) set(x, y, hex(h + (r() - 0.5) * 6, s, l + (r() - 0.5) * spread));
};

const painters: Record<number, Painter> = {
  [TILE.grassTop]: (set, r) => {
    for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) {
      const v = r();
      set(x, y, hex(95 + v * 18, 42, 30 + v * 12));
      if (v > 0.93) set(x, y, hex(48, 70, 52)); // sunlit blade tips
    }
  },
  [TILE.grassSide]: (set, r) => {
    noiseFill(24, 32, 30, 10)(set, r);
    for (let x = 0; x < PX; x++) {
      const d = 3 + Math.floor(r() * 3);
      for (let y = 0; y < d; y++) set(x, y, hex(98 + r() * 14, 42, 32 + r() * 10));
    }
  },
  [TILE.dirt]: noiseFill(24, 32, 30, 12),
  [TILE.stone]: (set, r) => {
    noiseFill(250, 6, 52, 12)(set, r);
    for (let i = 0; i < 6; i++) { const x = Math.floor(r() * PX), y = Math.floor(r() * PX); set(x, y, hex(250, 8, 38)); set((x + 1) % PX, y, hex(250, 8, 40)); }
  },
  [TILE.path]: (set, r) => {
    for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) {
      const seam = x % 8 === 0 || (y + (Math.floor(x / 8) % 2) * 4) % 8 === 0;
      set(x, y, seam ? hex(30, 10, 34) : hex(32 + r() * 8, 14, 58 + (r() - 0.5) * 10));
    }
  },
  [TILE.red]: (set, r) => {
    for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) {
      const grain = Math.sin(y * 0.9 + Math.sin(x * 0.4) * 1.5) * 4;
      set(x, y, hex(6 + r() * 4, 72, 42 + grain + (r() - 0.5) * 5));
    }
    for (let x = 0; x < PX; x++) { set(x, 0, hex(8, 60, 30)); set(x, PX - 1, hex(8, 60, 30)); }
  },
  [TILE.dark]: (set, r) => {
    for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) set(x, y, hex(18, 30, 16 + Math.sin(y * 1.3) * 3 + r() * 4));
  },
  [TILE.tile]: (set, r) => {
    for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) {
      const row = Math.floor(y / 4), ox = (row % 2) * 2;
      const edge = y % 4 === 3 || (x + ox) % 4 === 0;
      set(x, y, edge ? hex(225, 30, 14) : hex(222 + r() * 6, 26, 26 + (3 - (y % 4)) * 3 + r() * 3));
    }
  },
  [TILE.leaves]: (set, r) => {
    for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) {
      const v = r();
      if (v < 0.16) set(x, y, "transparent");
      else set(x, y, hex(335 + v * 18, 70 + v * 20, 74 + v * 14 - (v > 0.85 ? 12 : 0)));
    }
  },
  [TILE.hedge]: (set, r) => {
    for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) { const v = r(); set(x, y, hex(120 + v * 20, 32, 18 + v * 14)); }
  },
  [TILE.water]: (set, r) => {
    for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) {
      const wave = Math.sin((x + y * 0.5) * 0.8) * 0.5 + 0.5;
      set(x, y, hex(205 + r() * 10, 60, 30 + wave * 18));
    }
  },
  [TILE.lantern]: (set, r) => {
    for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) {
      const frame = x < 2 || x > 13 || y < 2 || y > 13 || x === 7 || x === 8;
      set(x, y, frame ? hex(250, 6, 40 + r() * 6) : hex(38 + r() * 8, 100, 62 + r() * 10));
    }
  },
  [TILE.bark]: (set, r) => {
    for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) set(x, y, hex(14, 26, 22 + (x % 4 === 0 ? -5 : 0) + r() * 6));
  },
  [TILE.barkTop]: (set, r) => {
    for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) {
      const d = Math.hypot(x - 7.5, y - 7.5);
      set(x, y, hex(26, 34, 34 + Math.sin(d * 1.6) * 6 + r() * 4));
    }
  },
  [TILE.plaster]: (set, r) => {
    noiseFill(36, 30, 86, 6)(set, r);
    for (let x = 0; x < PX; x++) set(x, PX - 1, hex(30, 20, 70));
  },
  [TILE.gold]: (set, r) => {
    for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) {
      const rim = x === 0 || y === 0 || x === PX - 1 || y === PX - 1;
      set(x, y, rim ? hex(36, 80, 34) : hex(44 + r() * 6, 90, 52 + r() * 14));
    }
  },
};

function paintTile(ctx: CanvasRenderingContext2D, tile: number, ox: number, oy: number) {
  const r = rng(1000 + tile * 97);
  painters[tile]?.((x, y, c) => {
    if (c === "transparent") { ctx.clearRect(ox + x, oy + y, 1, 1); return; }
    ctx.fillStyle = c;
    ctx.fillRect(ox + x, oy + y, 1, 1);
  }, r);
}

let atlas: THREE.CanvasTexture | null = null;
export function getAtlas(): THREE.CanvasTexture {
  if (atlas) return atlas;
  const c = document.createElement("canvas");
  c.width = c.height = PX * ATLAS_TILES;
  const ctx = c.getContext("2d")!;
  for (let t = 0; t < ATLAS_TILES * ATLAS_TILES; t++) paintTile(ctx, t, (t % ATLAS_TILES) * PX, Math.floor(t / ATLAS_TILES) * PX);
  atlas = new THREE.CanvasTexture(c);
  atlas.magFilter = THREE.NearestFilter;
  atlas.minFilter = THREE.NearestFilter;
  atlas.generateMipmaps = false;
  atlas.colorSpace = THREE.SRGBColorSpace;
  return atlas;
}

/** Separate tileable water texture so it can scroll. */
export function makeWaterTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = PX;
  const ctx = c.getContext("2d")!;
  paintTile(ctx, TILE.water, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Pixel-art fur for the cat: ginger tabby stripes. */
export function makeFurTexture(base: string, stripe: string, seed: number): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 8;
  const ctx = c.getContext("2d")!;
  const r = rng(seed);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    ctx.fillStyle = (y % 3 === 0 && r() > 0.25) ? stripe : base;
    ctx.fillRect(x, y, 1, 1);
    if (r() > 0.9) { ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.fillRect(x, y, 1, 1); }
  }
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
