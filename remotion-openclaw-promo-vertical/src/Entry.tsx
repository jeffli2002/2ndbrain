import { registerRoot, Composition, useCurrentFrame, interpolate, AbsoluteFill, Sequence, Text } from 'remotion';

const COLORS = {
  background: '#0a0a12',
  primary: '#00d4ff',
  secondary: '#7c3aed',
  accent: '#f59e0b',
  success: '#10b981',
  text: '#ffffff',
  textMuted: '#94a3b8',
};

// 通用背景 - 简洁科技风
const SceneBackground = ({ color = COLORS.primary }: { color?: string }) => (
  <AbsoluteFill style={{ background: COLORS.background }}>
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: `linear-gradient(${color}12 1px, transparent 1px), linear-gradient(90deg, ${color}12 1px, transparent 1px)`,
      backgroundSize: '45px 45px',
    }} />
    <div style={{
      position: 'absolute', top: 0, left: '25%', width: '50%', height: '35%',
      background: `radial-gradient(ellipse at center, ${color}18 0%, transparent 65%)`,
    }} />
    <div style={{
      position: 'absolute', bottom: 0, left: '20%', width: '60%', height: '25%',
      background: `radial-gradient(ellipse at center, ${COLORS.secondary}12 0%, transparent 60%)`,
    }} />
  </AbsoluteFill>
);

// 开场
const OpeningScene = () => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 30], [0, 1]);
  const titleScale = interpolate(frame, [0, 30], [0.8, 1]);
  const subtitleOpacity = interpolate(frame, [30, 60], [0, 1]);

  return (
    <AbsoluteFill>
      <SceneBackground />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 120, fontWeight: 'bold', color: COLORS.text, transform: `scale(${titleScale})`, opacity: titleOpacity, fontFamily: 'system-ui' }}>OpenClaw</Text>
        <Text style={{ fontSize: 48, color: COLORS.primary, marginTop: 20, opacity: subtitleOpacity, fontFamily: 'system-ui' }}>你的AI生产力引擎</Text>
      </div>
    </AbsoluteFill>
  );
};

