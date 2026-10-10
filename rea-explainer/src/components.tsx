import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, FONT, GRAD, MONO, shadow } from "./theme";

export const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

export const useSpringAt = (delaySec: number, damping = 14, mass = 0.8) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - delaySec * fps,
    fps,
    config: { damping, mass, stiffness: 120 },
  });
};

export const ease = Easing.bezier(0.65, 0, 0.35, 1);

export const lerp = (t: number, inR: number[], outR: number[], e = ease) =>
  interpolate(t, inR, outR, {
    easing: e,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** Scale factor for a button pressed by the cursor at `at` seconds. */
export const pressScale = (t: number, at: number) =>
  t < at || t > at + 0.35
    ? 1
    : interpolate(t, [at, at + 0.1, at + 0.35], [1, 0.9, 1]);

export const Background: React.FC = () => {
  const t = useT();
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          backgroundImage:
            "radial-gradient(rgba(79,70,229,0.16) 1.4px, transparent 1.4px)",
          backgroundSize: "36px 36px",
          backgroundPosition: `${(t * 6) % 36}px ${(t * 4) % 36}px`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          left: -250 + Math.sin(t * 0.3) * 60,
          top: -380 + Math.cos(t * 0.25) * 40,
          background:
            "radial-gradient(circle, rgba(124,58,237,0.16), rgba(124,58,237,0) 65%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1000,
          height: 1000,
          borderRadius: "50%",
          right: -300 + Math.cos(t * 0.27) * 60,
          bottom: -500 + Math.sin(t * 0.33) * 50,
          background:
            "radial-gradient(circle, rgba(8,145,178,0.15), rgba(8,145,178,0) 65%)",
        }}
      />
    </AbsoluteFill>
  );
};

export type CursorPoint = { t: number; x: number; y: number; click?: boolean };

export const Cursor: React.FC<{ points: CursorPoint[]; hideAt?: number }> = ({
  points,
  hideAt,
}) => {
  const t = useT();
  const ts = points.map((p) => p.t);
  const x =
    points.length > 1 ? lerp(t, ts, points.map((p) => p.x)) : points[0].x;
  const y =
    points.length > 1 ? lerp(t, ts, points.map((p) => p.y)) : points[0].y;
  const fadeIn = lerp(t, [ts[0] - 0.4, ts[0]], [0, 1]);
  const fadeOut = hideAt === undefined ? 1 : lerp(t, [hideAt, hideAt + 0.3], [1, 0]);

  let scale = 1;
  const ripples: React.ReactNode[] = [];
  points.forEach((p, i) => {
    if (!p.click) return;
    const dt = t - p.t;
    if (dt >= 0 && dt < 0.2) scale = interpolate(dt, [0, 0.08, 0.2], [1, 0.78, 1]);
    if (dt >= 0 && dt < 0.7) {
      const r = interpolate(dt, [0, 0.7], [8, 70], { easing: Easing.out(Easing.cubic) });
      ripples.push(
        <div
          key={i}
          style={{
            position: "absolute",
            left: p.x - r,
            top: p.y - r,
            width: r * 2,
            height: r * 2,
            borderRadius: "50%",
            border: `3px solid ${C.primary}`,
            background: "rgba(79,70,229,0.12)",
            opacity: interpolate(dt, [0, 0.7], [0.9, 0]),
          }}
        />,
      );
    }
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: fadeIn * fadeOut, zIndex: 50 }}>
      {ripples}
      <svg
        width={44}
        height={52}
        viewBox="0 0 22 26"
        style={{
          position: "absolute",
          left: x - 4,
          top: y - 3,
          transform: `scale(${scale})`,
          transformOrigin: "4px 3px",
          filter: "drop-shadow(0 6px 10px rgba(15,23,42,0.35))",
        }}
      >
        <path
          d="M2 1.5 L2 20 L7 15.5 L10.4 23.4 L13.6 22 L10.3 14.3 L17 14.3 Z"
          fill={C.ink}
          stroke="#fff"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      </svg>
    </AbsoluteFill>
  );
};

