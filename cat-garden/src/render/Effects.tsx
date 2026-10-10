import { Bloom, EffectComposer, ToneMapping, Vignette, SMAA } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import type { Quality } from "../state/gameStore";

export function Effects({ quality }: { quality: Quality }) {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={quality === "low" ? 0.8 : 1.15} luminanceThreshold={1.0} luminanceSmoothing={0.2} radius={0.75} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.28} darkness={0.62} />
      {quality !== "low" ? <SMAA /> : <></>}
    </EffectComposer>
  );
}
