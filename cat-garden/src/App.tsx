import { Suspense, useCallback, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useGame } from "./state/gameStore";
import { SunsetSky } from "./render/SunsetSky";
import { Lighting } from "./render/Lighting";
import { VoxelTerrain, LanternLights } from "./render/VoxelTerrain";
import { Backdrop } from "./render/Backdrop";
import { Fireflies } from "./render/Fireflies";
import { Petals } from "./render/Petals";
import { Orbs } from "./render/Orbs";
import { Fireworks } from "./render/Fireworks";
import { Effects } from "./render/Effects";
import { Player, resetGameTime } from "./player/Player";
import { Hud } from "./ui/Hud";
import { TitleScreen } from "./ui/TitleScreen";
import { PauseMenu } from "./ui/PauseMenu";
import { ResultsCard } from "./ui/ResultsCard";
import { attachKeyboard, clearPresses } from "./input/keyboard";
import { attachPointer, releaseLock, requestLock, takeMouseDelta } from "./input/pointerLock";
import { FLAGS, resetRun } from "./systems/runtime";
import { initAudio, setVolume } from "./systems/audio";
import "./ui/ui.css";

const QUALITY = {
  low: { dpr: 1, fireflies: 40, petals: 120, lanterns: 2, shadows: false },
  medium: { dpr: 1.25, fireflies: 90, petals: 220, lanterns: 4, shadows: true },
  high: { dpr: 1.5, fireflies: 130, petals: 320, lanterns: 6, shadows: true },
};

export default function App() {
  const phase = useGame((s) => s.phase);
  const quality = useGame((s) => s.settings.quality);
  const q = QUALITY[quality];

  const startRun = useCallback(() => {
    initAudio();
    setVolume(useGame.getState().settings.volume);
    resetRun();
    resetGameTime();
    clearPresses();
    takeMouseDelta();
    useGame.setState({ phase: "playing", collected: 0, elapsed: 0, toast: null, compass: null, newRecord: false });
    if (!FLAGS.autopilot) void requestLock();
  }, []);

  const resume = useCallback(() => {
    clearPresses();
    takeMouseDelta();
    useGame.setState({ phase: "playing" });
    if (!FLAGS.autopilot) void requestLock();
  }, []);

  const toTitle = useCallback(() => {
    releaseLock();
    resetRun();
    resetGameTime();
    useGame.setState({ phase: "title", collected: 0, elapsed: 0, toast: null, compass: null });
  }, []);

  useEffect(() => {
    attachKeyboard((code) => {
      const ph = useGame.getState().phase;
      if ((code === "KeyP" || code === "Escape") && ph === "playing") { useGame.setState({ phase: "paused" }); releaseLock(); }
      else if (code === "KeyP" && ph === "paused") resume();
    });
    attachPointer((locked) => {
      if (!locked && useGame.getState().phase === "playing" && !FLAGS.autopilot) useGame.setState({ phase: "paused" });
    });
    const onVis = () => { if (document.hidden && useGame.getState().phase === "playing") useGame.setState({ phase: "paused" }); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [resume]);

  useEffect(() => {
    if (!FLAGS.autopilot) return;
    const t = setTimeout(() => { if (useGame.getState().phase === "title") startRun(); }, 1500);
    return () => clearTimeout(t);
  }, [startRun]);

  useEffect(() => { if (phase === "results") releaseLock(); }, [phase]);

  return (
    <div className={`app phase-${phase}`}>
      <Canvas
        flat
        shadows={q.shadows ? "soft" : false}
        dpr={[1, q.dpr]}
        camera={{ fov: 70, near: 0.1, far: 1500, position: [32, 14, 70] }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        onPointerDown={() => { if (useGame.getState().phase === "playing" && !FLAGS.autopilot) void requestLock(); }}
      >
        <Suspense fallback={null}>
          <SunsetSky />
          <Lighting quality={quality} />
          <Backdrop />
          <VoxelTerrain shadows={q.shadows} />
          <LanternLights count={q.lanterns} />
          <Orbs />
          <Fireflies count={q.fireflies} />
          <Petals count={q.petals} />
          <Fireworks />
          <Player />
          <Effects quality={quality} />
        </Suspense>
      </Canvas>

      {phase === "title" && <TitleScreen onStart={startRun} />}
      {(phase === "playing" || phase === "paused") && <Hud />}
      {phase === "paused" && <PauseMenu onResume={resume} onRestart={startRun} onTitle={toTitle} />}
      {phase === "celebrating" && (
        <div className="cinema" aria-live="polite">
          <div className="bar top" /><div className="bar bottom" />
          <div className="cinema-caption">일곱 개의 영혼이 하늘로 돌아가요</div>
        </div>
      )}
      {phase === "results" && <ResultsCard onRestart={startRun} onTitle={toTitle} />}
      {FLAGS.autopilot && phase === "playing" && <div className="demo-tag">자동 플레이</div>}
    </div>
  );
}
