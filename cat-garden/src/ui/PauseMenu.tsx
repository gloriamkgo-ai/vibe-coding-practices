import { useState } from "react";
import { SettingsPanel } from "./SettingsPanel";
import { useGame } from "../state/gameStore";
import { ORBS } from "../world/orbs";
import { runtime } from "../systems/runtime";

export function PauseMenu({ onResume, onRestart, onTitle }: { onResume: () => void; onRestart: () => void; onTitle: () => void }) {
  const [settings, setSettings] = useState(false);
  const collected = useGame((s) => s.collected);
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="pause-title">
      <div className="panel">
        <h2 id="pause-title">일시정지</h2>
        <p className="panel-sub">구슬 {collected} / {ORBS.length}</p>
        <ul className="orb-hints" hidden={settings}>
          {ORBS.map((o) => <li key={o.id} className={runtime.collected[o.id] ? "done" : ""}><span className="gem small" />{o.hint}</li>)}
        </ul>
        {settings ? <SettingsPanel /> : null}
        <div className="panel-actions">
          <button className="btn primary" type="button" onClick={onResume} autoFocus>계속하기</button>
          <button className="btn ghost" type="button" aria-expanded={settings} onClick={() => setSettings((v) => !v)}>설정</button>
          <button className="btn ghost" type="button" onClick={onRestart}>처음부터</button>
          <button className="btn ghost" type="button" onClick={onTitle}>타이틀로</button>
        </div>
      </div>
    </div>
  );
}
