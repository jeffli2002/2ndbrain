import { registerRoot, Composition, Sequence, AbsoluteFill, useCurrentFrame, interpolate, Text } from 'remotion';

const COLORS = {
  background: '#0a0a12',
  primary: '#00d4ff',
  secondary: '#7c3aed',
  accent: '#f59e0b',
  success: '#10b981',
  text: '#ffffff',
  textMuted: '#94a3b8',
};

// 背景
const Bg = ({ c = COLORS.primary }: { c?: string }) => (
  <AbsoluteFill style={{ background: COLORS.background }}>
    <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${c}10 1px, transparent 1px), linear-gradient(90deg, ${c}10 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
    <div style={{ position: 'absolute', top: 0, left: '25%', width: '50%', height: '35%', background: `radial-gradient(ellipse at center, ${c}15 0%, transparent 65%)` }} />
  </AbsoluteFill>
);

// 开场
const O = () => {
  const f = useCurrentFrame();
  const o1 = interpolate(f, [0, 30], [0, 1]);
  const o2 = interpolate(f, [30, 60], [0, 1]);
  return (
    <AbsoluteFill>
      <Bg />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 120, fontWeight: 'bold', color: COLORS.text, opacity: o1 }}>OpenClaw</Text>
        <Text style={{ fontSize: 48, color: COLORS.primary, marginTop: 20, opacity: o2 }}>你的AI生产力引擎</Text>
      </div>
    </AbsoluteFill>
  );
};

// 场景
const S = ({ n, t, s, i, c = COLORS.primary }: { n: string; t: string; s: string; i: string[]; c?: string }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 15], [0, 1]);
  const y = interpolate(f, [15, 45], [50, 0]);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Bg c={c} />
      <div style={{ position: 'absolute', top: 200 + y, left: 0, right: 0, padding: '0 80px' }}>
        <Text style={{ fontSize: 36, color: COLORS.textMuted, marginBottom: 20 }}>{n}</Text>
        <Text style={{ fontSize: 72, fontWeight: 'bold', color: COLORS.text, marginBottom: 30 }}>{t}</Text>
        <Text style={{ fontSize: 32, color: COLORS.textMuted, lineHeight: 1.6 }}>{s}</Text>
        <div style={{ display: 'flex', gap: 40, marginTop: 60 }}>
          {i.map((e, j) => <div key={j} style={{ fontSize: 64, opacity: interpolate(f, [30 + j * 10, 60 + j * 10], [0, 1]) }}>{e}</div>)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 结尾
const E = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 15], [0, 1]);
  const o2 = interpolate(f, [20, 50], [0, 1]);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Bg c={COLORS.primary} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 72, fontWeight: 'bold', color: COLORS.primary, textShadow: `0 0 60px ${COLORS.primary}`, opacity: o2 }}>让AI为你工作</Text>
      </div>
    </AbsoluteFill>
  );
};

// 主组件
const P = () => (
  <div style={{ background: COLORS.background }}>
    <Sequence from={0} duration={90}><O /></Sequence>
    <Sequence from={90} duration={180}><S n="场景一" t="自动化客户服务" s="AI客服 7×24小时响应 · 智能理解客户意图 · 自动处理咨询" i={['💬', '🤖', '⚡']} /></Sequence>
    <Sequence from={270} duration={180}><S n="场景二" t="内容创作与分发" s="一键生成多平台内容 · 公众号、小红书、X同步发布 · 智能配图与排版" i={['📝', '📱', '🌐']} c={COLORS.secondary} /></Sequence>
    <Sequence from={450} duration={180}><S n="场景三" t="数据分析与报告" s="自动抓取行业数据 · 智能生成洞察报告 · 可视化图表一键导出" i={['📊', '📈', '🔍']} c={COLORS.accent} /></Sequence>
    <Sequence from={630} duration={150}><S n="场景四" t="销售获客流程" s="智能线索识别 · 自动跟进转化 · 私域流量运营 · 精准营销触达" i={['🎯', '🚀', '💰']} c={COLORS.success} /></Sequence>
    <Sequence from={780} duration={120}><E /></Sequence>
  </div>
);

registerRoot(() => (
  <Composition id="OpenClawPromo" component={P} durationInFrames={900} fps={30} width={1080} height={1920} />
));
