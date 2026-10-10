import { loadFont as loadSans } from "@remotion/google-fonts/NotoSansSC";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const sans = loadSans("normal", {
  weights: ["500", "700", "900"],
  ignoreTooManyRequestsWarning: true,
});
const mono = loadMono("normal", { weights: ["400", "700"], subsets: ["latin"] });

export const FONT = `${sans.fontFamily}, "WenQuanYi Micro Hei", sans-serif`;
export const MONO = `${mono.fontFamily}, monospace`;

export const C = {
  bg: "#F4F7FC",
  card: "#FFFFFF",
  ink: "#0F172A",
  sub: "#64748B",
  line: "#E2E8F0",
  primary: "#4F46E5",
  violet: "#7C3AED",
  cyan: "#0891B2",
  teal: "#14B8A6",
  green: "#16A34A",
  amber: "#F59E0B",
  rose: "#E11D48",
};

export const GRAD = `linear-gradient(135deg, ${C.primary}, ${C.violet} 55%, ${C.cyan})`;

export const shadow = (k = 1) =>
  `0 ${8 * k}px ${30 * k}px rgba(15, 23, 42, ${0.08 * k}), 0 1px 3px rgba(15,23,42,0.06)`;

export const FPS = 30;
export const SCENE_PAD = 0.9;