export type Cue = { text: string; start: number };

export const Subtitle: React.FC<{ cues: Cue[]; duration: number }> = ({
  cues,
  duration,
}) => {
  const t = useT();
  const cue = [...cues].reverse().find((c) => t >= c.start) ?? cues[0];
  const current = cue.text;
  const start = cue.start;
  if (t > duration + 0.3) return null;
  const k = lerp(t, [start, start + 0.18], [0, 1]);
  return (
    <div
      style={{
        position: "absolute",
        bottom: 54,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        zIndex: 40,
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontSize: 38,
          fontWeight: 500,
          color: C.ink,
          padding: "12px 34px",
          borderRadius: 18,
          background: "rgba(255,255,255,0.86)",
          border: `1px solid ${C.line}`,
          boxShadow: shadow(0.6),
          opacity: k,
          transform: `translateY(${(1 - k) * 10}px)`,
          letterSpacing: 1,
        }}
      >
        {current}
      </div>
    </div>
  );
};

export const ChapterTag: React.FC<{ index: string; label: string }> = ({
  index,
  label,
}) => {
  const k = useSpringAt(0.1, 18);
  return (
    <div
      style={{
        position: "absolute",
        top: 48,
        left: 64,
        display: "flex",
        alignItems: "center",
        gap: 16,
        fontFamily: FONT,
        opacity: k,
        transform: `translateX(${(1 - k) * -30}px)`,
        zIndex: 30,
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 22,
          color: "#fff",
          background: GRAD,
          padding: "6px 14px",
          borderRadius: 10,
        }}
      >
        {index}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: C.ink }}>{label}</div>
    </div>
  );
};

export const Title: React.FC<{
  children: React.ReactNode;
  at?: number;
  top?: number;
  size?: number;
}> = ({ children, at = 0.2, top = 120, size = 64 }) => {
  const k = useSpringAt(at, 16);
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: size,
        color: C.ink,
        opacity: k,
        transform: `translateY(${(1 - k) * 30}px)`,
        letterSpacing: 2,
      }}
    >
      {children}
    </div>
  );
};

export const GradText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      background: GRAD,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
    }}
  >
    {children}
  </span>
);

export const Card: React.FC<{
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ style, children }) => (
  <div
    style={{
      position: "absolute",
      background: C.card,
      borderRadius: 24,
      border: `1px solid ${C.line}`,
      boxShadow: shadow(1),
      fontFamily: FONT,
      color: C.ink,
      ...style,
    }}
  >
    {children}
  </div>
);

export const WindowBar: React.FC<{ title: string; dark?: boolean }> = ({
  title,
  dark,
}) => (
  <div
    style={{
      height: 52,
      display: "flex",
      alignItems: "center",
      padding: "0 20px",
      gap: 10,
      borderBottom: `1px solid ${dark ? "#1E293B" : C.line}`,
    }}
  >
    {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
      <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />
    ))}
    <div
      style={{
        marginLeft: 14,
        fontSize: 20,
        fontWeight: 500,
        color: dark ? "#94A3B8" : C.sub,
        fontFamily: FONT,
      }}
    >
      {title}
    </div>
  </div>
);

export const Chip: React.FC<{
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
}> = ({ children, color = C.primary, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 18px",
      borderRadius: 999,
      background: `${color}14`,
      border: `1.5px solid ${color}40`,
      color,
      fontFamily: FONT,
      fontWeight: 700,
      fontSize: 24,
      ...style,
    }}
  >
    {children}
  </div>
);

export const SceneFade: React.FC<{ duration: number; children: React.ReactNode }> = ({
  duration,
  children,
}) => {
  const t = useT();
  const o = lerp(t, [0, 0.35, duration - 0.35, duration], [0, 1, 1, 0]);
  const s = lerp(t, [0, 0.5], [1.02, 1]);
  return (
    <AbsoluteFill style={{ opacity: o, transform: `scale(${s})` }}>{children}</AbsoluteFill>
  );
};
