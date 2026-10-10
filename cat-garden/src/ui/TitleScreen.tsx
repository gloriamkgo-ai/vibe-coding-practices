import { useState } from "react";
import { useGame } from "../state/gameStore";
import { formatTime } from "../systems/timer";

export function TitleScreen({ onStart }: { onStart: () => void }) {
  const best = useGame((s) => s.best);
  const [controls, setControls] = useState(false);
  return (
    <div className="title-screen">
      <div className="title-block">
        <div className="eyebrow">해 질 녘 · 사원 정원</div>
        <h1>노을 정원의 고양이</h1>
        <p className="tagline">장화를 신은 고양이와 함께, 정원 곳곳에 잠든 <em>영혼의 구슬 일곱 개</em>를 찾아 주세요.</p>
        <div className="title-actions">
          <button className="btn primary" type="button" onClick={onStart} autoFocus>시작하기</button>
          <button className="btn ghost" type="button" aria-expanded={controls} onClick={() => setControls((v) => !v)}>조작 방법</button>
        </div>
        {controls && (
          <dl className="controls-list">
            <div><dt><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> · 방향키</dt><dd>이동</dd></div>
            <div><dt><kbd>마우스</kbd></dt><dd>시점 회전</dd></div>
            <div><dt><kbd>Shift</kbd></dt><dd>누르는 동안 질주</dd></div>
            <div><dt><kbd>Space</kbd></dt><dd>점프</dd></div>
            <div><dt><kbd>Esc</kbd> · <kbd>P</kbd></dt><dd>일시정지</dd></div>
          </dl>
        )}
        <div className="best">{best !== null ? <>최고 기록 <b>{formatTime(best)}</b></> : "아직 기록이 없어요"}</div>
      </div>
      <div className="title-foot">시작하면 마우스가 화면에 잠겨요. Esc를 누르면 풀려요.</div>
    </div>
  );
}
