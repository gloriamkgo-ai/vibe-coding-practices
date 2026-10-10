import { useEffect, useState } from "react";
import { useGame } from "../state/gameStore";
import { ORBS } from "../world/orbs";
import { formatTime } from "../systems/timer";
import { CARDINALS } from "../systems/compass";
import { runtime } from "../systems/runtime";
import { wrapAngle } from "../utils/math";

const BAND = 520;              // px
const SPAN = Math.PI * 0.95;   // visible field of the band

function Compass() {
  const compass = useGame((s) => s.compass);
  const [yaw, setYaw] = useState(0);
  useEffect(() => {
    let raf = 0;
    const loop = () => { setYaw(runtime.yaw); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const px = (rel: number) => BAND / 2 - (rel / SPAN) * BAND;
  const ticks = [];
  for (let d = 0; d < 360; d += 15) {
    const heading = (-d * Math.PI) / 180;
    const rel = wrapAngle(heading - yaw);
    if (Math.abs(rel) > SPAN / 2) continue;
    const card = CARDINALS.find((c) => Math.abs(wrapAngle(c.heading - heading)) < 0.01);
    ticks.push(
      <div key={d} className={card ? "tick major" : d % 45 === 0 ? "tick mid" : "tick"} style={{ left: px(rel) }}>
        {card && <span>{card.label}</span>}
      </div>,
    );
  }
  const visible = compass && Math.abs(compass.rel) <= SPAN / 2;
  const clampedRel = compass ? Math.max(-SPAN / 2, Math.min(SPAN / 2, compass.rel)) : 0;
  return (
    <div className="compass" role="img" aria-label={compass ? `가장 가까운 구슬까지 ${Math.round(compass.dist)}블록` : "나침반"}>
      <div className="compass-band">
        {ticks}
        {compass && (
          <div className={visible ? "target" : "target edge"} style={{ left: px(clampedRel) }}>
            <i />
            <b>{Math.round(compass.dist)}m{compass.dy > 1.5 ? " ▲" : compass.dy < -1.5 ? " ▼" : ""}</b>
          </div>
        )}
        <div className="compass-center" />
      </div>
    </div>
  );
}

function Toast() {
  const toast = useGame((s) => s.toast);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!toast) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 2600);
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast) return null;
  return (
    <div className={show ? "toast in" : "toast"} key={toast.key} role="status">
      <span className="toast-gem" />
      <div><b>{toast.text}</b><small>{toast.sub}</small></div>
    </div>
  );
}

function Help() {
  const [on, setOn] = useState(true);
  useEffect(() => { const t = setTimeout(() => setOn(false), 4500); return () => clearTimeout(t); }, []);
  return (
    <div className={on ? "help in" : "help"}>
      <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 이동</span>
      <span><kbd>마우스</kbd> 시점</span>
      <span><kbd>Shift</kbd> 질주</span>
      <span><kbd>Space</kbd> 점프</span>
      <span><kbd>Esc</kbd> 일시정지</span>
    </div>
  );
}

export function Hud() {
  const collected = useGame((s) => s.collected);
  const elapsed = useGame((s) => s.elapsed);
  return (
    <div className="hud">
      <div className="hud-orbs">
        <div className="gems">
          {ORBS.map((o) => <span key={o.id} className={runtime.collected[o.id] ? "gem on" : "gem"} title={o.hint} />)}
        </div>
        <div className="hud-label">영혼의 구슬 <b>{collected}</b> / {ORBS.length}</div>
      </div>
      <Compass />
      <div className="hud-timer"><small>기록</small><b>{formatTime(elapsed)}</b></div>
      <Toast />
      <Help />
    </div>
  );
}
