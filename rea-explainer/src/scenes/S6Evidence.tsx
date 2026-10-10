import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, MONO } from "../theme";
import { Card, Cursor, lerp, pressScale, Title, useSpringAt, useT } from "../components";

const TABS = [
  { name: "伪代码", at: 3.5 },
  { name: "调用关系", at: 4.5 },
  { name: "局限说明", at: 5.6 },
];
const TAB_X = (i: number) => 900 + i * 240;
const TAB_Y = 320;

const CODE = [
  ["int", " search_index(char *q) {"],
  ["", "  tok = tokenize(q);"],
  ["for", " (i = 0; i < n; i++)"],
  ["", "    score[i] = tf_idf(tok, doc[i]);"],
  ["return", " sort_desc(score);"],
  ["", "}"],
];

const Graph: React.FC = () => {
  const nodes = [
    { x: 0, y: 40, n: "onSearch()" },
    { x: 300, y: 40, n: "ipc:search" },
    { x: 600, y: 40, n: "search_index" },
    { x: 420, y: 200, n: "tf_idf" },
    { x: 640, y: 200, n: "sort_desc" },
  ];
  return (
    <div style={{ position: "relative", height: 300 }}>
      <svg width={880} height={300} style={{ position: "absolute" }}>
        {[
          [0, 1],
          [1, 2],
          [2, 3],
          [2, 4],
        ].map(([a, b]) => (
          <line
            key={`${a}${b}`}
            x1={nodes[a].x + 100}
            y1={nodes[a].y + 28}
            x2={nodes[b].x + 100}
            y2={nodes[b].y + 28}
            stroke={C.violet}
            strokeWidth={3}
            strokeDasharray="8 6"
          />
        ))}
      </svg>
      {nodes.map((n) => (
        <div
          key={n.n}
          style={{
            position: "absolute",
            left: n.x,
            top: n.y,
            width: 200,
            height: 56,
            borderRadius: 12,
            background: "#F4EAEF",
            border: `2px solid ${C.violet}`,
            fontFamily: MONO,
            fontSize: 21,
            fontWeight: 700,
            color: C.violet,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {n.n}
        </div>
      ))}
    </div>
  );
};

const PartA: React.FC = () => {
  const t = useT();
  const left = useSpringAt(0.3, 14);
  const right = useSpringAt(0.7, 14);
  const active = TABS.filter((x) => t >= x.at).length - 1;
  const stamp = useSpringAt(7.0, 9);
  const contentK = active >= 0 ? lerp(t, [TABS[active].at, TABS[active].at + 0.3], [0, 1]) : 0;

  return (
    <AbsoluteFill>
      <Title top={110} size={56}>
        每个结论，都有<span style={{ color: C.primary }}>证据</span>
      </Title>
      <Card style={{ left: 140, top: 260, width: 660, height: 520, padding: 36, opacity: left, transform: `translateX(${(1 - left) * -60}px)` }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: C.sub }}>智能体的结论</div>
        <div style={{ fontSize: 38, fontWeight: 700, lineHeight: 1.45, marginTop: 16 }}>
          Notes 的搜索使用
          <span style={{ color: C.primary }}>本地倒排索引</span>，按
          <span style={{ color: C.primary }}> TF-IDF </span>
          打分后排序。
        </div>
        <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 12 }}>
          {TABS.map((tab, i) => (
            <div
              key={tab.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 24,
                fontWeight: 700,
                color: i <= active ? C.green : "#D3CEC1",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  background: i <= active ? C.green : "#E3DFD3",
                  color: "#fff",
                  fontSize: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✓
              </div>
              依据：{tab.name}
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            right: 30,
            bottom: 34,
            transform: `rotate(-12deg) scale(${2 - stamp})`,
            opacity: stamp,
            border: `5px solid ${C.rose}`,
            color: C.rose,
            borderRadius: 14,
            padding: "8px 20px",
            fontSize: 34,
            fontWeight: 700,
          }}
        >
          有据可查 · 不靠猜
        </div>
      </Card>

      <Card style={{ left: 860, top: 260, width: 920, height: 520, overflow: "hidden", opacity: right, transform: `translateX(${(1 - right) * 60}px)` }}>
        <div style={{ height: 120, borderBottom: `1px solid ${C.line}` }} />
        <div style={{ padding: "26px 40px", opacity: contentK, transform: `translateY(${(1 - contentK) * 16}px)` }}>
          {active === 0 && (
            <div style={{ fontFamily: MONO, fontSize: 27, lineHeight: 1.7, color: C.ink }}>
              {CODE.map(([kw, rest], i) => (
                <div key={i}>
                  <span style={{ color: C.sub, marginRight: 24 }}>{String(i + 1).padStart(2, "0")}</span>
                  <span style={{ color: C.primary, fontWeight: 700 }}>{kw}</span>
                  {rest}
                </div>
              ))}
            </div>
          )}
          {active === 1 && <Graph />}
          {active === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18, fontSize: 28, fontFamily: FONT, fontWeight: 500 }}>
              {[
                ["⚠", "sub_40A1 经过混淆，仅部分还原", C.amber],
                ["⚠", "排序权重常量为推断值，置信度：中", C.amber],
                ["?", "云同步逻辑不在本次分析范围", C.sub],
              ].map(([i, txt, col], j) => (
                <div
                  key={j}
                  style={{
                    padding: "16px 22px",
                    borderRadius: 14,
                    background: "#FAF1E2",
                    border: `1.5px solid ${col}55`,
                    display: "flex",
                    gap: 16,
                    opacity: lerp(t, [TABS[2].at + j * 0.25, TABS[2].at + j * 0.25 + 0.3], [0, 1]),
                  }}
                >
                  <span style={{ color: col, fontWeight: 700 }}>{i}</span>
                  {txt}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
      {TABS.map((tab, i) => {
        const on = i === active;
        return (
          <div
            key={tab.name}
            style={{
              position: "absolute",
              left: TAB_X(i),
              top: TAB_Y,
              width: 220,
              height: 60,
              borderRadius: 14,
              background: on ? C.primary : "#EFEBE1",
              color: on ? "#fff" : C.sub,
              fontFamily: FONT,
              fontSize: 26,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: right,
              transform: `scale(${pressScale(t, tab.at)})`,
              boxShadow: on ? "0 10px 24px rgba(20,20,19,0.12)" : "none",
            }}
          >
            {tab.name}
          </div>
        );
      })}
      <Cursor
        points={[
          { t: 2.6, x: 1300, y: 700 },
          ...TABS.map((tab, i) => ({ t: tab.at, x: TAB_X(i) + 120, y: TAB_Y + 34, click: true })),
          { t: 6.8, x: 1500, y: 640 },
        ]}
        hideAt={8.2}
      />
    </AbsoluteFill>
  );
};

const PartB: React.FC = () => {
  const t = useT();
  const g = useSpringAt(9.1, 14);
  const r = useSpringAt(9.5, 14);
  const ballX = 360 + Math.sin(t * 2.4) * 280;
  const ballY = 460 - Math.abs(Math.cos(t * 3.1)) * 270;
  const pan = (ballX - 360) / 280;
  const count = Math.round(lerp(t, [11.6, 14.4], [0, 3205], (v) => v));
  const bytes = Math.round(lerp(t, [15.0, 17.0], [0, 63], (v) => v));

  return (
    <AbsoluteFill>
      <Title top={110} size={56} at={9.0}>
        真实案例：<span style={{ color: C.primary }}>DX-Ball</span> 声像计算重建
      </Title>
      <Card style={{ left: 140, top: 250, width: 720, height: 560, overflow: "hidden", opacity: g, transform: `scale(${0.9 + g * 0.1})` }}>
        <div style={{ position: "absolute", left: 30, top: 30, display: "grid", gridTemplateColumns: "repeat(8, 76px)", gap: 6 }}>
          {Array.from({ length: 24 }, (_, i) => (
            <div
              key={i}
              style={{
                height: 30,
                borderRadius: 6,
                background: [C.primary, C.violet, C.cyan][Math.floor(i / 8)],
                opacity: 0.85,
              }}
            />
          ))}
        </div>
        <div style={{ position: "absolute", left: ballX - 16, top: ballY - 16, width: 32, height: 32, borderRadius: 16, background: C.primary }} />
        <div style={{ position: "absolute", left: ballX - 80, top: 478, width: 160, height: 18, borderRadius: 9, background: C.ink }} />
        <div style={{ position: "absolute", left: 30, right: 30, bottom: 26, display: "flex", alignItems: "center", gap: 14, fontFamily: MONO, fontSize: 22, fontWeight: 700 }}>
          <span>L</span>
          <div style={{ flex: 1, height: 14, borderRadius: 7, background: "#E3DFD3", position: "relative" }}>
            <div style={{ position: "absolute", left: "50%", top: -6, width: 2, height: 26, background: C.sub }} />
            <div
              style={{
                position: "absolute",
                left: `calc(${50 + pan * 48}% - 13px)`,
                top: -6,
                width: 26,
                height: 26,
                borderRadius: 13,
                background: C.primary,
              }}
            />
          </div>
          <span>R</span>
          <span style={{ color: C.primary, width: 160 }}>pan {pan >= 0 ? "+" : ""}{pan.toFixed(2)}</span>
        </div>
      </Card>

      <Card style={{ left: 920, top: 250, width: 860, height: 260, padding: 34, opacity: r, transform: `translateX(${(1 - r) * 60}px)` }}>
        <div style={{ fontSize: 26, color: C.sub, fontWeight: 700 }}>重建后的 C 函数 · 原始 x86 测试用例</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 8 }}>
          <span style={{ fontFamily: MONO, fontSize: 104, fontWeight: 700, color: C.green }}>{count.toLocaleString("en-US")}</span>
          <span style={{ fontSize: 34, fontWeight: 700 }}>个测试全部通过</span>
        </div>
        <div style={{ height: 14, borderRadius: 7, background: "#E3DFD3", overflow: "hidden" }}>
          <div style={{ width: `${(count / 3205) * 100}%`, height: "100%", background: C.green }} />
        </div>
      </Card>

      <Card style={{ left: 920, top: 540, width: 860, height: 270, padding: 30, opacity: r }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 26, color: C.sub, fontWeight: 700 }}>编译产物逐字节比对</span>
          <span style={{ fontFamily: MONO, fontSize: 44, fontWeight: 700, color: bytes === 63 ? C.green : C.ink }}>{bytes} / 63 字节</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(21, 1fr)", gap: 6, marginTop: 20 }}>
          {Array.from({ length: 63 }, (_, i) => {
            const on = i < bytes;
            return (
              <div
                key={i}
                style={{
                  height: 44,
                  borderRadius: 6,
                  background: on ? "#E5EEDD" : "#EFEBE1",
                  border: `1.5px solid ${on ? C.green : C.line}`,
                  fontFamily: MONO,
                  fontSize: 15,
                  color: on ? C.green : "#D3CEC1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${i === bytes - 1 ? 1.15 : 1})`,
                }}
              >
                {((i * 37 + 11) % 256).toString(16).padStart(2, "0").toUpperCase()}
              </div>
            );
          })}
        </div>
      </Card>
    </AbsoluteFill>
  );
};

export const S6Evidence: React.FC = () => {
  const t = useT();
  const a = lerp(t, [8.5, 9.0], [1, 0]);
  const b = lerp(t, [8.8, 9.3], [0, 1]);
  return (
    <AbsoluteFill>
      {a > 0 && (
        <AbsoluteFill style={{ opacity: a }}>
          <PartA />
        </AbsoluteFill>
      )}
      {b > 0 && (
        <AbsoluteFill style={{ opacity: b }}>
          <PartB />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
