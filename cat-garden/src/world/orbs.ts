export interface OrbDef {
  id: number;
  name: string;
  hint: string;
  pos: [number, number, number];
}

export const ORBS: OrbDef[] = [
  { id: 0, name: "도리이의 구슬", hint: "입구 도리이 아래", pos: [32, 5.0, 55.5] },
  { id: 1, name: "다리의 구슬", hint: "아치 다리 꼭대기", pos: [17, 8.0, 35.0] },
  { id: 2, name: "징검돌의 구슬", hint: "연못 가운데 징검돌", pos: [16.5, 5.0, 43.0] },
  { id: 3, name: "벚나무의 구슬", hint: "벚나무 가지 끝", pos: [42.5, 9.0, 36.5] },
  { id: 4, name: "탑의 구슬", hint: "작은 탑 꼭대기", pos: [48.5, 12.0, 48.5] },
  { id: 5, name: "본당의 구슬", hint: "본당 안 제단", pos: [32, 7.5, 6.5] },
  { id: 6, name: "지붕의 구슬", hint: "본당 용마루", pos: [31.5, 16.0, 8.5] },
];

export const COLLECT_RADIUS = 1.2;
