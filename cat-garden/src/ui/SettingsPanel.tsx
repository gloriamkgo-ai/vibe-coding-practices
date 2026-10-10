import { useGame, type Quality } from "../state/gameStore";
import { setVolume } from "../systems/audio";

export function SettingsPanel() {
  const s = useGame((g) => g.settings);
  const set = useGame((g) => g.setSettings);
  return (
    <div className="settings">
      <label className="row" htmlFor="set-sens">
        <span>마우스 감도</span>
        <input id="set-sens" type="range" min={0.3} max={2.5} step={0.05} value={s.sensitivity} onChange={(e) => set({ sensitivity: Number(e.target.value) })} />
        <output>{s.sensitivity.toFixed(2)}</output>
      </label>
      <label className="row" htmlFor="set-vol">
        <span>효과음</span>
        <input id="set-vol" type="range" min={0} max={1} step={0.05} value={s.volume} onChange={(e) => { set({ volume: Number(e.target.value) }); setVolume(Number(e.target.value)); }} />
        <output>{Math.round(s.volume * 100)}%</output>
      </label>
      <div className="row">
        <span>그래픽 품질</span>
        <div className="seg" role="group" aria-label="그래픽 품질">
          {(["low", "medium", "high"] as Quality[]).map((q) => (
            <button key={q} type="button" aria-pressed={s.quality === q} onClick={() => set({ quality: q })}>{{ low: "낮음", medium: "보통", high: "높음" }[q]}</button>
          ))}
        </div>
      </div>
      <label className="row check" htmlFor="set-invert">
        <span>Y축 반전</span>
        <input id="set-invert" type="checkbox" checked={s.invertY} onChange={(e) => set({ invertY: e.target.checked })} />
      </label>
      <label className="row check" htmlFor="set-motion">
        <span>움직임 줄이기</span>
        <input id="set-motion" type="checkbox" checked={s.reduceMotion} onChange={(e) => set({ reduceMotion: e.target.checked })} />
      </label>
    </div>
  );
}
