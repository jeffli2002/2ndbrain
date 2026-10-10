import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT } from "../theme";
import { Card, Cursor, lerp, pressScale, Title, useSpringAt, useT } from "../components";

const ITEMS = [
  { text: "只分析你有权分析的软件", at: 5.4 },
  { text: "遵守许可协议（EULA）与当地法律", at: 7.8 },
  { text: "发现漏洞，走负责任披露流程", at: 10.4 },
];
const ROW_Y = (i: number) => 600 + i * 82;
const BOX_X = 330;

export const S8Compliance: React.FC = () => {
  const t = useT();
  const a = useSpringAt(1.3, 14);
  const b = useSpringAt(1.6, 14);
  const wall = lerp(t, [2.4, 3.4], [0, 1]);
  const list = useSpringAt(4.4, 14);
  const shield = lerp(t, [11.2, 12.4], [0, 1]);

  const Panel: React.FC<{ x: number; k: number; title: string; color: string; lines: string[]; tag: string }> = ({
    x,
    k,
    title,
    color,
    lines,
    tag,
  }) => (
    <Card
      style={{
        left: x,
        top: 230,
        width: 640,
        height: 300,
        padding: 32,
        opacity: k,
        transform: `translateY(${(1 - k) * 40}px) translateX(${(x < 900 ? -1 : 1) * wall * 30}px)`,
        borderTop: `6px solid ${color}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 40, fontWeight: 900 }}>{title}</div>
        <div style={{ padding: "6px 16px", borderRadius: 999, background: `${color}18`, color, fontWeight: 700, fontSize: 22 }}>{tag}</div>
      </div>
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        {lines.map((l) => (
          <div key={l} style={{ fontSize: 26, color: C.ink, display: "flex", gap: 12 }}>
            <span style={{ color }}>●</span>
            {l}
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <AbsoluteFill>
      <Title top={100} size={56}>
        能力越强，越要<span style={{ color: C.green }}>讲合规</span>
      </Title>
      <Panel x={300} k={a} title="技术演示" color={C.cyan} tag="讲原理" lines={["教学 / 安全研究", "分析自有或已授权软件", "复现公开案例"]} />
      <Panel x={980} k={b} title="商业使用" color={C.amber} tag="单独评估" lines={["需获得明确授权", "审查许可证与知识产权", "法务与合规评审"]} />
      <div
        style={{
          position: "absolute",
          left: 952,
          top: 210,
          width: 16,
          height: 340 * wall,
          borderRadius: 8,
          background: `repeating-linear-gradient(45deg, ${C.ink}, ${C.ink} 10px, ${C.amber} 10px, ${C.amber} 20px)`,
        }}
      />

      <Card style={{ left: 300, top: 560, width: 1320, height: 280, opacity: list, transform: `translateY(${(1 - list) * 40}px)` }} />
      {ITEMS.map((it, i) => {
        const on = t > it.at;
        return (
          <div
            key={it.text}
            style={{
              position: "absolute",
              left: BOX_X,
              top: ROW_Y(i),
              height: 64,
              display: "flex",
              alignItems: "center",
              gap: 22,
              fontFamily: FONT,
              fontSize: 34,
              fontWeight: 700,
              color: on ? C.ink : C.sub,
              opacity: list,
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                border: `3px solid ${on ? C.green : "#CBD5E1"}`,
                background: on ? C.green : "#fff",
                color: "#fff",
                fontSize: 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${pressScale(t, it.at)})`,
              }}
            >
              {on ? "✓" : ""}
            </div>
            <span style={{ textDecoration: "none" }}>{it.text}</span>
          </div>
        );
      })}

      <div style={{ position: "absolute", left: 1340, top: 590, opacity: shield, transform: `scale(${0.6 + shield * 0.4})` }}>
        <svg width={220} height={220} viewBox="0 0 100 100">
          <path
            d="M50 6 L88 20 V48 C88 72 70 88 50 95 C30 88 12 72 12 48 V20 Z"
            fill={`rgba(22,163,74,${0.15 * shield})`}
            stroke={C.green}
            strokeWidth={5}
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - shield}
          />
          <path d="M32 50 L45 63 L70 37" stroke={C.green} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={shield} />
        </svg>
      </div>

      <Cursor
        points={[
          { t: 4.6, x: 900, y: 900 },
          ...ITEMS.map((it, i) => ({ t: it.at, x: BOX_X + 23, y: ROW_Y(i) + 32, click: true })),
          { t: 11.4, x: 700, y: 880 },
        ]}
        hideAt={12}
      />
    </AbsoluteFill>
  );
};
