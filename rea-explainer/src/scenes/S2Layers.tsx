import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, MONO } from "../theme";
import { Accent, Card, Cursor, lerp, Title, useSpringAt, useT } from "../components";

const LX = 330;
const LW = 1120;
const LH = 112;
const LY = [250, 384, 518, 652];
const REVEAL = [2.3, 5.6, 6.6, 7.9];

const Layer: React.FC<{
  i: number;
  name: string;
  tag: string;
  color: string;
  active: number;
  children: React.ReactNode;
}> = ({ i, name, tag, color, active, children }) => {
  const k = useSpringAt(REVEAL[i], 14);
  return (
    <Card
      style={{
        left: LX,
        top: LY[i],
        width: LW,
        height: LH,
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        opacity: k,
        transform: `translateX(${(1 - k) * -80}px) scale(${1 + active * 0.02})`,
        border: `2px solid ${active > 0.1 ? color : C.line}`,
        boxShadow: active > 0.1 ? `0 0 0 ${6 * active}px ${color}22, 0 10px 28px rgba(20,20,19,0.08)` : undefined,
      }}
    >
      <div
        style={{
          width: 230,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: 30,
          background: `${color}10`,
          borderRight: `1px solid ${C.line}`,
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 18, color, fontWeight: 700 }}>{tag}</div>
        <div style={{ fontSize: 32, fontWeight: 700 }}>{name}</div>
      </div>
      <div style={{ flex: 1, padding: "0 34px", display: "flex", alignItems: "center", gap: 18 }}>
        {children}
      </div>
    </Card>
  );
};

const Box: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.primary }) => (
  <div
    style={{
      padding: "8px 18px",
      borderRadius: 12,
      border: `1.5px solid ${color}55`,
      background: `${color}0D`,
      fontFamily: MONO,
      fontSize: 22,
      color,
      fontWeight: 700,
    }}
  >
    {children}
  </div>
);

const Arrow = () => <div style={{ fontSize: 26, color: C.sub }}>→</div>;

export const S2Layers: React.FC = () => {
  const t = useT();
  const dragY = lerp(t, [4.4, 5.8, 6.8, 8.2], [LY[0] + LH / 2, LY[1] + LH / 2, LY[2] + LH / 2, LY[3] + LH / 2]);
  const handleK = useSpringAt(3.8, 14);
  const centers = LY.map((y) => y + LH / 2);
  const activeOf = (i: number) => {
    const d = Math.abs(dragY - centers[i]);
    return t < 3.9 ? 0 : Math.max(0, 1 - d / 70);
  };
  const badge = useSpringAt(10.4, 13);
  const bits = Array.from({ length: 34 }, (_, j) =>
    ((Math.floor(t * 8) * 7 + j * 13) % 5 > 1 ? "1" : "0"),
  ).join("");

  return (
    <AbsoluteFill>
      <Title top={110} size={60}>
        逆向工程：从<Accent>「行为」</Accent>挖到<Accent>「二进制」</Accent>
      </Title>

      <Layer i={0} name="界面行为" tag="L1 · BEHAVIOR" color={C.primary} active={activeOf(0)}>
        <Box>点击「搜索」</Box>
        <Arrow />
        <Box>0.03s 出结果</Box>
        <Arrow />
        <Box>结果自动排序</Box>
      </Layer>
      <Layer i={1} name="代码模块" tag="L2 · MODULES" color={C.violet} active={activeOf(1)}>
        <Box color={C.violet}>renderer.js</Box>
        <Arrow />
        <Box color={C.violet}>preload IPC</Box>
        <Arrow />
        <Box color={C.violet}>search.node</Box>
      </Layer>
      <Layer i={2} name="汇编指令" tag="L3 · ASSEMBLY" color={C.cyan} active={activeOf(2)}>
        <div style={{ fontFamily: MONO, fontSize: 24, color: C.ink, lineHeight: 1.5 }}>
          <span style={{ color: C.cyan }}>mov</span> rax, [rbp-0x18]{"   "}
          <span style={{ color: C.cyan }}>call</span> sub_4012A0{"   "}
          <span style={{ color: C.cyan }}>cmp</span> eax, 0x3F
        </div>
      </Layer>
      <Layer i={3} name="二进制" tag="L4 · BINARY" color={C.teal} active={activeOf(3)}>
        <div style={{ fontFamily: MONO, fontSize: 28, color: C.teal, letterSpacing: 4, whiteSpace: "nowrap" }}>
          {bits}
        </div>
      </Layer>

      {/* drill rail + handle */}
      <div
        style={{
          position: "absolute",
          left: LX + LW + 70,
          top: LY[0] + 10,
          width: 8,
          height: LY[3] + LH - LY[0] - 20,
          borderRadius: 4,
          background: C.line,
          opacity: handleK,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 8,
            height: Math.max(0, dragY - LY[0] - 10),
            borderRadius: 4,
            background: C.primary,
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: LX + LW + 74 - 46,
          top: dragY - 46,
          width: 92,
          height: 92,
          borderRadius: 46,
          background: C.primary,
          boxShadow: "0 8px 20px rgba(20,20,19,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 22,
          opacity: handleK,
          transform: `scale(${handleK}) rotate(${t > 4.4 && t < 8.8 ? t * 240 : 0}deg)`,
        }}
      >
        <svg width="44" height="44" viewBox="0 0 24 24">
          <path d="M12 3 L12 21 M5 14 L12 21 L19 14" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          left: LX + LW + 140,
          top: dragY - 18,
          fontFamily: FONT,
          fontSize: 26,
          fontWeight: 700,
          color: C.primary,
          opacity: handleK,
        }}
      >
        向下挖
      </div>

      {/* scanning beam across the active layer */}
      {t > 4.4 && t < 9.4 && (
        <div
          style={{
            position: "absolute",
            left: LX - 20,
            top: dragY - 2,
            width: LW + 90,
            height: 4,
            background: C.primary,
            opacity: 0.9,
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          top: 806,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: badge,
          transform: `scale(${0.8 + badge * 0.2})`,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: 30,
            fontWeight: 700,
            color: C.ink,
            padding: "14px 30px",
            borderRadius: 16,
            background: "#FAEEDD",
            border: `2px solid ${C.amber}66`,
          }}
        >
          过去：靠少数专家 · 手工分析 · 动辄数天到数周
        </div>
      </div>

      <Cursor
        points={[
          { t: 3.6, x: 1600, y: 520 },
          { t: 4.4, x: LX + LW + 74, y: LY[0] + LH / 2, click: true },
          { t: 5.8, x: LX + LW + 74, y: LY[1] + LH / 2 },
          { t: 6.8, x: LX + LW + 74, y: LY[2] + LH / 2 },
          { t: 8.2, x: LX + LW + 74, y: LY[3] + LH / 2 },
          { t: 9.6, x: 1700, y: 820 },
        ]}
        hideAt={10}
      />
    </AbsoluteFill>
  );
};
