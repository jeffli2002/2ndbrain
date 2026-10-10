import { loadFont as loadSans } from "@remotion/google-fonts/NotoSansSC";
import { loadFont as loadSerif } from "@remotion/google-fonts/NotoSerifSC";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const sans = loadSans("normal", {
  weights: ["500", "700"],
  ignoreTooManyRequestsWarning: true,
});
const serif = loadSerif("normal", {
  weights: ["600", "700"],
  ignoreTooManyRequestsWarning: true,
});
const mono = loadMono("normal", { weights: ["400", "700"], subsets: ["latin"] });

export const FONT = `${sans.fontFamily}, "WenQuanYi Micro Hei", sans-serif`;
export const SERIF = `${serif.fontFamily}, serif`;
export const MONO = `${mono.fontFamily}, monospace`;

/** Warm, flat palette in the spirit of Claude's visual language: ivory paper, slate ink, clay accent. */
export const C = {
  bg: "#F3F0E8",
  card: "#FDFCF9",
  ink: "#141413",
  sub: "#6F6D66",
  line: "#E3DFD3",
  primary: "#D97757",
  violet: "#A86A84",
  cyan: "#5E87B5",
  teal: "#788C5D",
  green: "#5F8A55",
  amber: "#C08A3E",
  rose: "#BF4D43",
  dark: "#1F1E1C",
};

export const shadow = (k = 1) =>
  `0 ${6 * k}px ${22 * k}px rgba(20, 20, 19, ${0.06 * k}), 0 1px 2px rgba(20,20,19,0.05)`;

export const FPS = 30;
export const SCENE_PAD = 0.9;
