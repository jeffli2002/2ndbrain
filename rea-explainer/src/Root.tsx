import React from "react";
import { Composition } from "remotion";
import { FPS } from "./theme";
import { ReaExplainer, TOTAL_FRAMES } from "./Video";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="ReaExplainer"
    component={ReaExplainer}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
