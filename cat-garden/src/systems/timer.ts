export function formatTime(ms: number) {
  const t = Math.max(0, ms);
  const m = Math.floor(t / 60000), s = Math.floor(t / 1000) % 60, cs = Math.floor(t / 10) % 100;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}
