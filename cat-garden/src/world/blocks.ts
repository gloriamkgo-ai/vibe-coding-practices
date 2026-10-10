// Block catalogue. Tile indices point into the 4×4 texture atlas built in render/textures.ts.
export const enum B {
  AIR = 0, GRASS, DIRT, STONE, PATH, RED, DARK, TILE, LEAVES, HEDGE, WATER, LANTERN,
  BARK, PLASTER, STONE_SLAB, RED_SLAB, TILE_SLAB, PATH_SLAB, GOLD, BOUNDARY = 255,
}

export const TILE = {
  grassTop: 0, grassSide: 1, dirt: 2, stone: 3, path: 4, red: 5, dark: 6, tile: 7,
  leaves: 8, hedge: 9, water: 10, lantern: 11, bark: 12, barkTop: 13, plaster: 14, gold: 15,
} as const;

export interface BlockDef {
  solid: boolean;
  /** Collision and render height in blocks (1 = full cube, 0.5 = slab). */
  height: number;
  /** Full opaque cube: hides the neighbour face behind it. */
  occludes: boolean;
  kind: "opaque" | "cutout" | "water" | "emissive" | "none";
  tiles: { top: number; side: number; bottom: number };
}

const t = (top: number, side = top, bottom = side) => ({ top, side, bottom });
const full = (tiles: BlockDef["tiles"], kind: BlockDef["kind"] = "opaque"): BlockDef =>
  ({ solid: true, height: 1, occludes: kind === "opaque", kind, tiles });
const slab = (tile: number): BlockDef => ({ solid: true, height: 0.5, occludes: false, kind: "opaque", tiles: t(tile) });

export const BLOCKS: Record<number, BlockDef> = {
  [B.AIR]: { solid: false, height: 0, occludes: false, kind: "none", tiles: t(0) },
  [B.GRASS]: full(t(TILE.grassTop, TILE.grassSide, TILE.dirt)),
  [B.DIRT]: full(t(TILE.dirt)),
  [B.STONE]: full(t(TILE.stone)),
  [B.PATH]: full(t(TILE.path, TILE.stone)),
  [B.RED]: full(t(TILE.red)),
  [B.DARK]: full(t(TILE.dark)),
  [B.TILE]: full(t(TILE.tile)),
  [B.LEAVES]: { ...full(t(TILE.leaves), "cutout"), occludes: false },
  [B.HEDGE]: full(t(TILE.hedge)),
  [B.WATER]: { solid: false, height: 0.88, occludes: false, kind: "water", tiles: t(TILE.water) },
  [B.LANTERN]: { ...full(t(TILE.stone, TILE.lantern, TILE.stone), "emissive"), occludes: false },
  [B.BARK]: full(t(TILE.barkTop, TILE.bark, TILE.barkTop)),
  [B.PLASTER]: full(t(TILE.plaster)),
  [B.STONE_SLAB]: slab(TILE.stone),
  [B.RED_SLAB]: slab(TILE.red),
  [B.TILE_SLAB]: slab(TILE.tile),
  [B.PATH_SLAB]: slab(TILE.path),
  [B.GOLD]: full(t(TILE.gold), "emissive"),
  [B.BOUNDARY]: { solid: true, height: 1, occludes: false, kind: "none", tiles: t(0) },
};

export const def = (b: number): BlockDef => BLOCKS[b] ?? BLOCKS[B.AIR];
