import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT, MONO, SERIF } from "../theme";
import { Card, Cursor, lerp, pressScale, useSpringAt, useT, WindowBar } from "../components";

const NOTES = [
  { title: "周一 产品会议纪要", hit: true },
  { title: "旅行清单 · 东京", hit: false },
  { title: "会议：Q3 规划讨论", hit: true },
  { title: "读书笔记《黑客与画家》", hit: false },
  { title: "团队周会 复盘", hit: true },
];

const WX = 160;
const WY = 200;
const WW = 980;
const WH = 640;

const Highlight: React.FC<{ text: string; on: number }> = ({ text, on }) => {
  const i = text.indexOf("会");
  if (i < 0 || on <= 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span
        style={{
          background: `rgba(217,119,87,${0.28 * on})`,
          borderRadius: 6,
          padding: "0 2px",
        }}
      >
        {text.slice(i, i + 2)}
      </span>
      {text.slice(i + 2)}
    </>
  );
};

export const S1Intro: React.FC = () => {
  const t = useT();
  const win = useSpringAt(0.1, 16);
  const query = "会议".slice(0, Math.floor(lerp(t, [1.6, 2.4], [0, 2.99])));
  const filterK = lerp(t, [2.5, 3.1], [0, 1]);
  const magic = lerp(t, [3.0, 3.6], [0, 1]);

  const qK = useSpringAt(3.8, 12);
  const modalK = useSpringAt(5.9, 13);
  const shake = t > 6.2 && t < 6.8 ? Math.sin((t - 6.2) * 50) * 10 * (6.8 - t) : 0;
  const binK = useSpringAt(7.2, 14);

  const hitOrder = [0, 2, 4, 1, 3];
  return (
    <AbsoluteFill>
      <Card
        style={{
          left: WX,
          top: WY,
          width: WW,
          height: WH,
          overflow: "hidden",
          opacity: win,
          transform: `translateY(${(1 - win) * 60}px)`,
        }}
      >
        <WindowBar title="笔记 Notes.app" />
        <div
          style={{
            position: "absolute",
            right: 20,
            top: 9,
            padding: "6px 16px",
            borderRadius: 10,
            border: `1.5px solid ${C.line}`,
            fontSize: 20,
            fontWeight: 700,
            color: C.sub,
            fontFamily: MONO,
            transform: `scale(${pressScale(t, 5.6)})`,
            background: t > 5.6 ? "#F6E6DE" : "#fff",
          }}
        >
          {"</> 查看源代码"}
        </div>
        <div style={{ padding: 30 }}>
          <div
            style={{
              height: 64,
              borderRadius: 16,
              border: `2px solid ${t > 1.3 ? C.primary : C.line}`,
              boxShadow: t > 1.3 ? `0 0 0 6px rgba(217,119,87,0.12)` : "none",
              display: "flex",
              alignItems: "center",
              padding: "0 22px",
              fontSize: 28,
              gap: 14,
              transform: `scale(${pressScale(t, 1.3)})`,
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24">
              <circle cx="10" cy="10" r="7" stroke={C.sub} strokeWidth="2.5" fill="none" />
              <path d="M15 15 L21 21" stroke={C.sub} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span style={{ color: query ? C.ink : C.sub }}>{query || "搜索笔记…"}</span>
            {t > 1.3 && t < 2.6 && Math.floor(t * 3) % 2 === 0 && (
              <span style={{ width: 2, height: 30, background: C.primary }} />
            )}
            <div style={{ flex: 1 }} />
            <div
              style={{
                opacity: magic,
                transform: `scale(${0.6 + magic * 0.4})`,
                padding: "6px 14px",
                borderRadius: 999,
                background: C.primary,
                color: "#fff",
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              智能匹配 0.03s
            </div>
          </div>
          <div style={{ position: "relative", height: 460, marginTop: 24 }}>
            {NOTES.map((n, i) => {
              const target = hitOrder.indexOf(i);
              const y = lerp(filterK, [0, 1], [i * 88, target * 88]);
              const dim = n.hit ? 1 : 1 - filterK * 0.65;
              return (
                <div
                  key={n.title}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: y,
                    height: 74,
                    borderRadius: 14,
                    background: n.hit && filterK > 0 ? "#FBF1EC" : "#fff",
                    border: `1.5px solid ${n.hit && filterK > 0.5 ? "#EBC2B0" : C.line}`,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 24px",
                    fontSize: 26,
                    opacity: dim,
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      background: n.hit && filterK > 0.5 ? C.primary : C.line,
                    }}
                  />
                  <Highlight text={n.title} on={n.hit ? magic : 0} />
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div
        style={{
          position: "absolute",
          left: 1220,
          top: 190,
          width: 560,
          fontFamily: FONT,
          opacity: qK,
          transform: `translateX(${(1 - qK) * 40}px)`,
        }}
      >
        <div
          style={{
            fontSize: 220,
            fontWeight: 700,
            fontFamily: SERIF,
            lineHeight: 1,
            color: C.primary,
            transform: `rotate(${Math.sin(t * 2) * 4}deg)`,
            display: "inline-block",
          }}
        >
          ?
        </div>
        <div style={{ fontSize: 58, fontWeight: 700, fontFamily: SERIF, color: C.ink, lineHeight: 1.3 }}>
          它是怎么
          <br />
          做出来的？
        </div>
      </div>

      {t > 5.8 && (
        <Card
          style={{
          left: 1180,
          top: 660,
            width: 620,
            height: 250,
            padding: 30,
            transform: `scale(${modalK}) translateX(${shake}px)`,
            transformOrigin: "left center",
            border: `2px solid ${C.rose}55`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <svg width="78" height="88" viewBox="0 0 40 46">
              <path
                d="M10 20 V13 a10 10 0 0 1 20 0 V20"
                stroke={C.rose}
                strokeWidth="4.5"
                fill="none"
              />
              <rect x="4" y="20" width="32" height="24" rx="6" fill={C.rose} />
              <circle cx="20" cy="31" r="3.5" fill="#fff" />
            </svg>
            <div>
              <div style={{ fontSize: 40, fontWeight: 700, color: C.rose }}>源代码不可用</div>
              <div style={{ fontSize: 24, color: C.sub, marginTop: 6 }}>闭源应用，拿不到一行代码</div>
            </div>
          </div>
          <div
            style={{
              marginTop: 22,
              fontFamily: MONO,
              fontSize: 22,
              color: C.sub,
              opacity: binK,
              background: "#EFEBE1",
              borderRadius: 12,
              padding: "10px 16px",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            你只有：Notes ▸ 4F 8B 2C E1 90 0D 7A 3B …
          </div>
        </Card>
      )}

      <Cursor
        points={[
          { t: 0.8, x: 820, y: 700 },
          { t: 1.3, x: 430, y: 314, click: true },
          { t: 3.6, x: 520, y: 330 },
          { t: 5.6, x: 1050, y: 226, click: true },
          { t: 7.0, x: 1010, y: 300 },
        ]}
        hideAt={8.2}
      />
    </AbsoluteFill>
  );
};