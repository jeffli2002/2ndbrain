import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, MONO } from "../theme";
import { Cursor, CursorPoint, lerp, Title, useSpringAt, useT } from "../components";

const TARGETS = [
  { glyph: "0101", name: "原生二进制", out: "伪代码 · 汇编 · 符号", color: C.primary },
  { glyph: "JS", name: "Electron / JS 应用", out: "模块 · IPC · source map", color: C.amber },
  { glyph: "</>", name: "网站", out: "页面结构 · 网络请求", color: C.cyan },
  { glyph: ".NET", name: ".NET 程序集", out: "元数据 · CIL 指令", color: C.violet },
  { glyph: "APK", name: "Android APK", out: "清单 · 类 · 反编译方法", color: C.green },
  { glyph: "FW", name: "固件", out: "区域提取 · 转交原生分析", color: C.rose },
  { glyph: "Ξ", name: "EVM 字节码", out: "函数选择器 · 参数推断", color: C.teal },
  { glyph: ">_", name: "进程行为", out: "终端输出 · 文件系统观察", color: "#4A4842" },
];

const W = 360;
const H = 230;
const GAP = 32;
const LEFT = (1920 - (4 * W + 3 * GAP)) / 2;
const TOP = 280;
const pos = (i: number) => ({ x: LEFT + (i % 4) * (W + GAP), y: TOP + Math.floor(i / 4) * (H + GAP) });
const HOVER_START = 2.6;
const HOVER_STEP = 0.95;

export const S5Targets: React.FC = () => {
  const t = useT();
  const hovered = t < HOVER_START ? -1 : Math.min(7, Math.floor((t - HOVER_START) / HOVER_STEP));

  const points: CursorPoint[] = TARGETS.map((_, i) => {
    const p = pos(i);
    return { t: HOVER_START + i * HOVER_STEP, x: p.x + W * 0.72, y: p.y + H * 0.62 };
  });

  return (
    <AbsoluteFill>
      <Title top={120} size={58}>
        能分析什么？几乎<span style={{ color: C.primary }}>「一切」</span>
      </Title>
      {TARGETS.map((tg, i) => {
        const { x, y } = pos(i);
        const k = useSpringAt(0.5 + i * 0.12, 12);
        const isH = hovered === i;
        const hk = isH ? lerp(t, [HOVER_START + i * HOVER_STEP, HOVER_START + i * HOVER_STEP + 0.25], [0, 1]) : 0;
        const seen = hovered > i;
        return (
          <div
            key={tg.name}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: W,
              height: H,
              borderRadius: 24,
              background: isH ? `${tg.color}0F` : C.card,
              border: `2px solid ${isH ? tg.color : seen ? `${tg.color}55` : C.line}`,
              boxShadow: isH
                ? `0 ${14 + hk * 8}px 36px rgba(20,20,19,0.12)`
                : "0 6px 22px rgba(20,20,19,0.06)",
              transform: `translateY(${(1 - k) * 80 - hk * 14}px) scale(${k * (1 + hk * 0.04)})`,
              opacity: k,
              padding: 26,
              fontFamily: FONT,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: 18,
                background: tg.color,
                color: "#fff",
                fontFamily: MONO,
                fontWeight: 700,
                fontSize: tg.glyph.length > 3 ? 22 : 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `rotate(${hk * -8}deg)`,
              }}
            >
              {tg.glyph}
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: C.ink, marginTop: 18 }}>{tg.name}</div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 500,
                color: tg.color,
                marginTop: 8,
                opacity: isH || seen ? 1 : 0.0,
                transform: `translateY(${isH ? (1 - hk) * 16 : 0}px)`,
              }}
            >
              ↳ {tg.out}
            </div>
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          top: 836,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 26,
          color: C.sub,
          opacity: lerp(t, [9.6, 10.2], [0, 1]),
        }}
      >
        静态分析只读文件、不运行程序 · 运行时捕获以你的用户权限进行
      </div>
      <Cursor points={[{ t: HOVER_START - 0.4, x: 960, y: 900 }, ...points]} />
    </AbsoluteFill>
  );
};
