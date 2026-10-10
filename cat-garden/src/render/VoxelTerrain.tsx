import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildMeshes, type MeshData } from "../world/mesher";
import { world } from "../systems/runtime";
import { ATLAS_TILES, getAtlas, makeWaterTexture } from "./textures";
import { B } from "../world/blocks";

function toGeometry(m: MeshData) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(m.positions, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(m.normals, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(m.uvs, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(m.colors, 3));
  g.setIndex(m.indices);
  g.computeBoundingSphere();
  return g;
}

export const LANTERNS: [number, number, number][] = [];
for (let y = 0; y < world.sy; y++) for (let z = 0; z < world.sz; z++) for (let x = 0; x < world.sx; x++)
  if (world.get(x, y, z) === B.LANTERN) LANTERNS.push([x + 0.5, y + 0.5, z + 0.5]);

export function VoxelTerrain({ shadows }: { shadows: boolean }) {
  const { geos, mats, water } = useMemo(() => {
    const meshes = buildMeshes(world, ATLAS_TILES);
    const atlas = getAtlas();
    const water = makeWaterTexture();
    const geos = {
      opaque: toGeometry(meshes.opaque),
      cutout: toGeometry(meshes.cutout),
      emissive: toGeometry(meshes.emissive),
      water: toGeometry(meshes.water),
    };
    const mats = {
      opaque: new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.93, metalness: 0 }),
      cutout: new THREE.MeshStandardMaterial({
        map: atlas, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8,
        emissive: new THREE.Color("#ff8fb0"), emissiveIntensity: 0.12, emissiveMap: atlas,
      }),
      emissive: new THREE.MeshStandardMaterial({
        map: atlas, vertexColors: true, roughness: 0.6,
        emissive: new THREE.Color("#ffb45a"), emissiveMap: atlas, emissiveIntensity: 2.6, toneMapped: false,
      }),
      // The pond mirrors the sunset: a bright pink-violet sheen over the scrolling ripples.
      water: new THREE.MeshStandardMaterial({
        map: water, color: new THREE.Color("#e6c8ff"), transparent: true, opacity: 0.9,
        roughness: 0.08, metalness: 0.25, emissive: new THREE.Color("#c46a9a"), emissiveIntensity: 0.55, emissiveMap: water, depthWrite: false,
      }),
    };
    return { geos, mats, water };
  }, []);

  useFrame((_, dt) => {
    water.offset.x = (water.offset.x + dt * 0.035) % 1;
    water.offset.y = (water.offset.y + dt * 0.02) % 1;
  });

  return (
    <group>
      <mesh geometry={geos.opaque} material={mats.opaque} castShadow={shadows} receiveShadow={shadows} />
      <mesh geometry={geos.cutout} material={mats.cutout} castShadow={shadows} receiveShadow={shadows} />
      <mesh geometry={geos.emissive} material={mats.emissive} castShadow={shadows} />
      <mesh geometry={geos.water} material={mats.water} receiveShadow={shadows} renderOrder={2} />
    </group>
  );
}

export function LanternLights({ count }: { count: number }) {
  return (
    <>
      {LANTERNS.slice(0, count).map(([x, y, z], i) => (
        <pointLight key={i} position={[x, y, z]} color="#ffae55" intensity={9} distance={9} decay={2} />
      ))}
    </>
  );
}
