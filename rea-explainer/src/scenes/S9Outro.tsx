import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, MONO, SERIF } from "../theme";
import { Chip, Cursor, Spark, lerp, pressScale, useSpringAt, useT } from "../components";

const COPY = 6.4;

export const S9Outro: React.FC = () => {
  const t = useT();
  const logo = useSpringAt(0.2, 10);
  const tag = useSpringAt(1.2, 14);
  const chips = useSpringAt(3.9, 12);
  const cmd = useSpringAt(5.4, 14);

  return (
    <AbsoluteFill style={{ alignItems: "center", fontFamily: FONT }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 960 - (260 + i * 90),
            top: 330 - (260 + i * 90),
            width: (260 + i * 90) * 2,
            height: (260 + i * 90) * 2,
            borderRadius: "50%",
            border: `2px ${i === 1 ? "dashed" : "solid"} rgba(217,119,87,${0.18 - i * 0.04})`,
            transform: `rotate(${t * (i % 2 ? -20 : 14)}deg) scale(${logo})`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: -8,
              width: 16,
              height: 16,
              borderRadius: 8,
              background: [C.primary, C.cyan, C.violet][i],
            }}
          />
        </div>
      ))}
      <div
        style={{
          marginTop: 200,
          display: "flex",
          alignItems: "center",
          gap: 36,
          fontSize: 240,
          fontWeight: 700,
          fontFamily: SERIF,
          lineHeight: 1,
          letterSpacing: 16,
          color: C.ink,
          transform: `scale(${logo})`,
        }}
      >
        <Spark size={170} spin={t * 25} />
        REA
      </div>
      <div style={{ marginTop: 24, fontSize: 54, fontWeight: 700, fontFamily: SERIF, color: C.ink, opacity: tag, transform: `translateY(${(1 - tag) * 20}px)` }}>
        看见一个功能，就能读懂它的底层
      </div>
      <div style={{ marginTop: 28, display: "flex", gap: 16, opacity: chips, transform: `scale(${0.8 + chips * 0.2})` }}>
        <Chip>开源</Chip>
        <Chip color={C.amber}>MIT 协议</Chip>
        <Chip color={C.teal}>本地分析</Chip>
      </div>
      <div
        style={{
          marginTop: 36,
          display: "flex",
          alignItems: "center",
          gap: 0,
          borderRadius: 18,
          background: C.dark,
          boxShadow: "0 18px 40px rgba(20,20,19,0.25)",
          overflow: "hidden",
          opacity: cmd,
          transform: `translateY(${(1 - cmd) * 30}px)`,
        }}
      >
        <div style={{ padding: "18px 30px", fontFamily: MONO, fontSize: 34, color: "#E3DFD3" }}>
          <span style={{ color: "#E89B7F" }}>$</span> npx rea-agents setup
        </div>
        <div
          style={{
            padding: "18px 26px",
            fontSize: 28,
            fontWeight: 700,
            color: "#fff",
            background: t > COPY ? C.green : C.primary,
            transform: `scale(${pressScale(t, COPY)})`,
            minWidth: 150,
            textAlign: "center",
          }}
        >
          {t > COPY ? "✓ 已复制" : "复制"}
        </div>
      </div>
      <div style={{ marginTop: 22, fontFamily: MONO, fontSize: 28, color: C.sub, opacity: lerp(t, [5.8, 6.4], [0, 1]) }}>
        github.com/morluto/rea · rea.tools
      </div>
      <Cursor
        points={[
          { t: 5.6, x: 1500, y: 960 },
          { t: COPY, x: 1215, y: 698, click: true },
          { t: 7.6, x: 1380, y: 820 },
        ]}
      />
    </AbsoluteFill>
  );
};
