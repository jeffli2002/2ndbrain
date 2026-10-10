import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, MONO } from "../theme";
import { Card, Cursor, lerp, pressScale, Title, useSpringAt, useT } from "../components";

const PICK = 3.4;

const Bar: React.FC<{ label: string; y: number; at: number; color: string }> = ({ label, y, at, color }) => {
  const t = useT();
  const fill = lerp(t, [at, at + 2.4], [0.32, 0.9]);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: y, fontFamily: FONT }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, fontWeight: 700 }}>
        <span>{label}</span>
        <span style={{ fontFamily: MONO, color }}>{Math.round(fill * 100)}%</span>
      </div>
      <div style={{ position: "relative", height: 26, borderRadius: 13, background: "#E3DFD3", marginTop: 12, overflow: "visible" }}>
        <div style={{ width: `${fill * 100}%`, height: "100%", borderRadius: 13, background: color }} />
        <div style={{ position: "absolute", left: "32%", top: -10, width: 3, height: 46, background: C.sub }} />
        <div style={{ position: "absolute", left: "32%", top: 40, fontSize: 18, color: C.sub, transform: "translateX(-50%)" }}>过去</div>
      </div>
    </div>
  );
};

export const S7Impact: React.FC = () => {
  const t = useT();
  const l = useSpringAt(0.4, 14);
  const r = useSpringAt(0.7, 14);
  const picked = lerp(t, [PICK, PICK + 0.5], [0, 1]);
  const meter = useSpringAt(4.8, 14);
  const step = useSpringAt(8.2, 10);

  return (
    <AbsoluteFill>
      <Title top={100} size={56}>
        为什么说它<span style={{ color: C.primary }}>「炸」</span>？
      </Title>

      <Card
        style={{
          left: 260,
          top: 220,
          width: 560,
          height: 290,
          padding: 30,
          opacity: l * (1 - picked * 0.45),
          transform: `translateX(${(1 - l) * -60}px) scale(${1 - picked * 0.05})`,
          filter: `grayscale(${picked})`,
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 700 }}>聊天套壳</div>
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ alignSelf: "flex-end", background: "#F6E6DE", padding: "8px 16px", borderRadius: 14, fontSize: 22 }}>帮我分析这个 App</div>
          <div style={{ alignSelf: "flex-start", background: "#EFEBE1", padding: "8px 16px", borderRadius: 14, fontSize: 22 }}>它可能用了某种搜索算法…</div>
        </div>
        <div style={{ marginTop: 18, fontSize: 22, color: C.sub }}>只会说 · 接触不到真实目标</div>
      </Card>

      <div
        style={{
          position: "absolute",
          left: 910,
          top: 330,
          width: 100,
          height: 100,
          borderRadius: 50,
          background: "#fff",
          border: `2px solid ${C.line}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 32,
          color: C.sub,
          opacity: r,
        }}
      >
        VS
      </div>

      <Card
        style={{
          left: 1100,
          top: 220,
          width: 560,
          height: 290,
          padding: 30,
          opacity: r,
          transform: `translateX(${(1 - r) * 60}px) scale(${(1 + picked * 0.06) * pressScale(t, PICK)})`,
          border: `2px solid ${picked > 0 ? C.primary : C.line}`,
          boxShadow: picked > 0 ? `0 0 0 ${10 * picked}px rgba(217,119,87,0.12), 0 24px 60px rgba(20,20,19,0.12)` : undefined,
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 700 }}>
          Agent <span style={{ color: C.primary }}>+</span> 硬核工程
        </div>
        <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
          {["调用工具", "读二进制", "追踪调用", "写代码", "跑测试 ✓"].map((x, i) => (
            <div
              key={x}
              style={{
                padding: "8px 16px",
                borderRadius: 12,
                background: C.primary,
                color: "#fff",
                fontSize: 22,
                fontWeight: 700,
                opacity: lerp(t, [PICK + 0.2 + i * 0.15, PICK + 0.5 + i * 0.15], [0.35, 1]),
              }}
            >
              {x}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 18, fontSize: 22, color: C.primary, fontWeight: 700 }}>真能动手 · 结论可验证</div>
      </Card>

      <Card style={{ left: 260, top: 560, width: 1400, height: 290, opacity: meter, transform: `translateY(${(1 - meter) * 50}px)` }}>
        <div style={{ position: "absolute", left: 60, top: 26, fontSize: 24, fontWeight: 700, color: C.sub }}>
          影响：攻防双方的「自动化强度」
        </div>
        <div style={{ position: "absolute", left: 0, top: 0, width: 1060, height: 290 }}>
          <Bar label="自动化漏洞挖掘" y={78} at={5.3} color={C.rose} />
          <Bar label="攻防对抗强度" y={168} at={6.0} color={C.primary} />
        </div>
        <div
          style={{
            position: "absolute",
            right: 50,
            top: 60,
            width: 260,
            height: 180,
            opacity: step,
            transform: `scale(${0.6 + step * 0.4})`,
          }}
        >
          <svg width={260} height={140} viewBox="0 0 260 140">
            <path d="M10 130 H80 V90 H150 V50 H220 V10" stroke={C.primary} strokeWidth={8} fill="none" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - step} />
            <path d="M205 22 L222 4 L240 22" stroke={C.primary} strokeWidth={8} fill="none" strokeLinecap="round" />
          </svg>
          <div style={{ fontFamily: FONT, fontSize: 28, fontWeight: 700, color: C.primary, textAlign: "center" }}>抬高一个台阶</div>
        </div>
      </Card>

      <Cursor
        points={[
          { t: 2.4, x: 960, y: 760 },
          { t: PICK, x: 1420, y: 440, click: true },
          { t: 4.6, x: 1500, y: 520 },
        ]}
        hideAt={5.0}
      />
    </AbsoluteFill>
  );
};
