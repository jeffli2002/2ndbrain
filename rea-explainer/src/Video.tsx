import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Background, ChapterTag, SceneFade, Subtitle } from "./components";
import { C, FPS, GRAD, SCENE_PAD } from "./theme";
import VO from "./voiceover.json";
import { S1Intro } from "./scenes/S1Intro";
import { S2Layers } from "./scenes/S2Layers";
import { S3Setup } from "./scenes/S3Setup";
import { S4Loop } from "./scenes/S4Loop";
import { S5Targets } from "./scenes/S5Targets";
import { S6Evidence } from "./scenes/S6Evidence";
import { S7Impact } from "./scenes/S7Impact";
import { S8Compliance } from "./scenes/S8Compliance";
import { S9Outro } from "./scenes/S9Outro";

const SCENES: Record<string, { C: React.FC; label: string }> = {
  intro: { C: S1Intro, label: "一个好奇" },
  layers: { C: S2Layers, label: "什么是逆向工程" },
  setup: { C: S3Setup, label: "REA 是什么" },
  loop: { C: S4Loop, label: "工作原理" },
  targets: { C: S5Targets, label: "分析范围" },
  evidence: { C: S6Evidence, label: "证据驱动" },
  impact: { C: S7Impact, label: "为什么重要" },
  compliance: { C: S8Compliance, label: "合规边界" },
  outro: { C: S9Outro, label: "开始使用" },
};

export const sceneFrames = VO.map((v) => Math.ceil((v.duration + SCENE_PAD) * FPS));
export const TOTAL_FRAMES = sceneFrames.reduce((a, b) => a + b, 0);

const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 6, background: "rgba(15,23,42,0.06)" }}>
      <div style={{ width: `${(frame / durationInFrames) * 100}%`, height: "100%", background: GRAD }} />
    </div>
  );
};

export const ReaExplainer: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  let from = 0;
  const bgmVolume = interpolate(frame, [0, 30, durationInFrames - 60, durationInFrames], [0, 0.07, 0.07, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Background />
      <Audio src={staticFile("bgm.mp3")} volume={bgmVolume} />
      {VO.map((v, i) => {
        const { C: Scene, label } = SCENES[v.id];
        const dur = sceneFrames[i];
        const seq = (
          <Sequence key={v.id} from={from} durationInFrames={dur} name={`${i + 1}. ${label}`}>
            <Audio src={staticFile(`vo/${v.id}.mp3`)} />
            <SceneFade duration={dur / FPS}>
              <Scene />
            </SceneFade>
            {i < VO.length - 1 && <ChapterTag index={String(i + 1).padStart(2, "0")} label={label} />}
            <Subtitle cues={v.cues} duration={v.duration} />
          </Sequence>
        );
        from += dur;
        return seq;
      })}
      <ProgressBar />
    </AbsoluteFill>
  );
};
