import * as THREE from "three";

/** Sun sits low in the west-north-west, behind the main hall as seen from the entrance. */
export const SUN_DIR = new THREE.Vector3(-0.78, 0.17, -0.6).normalize();

export const SKY = {
  horizon: new THREE.Color("#ffb06a"),
  low: new THREE.Color("#f2788c"),
  mid: new THREE.Color("#8a5aa8"),
  zenith: new THREE.Color("#211b45"),
  ground: new THREE.Color("#2b1a33"),
  sun: new THREE.Color("#fff1c8"),
  fog: new THREE.Color("#d98a8e"),
};
