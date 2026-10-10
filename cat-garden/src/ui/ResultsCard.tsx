import { useGame } from "../state/gameStore";
import { formatTime } from "../systems/timer";

export function ResultsCard({ onRestart, onTitle }: { onRestart: () => void; onTitle: () => void }) {
  const { elapsed, best, newRecord } = useGame();
  return (
    <div className="overlay soft" role="dialog" aria-modal="true" aria-labelledby="result-title">
      <div className="panel result">
        <div className="eyebrow">일곱 개의 구슬을 모두 모았어요</div>
        <h2 id="result-title">정원에 불꽃이 피었어요</h2>
        <div className="result-time">{formatTime(elapsed)}</div>
        {newRecord ? <div className="badge">새 최고 기록</div> : <div className="panel-sub">최고 기록 {best !== null ? formatTime(best) : "-"}</div>}
        <div className="panel-actions">
          <button className="btn primary" type="button" onClick={onRestart} autoFocus>다시 하기</button>
          <button className="btn ghost" type="button" onClick={onTitle}>타이틀로</button>
        </div>
      </div>
    </div>
  );
}
