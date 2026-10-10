import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, GRAD, MONO } from "../theme";
import { Card, Chip, Cursor, lerp, pressScale, Title, useSpringAt, useT } from "../components";

const STEPS = [
  { at: 2.6, label: "提问" },
  { at: 4.2, label: "MCP 调用" },
  { at: 6.7, label: "本地分析" },
  { at: 13.5, label: "返回证据" },
  { at: 18.2, label: "解释 · 实现" },
];

type P = [number, number];

const Packet: React.FC<{ path: P[]; from: number; to: number; color?: string; label?: string }> = ({
  path,
  from,
  to,
  color = C.primary,
  label,
}) => {
  const t = useT();
  if (t < from || t > to + 0.2) return null;
  const n = path.length - 1;
  const ts = path.map((_, i) => from + ((to - from) * i) / n);
  const x = lerp(t, ts, path.map((p) => p[0]), (v) => v);
  const y = lerp(t, ts, path.map((p) => p[1]), (v) => v);
  const o = lerp(t, [to, to + 0.2], [1, 0]);
  return (
    <div style={{ position: "absolute", left: x - 16, top: y - 16, opacity: o, zIndex: 20 }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          background: color,
          boxShadow: `0 0 0 8px ${color}33, 0 0 30px ${color}`,
        }}
      />
      {label && (
        <div
          style={{
            position: "absolute",
            top: -46,
            left: -40,
            whiteSpace: "nowrap",
            fontFamily: MONO,
            fontSize: 20,
            fontWeight: 700,
            color,
            background: "#fff",
            padding: "3px 10px",
            borderRadius: 8,
            border: `1.5px solid ${color}55`,
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
};

const Line: React.FC<{ d: string; at: number; color?: string; dash?: boolean }> = ({ d, at, color = "#CBD5E1", dash }) => {
  const t = useT();
  const k = lerp(t, [at, at + 0.6], [0, 1]);
  return (
    <path
      d={d}
      stroke={color}
      strokeWidth={4}
      fill="none"
      strokeLinecap="round"
      pathLength={1}
      strokeDasharray={dash ? "0.02 0.02" : "1 1"}
      strokeDashoffset={dash ? -t * 0.05 : 1 - k}
      opacity={dash ? k : 1}
    />
  );
};

const AGX = 140;
const AGY = 330;
const REAX = 760;
const REAY = 400;
const ENX = 1340;

export const S4Loop: React.FC = () => {
  const t = useT();
  const agK = useSpringAt(0.5, 14);
  const reaK = useSpringAt(0.8, 14);
  const enK = useSpringAt(1.1, 14);
  const tgK = useSpringAt(1.4, 14);
  const boundary = lerp(t, [6.6, 7.4], [0, 1]);
  const question = "Notes 的搜索是怎么实现的？";
  const typed = question.slice(0, Math.floor(lerp(t, [2.6, 3.4], [0, question.length], (v) => v)));
  const step = STEPS.filter((s) => t >= s.at).length - 1;
  const engines = [
    { name: "Hopper", at: 8.6 },
    { name: "Ghidra", at: 9.4 },
    { name: "IDA", at: 10.2 },
  ];
  const evid = [
    { name: "伪代码", at: 14.0, color: C.primary },
    { name: "调用引用", at: 14.6, color: C.violet },
    { name: "未知项", at: 15.2, color: C.amber },
  ];
  const outs = [
    { name: "解释原理", at: 18.4 },
    { name: "继续追问 ↻", at: 19.7 },
    { name: "实现 + 测试 ✓", at: 21.2 },
  ];
  const scan = t > 11.8 && t < 13.4 ? lerp(t, [11.8, 13.4], [0, 1], (v) => v) : -1;
  const reaPulse = t > 5.6 && t < 6.2 ? 1 + Math.sin((t - 5.6) * 10) * 0.04 : 1;

  return (
    <AbsoluteFill>
      <Title top={92} size={54}>
        原理：一个「调查闭环」
      </Title>

      {/* step indicator */}
      <div
        style={{
          position: "absolute",
          top: 182,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 14,
          fontFamily: FONT,
        }}
      >
        {STEPS.map((s, i) => (
          <div
            key={s.label}
            style={{
              padding: "8px 20px",
              borderRadius: 999,
              fontSize: 22,
              fontWeight: 700,
              color: i === step ? "#fff" : i < step ? C.primary : C.sub,
              background: i === step ? GRAD : i < step ? "#EEF2FF" : "#fff",
              border: `1.5px solid ${i <= step ? "#C7D2FE" : C.line}`,
              transform: `scale(${i === step ? 1.08 : 1})`,
            }}
          >
            {i + 1}. {s.label}
          </div>
        ))}
      </div>

      {/* local boundary */}
      <div
        style={{
          position: "absolute",
          left: 700,
          top: 290,
          width: 1100,
          height: 560,
          borderRadius: 32,
          border: `3px dashed ${C.teal}`,
          background: `rgba(20,184,166,${0.04 * boundary})`,
          opacity: boundary,
          transform: `scale(${0.96 + boundary * 0.04})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -22,
            left: 40,
            background: C.bg,
            padding: "0 14px",
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 26,
            color: C.teal,
          }}
        >
          你的电脑 · 本地运行
        </div>
      </div>

      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <Line d={`M ${AGX + 440} 470 L ${REAX} 470`} at={1.5} />
        <Line d={`M ${REAX} 590 L ${AGX + 440} 590`} at={1.6} />
        <Line d={`M ${REAX + 340} 470 C 1220 470 1220 380 ${ENX} 380`} at={1.7} />
        <Line d={`M ${ENX + 200} 580 L ${ENX + 200} 650`} at={1.8} />
        <Line d={`M ${ENX} 720 C 1220 720 1220 590 ${REAX + 340} 590`} at={1.9} />
      </svg>

      {/* agent */}
      <Card
        style={{
          left: AGX,
          top: AGY,
          width: 440,
          height: 430,
          padding: 26,
          opacity: agK,
          transform: `scale(${agK})`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: GRAD,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 34,
            }}
          >
            ✦
          </div>
          <div>
            <div style={{ fontSize: 30, fontWeight: 900 }}>AI 智能体</div>
            <div style={{ fontSize: 20, color: C.sub }}>Claude Code / Codex / Cursor</div>
          </div>
        </div>
        <div
          style={{
            marginTop: 22,
            padding: "14px 18px",
            borderRadius: 14,
            background: "#F1F5F9",
            fontSize: 24,
            minHeight: 70,
            lineHeight: 1.4,
          }}
        >
          {typed}
          {t > 2.5 && t < 3.5 && <span style={{ color: C.primary }}>|</span>}
        </div>
        <div
          style={{
            marginTop: 14,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              padding: "8px 26px",
              borderRadius: 12,
              background: t > 3.7 ? C.green : GRAD,
              color: "#fff",
              fontWeight: 700,
              fontSize: 22,
              transform: `scale(${pressScale(t, 3.7)})`,
            }}
          >
            {t > 3.7 ? "已发送" : "发送 ↵"}
          </div>
        </div>
        <div style={{ position: "absolute", left: 26, right: 26, bottom: 22, display: "flex", flexWrap: "wrap", gap: 10 }}>
          {outs.map((o) => {
            const k = lerp(t, [o.at, o.at + 0.4], [0, 1]);
            return (
              <Chip key={o.name} color={C.green} style={{ fontSize: 21, padding: "6px 14px", opacity: k, transform: `scale(${0.6 + 0.4 * k})` }}>
                {o.name}
              </Chip>
            );
          })}
        </div>
      </Card>

      {/* REA MCP */}
      <Card
        style={{
          left: REAX,
          top: REAY,
          width: 340,
          height: 260,
          background: GRAD,
          border: "none",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: reaK,
          transform: `scale(${reaK * reaPulse})`,
          boxShadow: "0 20px 50px rgba(79,70,229,0.35)",
        }}
      >
        <div style={{ fontSize: 76, fontWeight: 900, letterSpacing: 4 }}>REA</div>
        <div style={{ fontFamily: MONO, fontSize: 22, opacity: 0.9 }}>MCP Server</div>
        <div style={{ fontSize: 20, marginTop: 8, opacity: 0.9 }}>调度 · 追踪 · 汇总证据</div>
      </Card>

      {/* engines */}
      <Card style={{ left: ENX, top: 300, width: 400, height: 280, padding: 22, opacity: enK, transform: `scale(${enK})` }}>
        <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>专业分析引擎</div>
        {engines.map((e) => {
          const on = t > e.at;
          return (
            <div
              key={e.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                height: 52,
                padding: "0 16px",
                marginBottom: 8,
                borderRadius: 12,
                fontFamily: MONO,
                fontSize: 24,
                fontWeight: 700,
                background: on ? "#ECFEFF" : "#F8FAFC",
                border: `1.5px solid ${on ? C.cyan : C.line}`,
                color: on ? C.cyan : C.sub,
              }}
            >
              <div style={{ width: 12, height: 12, borderRadius: 6, background: on ? C.cyan : "#CBD5E1", boxShadow: on ? `0 0 12px ${C.cyan}` : "none" }} />
              {e.name}
              <div style={{ flex: 1 }} />
              {on && <span style={{ fontSize: 18 }}>运行中</span>}
            </div>
          );
        })}
      </Card>

      {/* target */}
      <Card style={{ left: ENX, top: 650, width: 400, height: 160, padding: 22, overflow: "hidden", opacity: tgK, transform: `scale(${tgK})` }}>
        <div style={{ fontSize: 24, fontWeight: 900 }}>目标程序 · Notes.app</div>
        <div style={{ fontFamily: MONO, fontSize: 20, color: C.sub, marginTop: 10, lineHeight: 1.5 }}>
          sub_4012A0 → search_index
          <br />
          xref ×12 · strings ×48
        </div>
        {scan >= 0 && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 120,
              transform: `translateX(${-120 + scan * 520}px)`,
              background: `linear-gradient(90deg, transparent, ${C.cyan}55, transparent)`,
            }}
          />
        )}
      </Card>

      {/* evidence tray */}
      <div
        style={{
          position: "absolute",
          left: AGX + 470,
          top: 690,
          width: 600,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        {evid.map((e) => {
          const k = useSpringAt(e.at, 11);
          return (
            <Chip key={e.name} color={e.color} style={{ background: "#fff", opacity: k, transform: `translateY(${(1 - k) * 30}px)` }}>
              {e.name}
            </Chip>
          );
        })}
      </div>

      <Packet path={[[AGX + 440, 470], [REAX, 470]]} from={3.9} to={5.6} label="MCP 调用" />
      <Packet path={[[REAX + 340, 470], [1220, 430], [ENX, 380]]} from={7.8} to={8.6} color={C.violet} />
      <Packet path={[[ENX + 200, 580], [ENX + 200, 650]]} from={11.0} to={11.8} color={C.cyan} />
      <Packet path={[[ENX, 720], [1220, 650], [REAX + 340, 590]]} from={13.5} to={14.3} color={C.teal} label="证据" />
      <Packet path={[[REAX, 590], [AGX + 440, 590]]} from={15.9} to={17.2} color={C.teal} label="证据包" />
      <Packet path={[[AGX + 440, 470], [REAX, 470]]} from={19.7} to={20.8} label="追问" />

      <Cursor
        points={[
          { t: 2.2, x: 520, y: 820 },
          { t: 3.7, x: AGX + 350, y: AGY + 249, click: true },
          { t: 4.8, x: 600, y: 860 },
        ]}
        hideAt={5.4}
      />
    </AbsoluteFill>
  );
};
