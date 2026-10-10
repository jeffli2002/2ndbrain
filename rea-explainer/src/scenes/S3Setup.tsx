import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, GRAD, MONO } from "../theme";
import { Card, Cursor, lerp, pressScale, useSpringAt, useT, WindowBar } from "../components";

const WORDS = [
  { l: "R", rest: "everse" },
  { l: "E", rest: "ngineer" },
  { l: "A", rest: "nything" },
];

const AGENTS = ["Claude Code", "Codex", "Cursor", "Gemini CLI"];
const CLICKS = [10.3, 10.9, 11.5];
const PX = 1040;
const PY = 330;
const rowY = (i: number) => PY + 110 + i * 74;
const APPROVE = 12.3;

const CMD = "npx rea-agents setup";
const OUT = [
  { at: 9.5, text: "✓ 检测到本机智能体 ×4", color: "#4ADE80" },
  { at: 9.8, text: "✓ 生成 MCP 配置（已备份旧配置）", color: "#4ADE80" },
  { at: 10.1, text: "? 选择要接入的智能体 →", color: "#FBBF24" },
  { at: 12.6, text: "✓ 已注册 REA MCP 服务", color: "#4ADE80" },
  { at: 12.9, text: "✓ 已安装逆向工作流指引", color: "#4ADE80" },
];

export const S3Setup: React.FC = () => {
  const t = useT();
  const shrink = lerp(t, [4.9, 5.9], [0, 1]);
  const heroScale = 1 - shrink * 0.55;
  const heroY = lerp(shrink, [0, 1], [330, 92]);
  const termK = useSpringAt(6.2, 15);
  const panelK = useSpringAt(7.0, 15);
  const typed = CMD.slice(0, Math.floor(lerp(t, [7.9, 9.0], [0, CMD.length], (x) => x)));
  const subK = useSpringAt(3.3, 14);

  return (
    <AbsoluteFill>
      {/* hero */}
      <div
        style={{
          position: "absolute",
          top: heroY,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 40 * heroScale,
          transform: `scale(${heroScale})`,
          transformOrigin: "center top",
          fontFamily: FONT,
        }}
      >
        {WORDS.map((w, i) => {
          const drop = useSpringAt(0.2 + i * 0.25, 10);
          const expand = lerp(t, [1.4 + i * 0.45, 2.2 + i * 0.45], [0, 1]);
          return (
            <div
              key={w.l}
              style={{
                display: "flex",
                alignItems: "baseline",
                transform: `translateY(${(1 - drop) * -200}px)`,
                opacity: drop,
              }}
            >
              <span
                style={{
                  fontSize: 200,
                  fontWeight: 900,
                  background: GRAD,
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                  lineHeight: 1,
                }}
              >
                {w.l}
              </span>
              <span
                style={{
                  fontSize: 88,
                  fontWeight: 700,
                  color: C.ink,
                  display: "inline-block",
                  maxWidth: expand * 420,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  opacity: expand,
                }}
              >
                {w.rest}
              </span>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          top: lerp(shrink, [0, 1], [610, 236]),
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: FONT,
          fontSize: lerp(shrink, [0, 1], [52, 34]),
          fontWeight: 700,
          color: C.sub,
          opacity: subK,
        }}
      >
        把硬核逆向手艺，交给 <span style={{ color: C.primary }}>AI 智能体</span> · 一个{" "}
        <span style={{ color: C.violet, fontFamily: MONO }}>MCP</span> 服务
      </div>

      {/* terminal */}
      <Card
        style={{
          left: 140,
          top: PY,
          width: 840,
          height: 500,
          background: "#0F172A",
          border: "1px solid #1E293B",
          overflow: "hidden",
          opacity: termK,
          transform: `translateY(${(1 - termK) * 60}px)`,
        }}
      >
        <WindowBar title="终端 — zsh" dark />
        <div style={{ padding: "26px 30px", fontFamily: MONO, fontSize: 28, color: "#E2E8F0", lineHeight: 1.75 }}>
          <div>
            <span style={{ color: "#22D3EE" }}>~ $</span> {typed}
            {t < 9.2 && Math.floor(t * 3) % 2 === 0 && (
              <span style={{ background: "#E2E8F0", marginLeft: 2 }}>&nbsp;</span>
            )}
          </div>
          {OUT.filter((o) => t > o.at).map((o) => (
            <div key={o.text} style={{ color: o.color, fontSize: 24 }}>
              {o.text}
            </div>
          ))}
        </div>
      </Card>

      {/* agent selector */}
      <Card
        style={{
          left: PX,
          top: PY,
          width: 740,
          height: 500,
          overflow: "hidden",
          opacity: panelK,
          transform: `translateY(${(1 - panelK) * 60}px)`,
        }}
      >
        <WindowBar title="REA Setup · 选择智能体" />
        <div style={{ padding: "18px 40px 0", fontSize: 26, fontWeight: 700, color: C.sub }}>
          接入后，智能体就能调用逆向工具
        </div>
      </Card>
      {AGENTS.map((a, i) => {
        const on = i < CLICKS.length && t > CLICKS[i];
        const connected = t > APPROVE + 0.3 + i * 0.15 && i < CLICKS.length;
        return (
          <div
            key={a}
            style={{
              position: "absolute",
              left: PX + 40,
              top: rowY(i) - 30,
              width: 660,
              height: 60,
              display: "flex",
              alignItems: "center",
              gap: 20,
              fontFamily: FONT,
              fontSize: 28,
              fontWeight: 700,
              color: C.ink,
              opacity: panelK,
              borderRadius: 14,
              padding: "0 16px",
              background: on ? "#EEF2FF" : "transparent",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                border: `2.5px solid ${on ? C.primary : "#CBD5E1"}`,
                background: on ? C.primary : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 22,
                transform: `scale(${i < CLICKS.length ? pressScale(t, CLICKS[i]) : 1})`,
              }}
            >
              {on ? "✓" : ""}
            </div>
            {a}
            <div style={{ flex: 1 }} />
            {connected && (
              <div style={{ fontSize: 22, color: C.green, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 5, background: C.green, boxShadow: `0 0 10px ${C.green}` }} />
                已连接
              </div>
            )}
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: PX + 40,
          top: PY + 410,
          width: 660,
          height: 66,
          borderRadius: 16,
          background: t > APPROVE ? C.green : GRAD,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT,
          fontSize: 28,
          fontWeight: 900,
          opacity: panelK,
          transform: `scale(${pressScale(t, APPROVE)})`,
          boxShadow: "0 10px 24px rgba(79,70,229,0.3)",
        }}
      >
        {t > APPROVE ? "✓ 已接入 REA" : "批准并接入"}
      </div>

      <Cursor
        points={[
          { t: 9.6, x: 1500, y: 860 },
          { t: CLICKS[0], x: PX + 73, y: rowY(0), click: true },
          { t: CLICKS[1], x: PX + 73, y: rowY(1), click: true },
          { t: CLICKS[2], x: PX + 73, y: rowY(2), click: true },
          { t: APPROVE, x: PX + 370, y: PY + 443, click: true },
          { t: 13.4, x: PX + 520, y: PY + 520 },
        ]}
      />
    </AbsoluteFill>
  );
};