// 场景1
const CustomerServiceScene = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1]);
  const slideUp = interpolate(frame, [15, 45], [50, 0]);

  return (
    <AbsoluteFill style={{ opacity }}>
      <SceneBackground color={COLORS.primary} />
      <div style={{ position: 'absolute', top: 200 + slideUp, left: 0, right: 0, padding: '0 80px' }}>
        <Text style={{ fontSize: 36, color: COLORS.textMuted, marginBottom: 20 }}>场景一</Text>
        <Text style={{ fontSize: 72, fontWeight: 'bold', color: COLORS.text, marginBottom: 30 }}>自动化客户服务</Text>
        <Text style={{ fontSize: 32, color: COLORS.textMuted, lineHeight: 1.6 }}>AI客服 7×24小时响应 · 智能理解客户意图 · 自动处理咨询</Text>
        <div style={{ display: 'flex', gap: 40, marginTop: 60 }}>
          {['💬', '🤖', '⚡'].map((emoji, i) => (
            <div key={i} style={{ fontSize: 64, opacity: interpolate(frame, [30 + i * 10, 60 + i * 10], [0, 1]) }}>{emoji}</div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 场景2
const ContentCreationScene = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1]);
  const slideUp = interpolate(frame, [15, 45], [50, 0]);

  return (
    <AbsoluteFill style={{ opacity }}>
      <SceneBackground color={COLORS.secondary} />
      <div style={{ position: 'absolute', top: 200 + slideUp, left: 0, right: 0, padding: '0 80px' }}>
        <Text style={{ fontSize: 36, color: COLORS.textMuted, marginBottom: 20 }}>场景二</Text>
        <Text style={{ fontSize: 72, fontWeight: 'bold', color: COLORS.text, marginBottom: 30 }}>内容创作与分发</Text>
        <Text style={{ fontSize: 32, color: COLORS.textMuted, lineHeight: 1.6 }}>一键生成多平台内容 · 公众号、小红书、X同步发布 · 智能配图与排版</Text>
        <div style={{ display: 'flex', gap: 40, marginTop: 60 }}>
          {['📝', '📱', '🌐'].map((emoji, i) => (
            <div key={i} style={{ fontSize: 64, opacity: interpolate(frame, [30 + i * 10, 60 + i * 10], [0, 1]) }}>{emoji}</div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 场景3
const DataAnalysisScene = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1]);
  const slideUp = interpolate(frame, [15, 45], [50, 0]);

  return (
    <AbsoluteFill style={{ opacity }}>
      <SceneBackground color={COLORS.accent} />
      <div style={{ position: 'absolute', top: 200 + slideUp, left: 0, right: 0, padding: '0 80px' }}>
        <Text style={{ fontSize: 36, color: COLORS.textMuted, marginBottom: 20 }}>场景三</Text>
        <Text style={{ fontSize: 72, fontWeight: 'bold', color: COLORS.text, marginBottom: 30 }}>数据分析与报告</Text>
        <Text style={{ fontSize: 32, color: COLORS.textMuted, lineHeight: 1.6 }}>自动抓取行业数据 · 智能生成洞察报告 · 可视化图表一键导出</Text>
        <div style={{ display: 'flex', gap: 40, marginTop: 60 }}>
          {['📊', '📈', '🔍'].map((emoji, i) => (
            <div key={i} style={{ fontSize: 64, opacity: interpolate(frame, [30 + i * 10, 60 + i * 10], [0, 1]) }}>{emoji}</div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 场景4 - 无CTA
const SalesScene = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1]);
  const slideUp = interpolate(frame, [15, 45], [50, 0]);

  return (
    <AbsoluteFill style={{ opacity }}>
      <SceneBackground color={COLORS.success} />
      <div style={{ position: 'absolute', top: 200 + slideUp, left: 0, right: 0, padding: '0 80px' }}>
        <Text style={{ fontSize: 36, color: COLORS.textMuted, marginBottom: 20 }}>场景四</Text>
        <Text style={{ fontSize: 72, fontWeight: 'bold', color: COLORS.text, marginBottom: 30 }}>销售获客流程</Text>
        <Text style={{ fontSize: 32, color: COLORS.textMuted, lineHeight: 1.6 }}>智能线索识别 · 自动跟进转化 · 私域流量运营 · 精准营销触达</Text>
        <div style={{ display: 'flex', gap: 40, marginTop: 60 }}>
          {['🎯', '🚀', '💰'].map((emoji, i) => (
            <div key={i} style={{ fontSize: 64, opacity: interpolate(frame, [30 + i * 10, 60 + i * 10], [0, 1]) }}>{emoji}</div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 独立结尾页 - 居中显示，CTA无openclaw.ai
const EndingScene = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1]);
  const textOpacity = interpolate(frame, [20, 50], [0, 1]);

  return (
    <AbsoluteFill style={{ opacity }}>
      <SceneBackground color={COLORS.primary} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 72, fontWeight: 'bold', color: COLORS.primary, textShadow: `0 0 60px ${COLORS.primary}`, opacity: textOpacity, fontFamily: 'system-ui' }}>让AI为你工作</Text>
      </div>
    </AbsoluteFill>
  );
};

// 主组件
export const OpenClawPromo = () => (
  <div style={{ background: COLORS.background }}>
    <Sequence from={0} duration={90}><OpeningScene /></Sequence>
    <Sequence from={90} duration={180}><CustomerServiceScene /></Sequence>
    <Sequence from={270} duration={180}><ContentCreationScene /></Sequence>
    <Sequence from={450} duration={180}><DataAnalysisScene /></Sequence>
    <Sequence from={630} duration={150}><SalesScene /></Sequence>
    <Sequence from={780} duration={120}><EndingScene /></Sequence>
  </div>
);

registerRoot(() => (
  <Composition id="OpenClawPromo" component={OpenClawPromo} durationInFrames={900} fps={30} width={1080} height={1920} />
));
