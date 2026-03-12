import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill, Sequence, Text, staticFile } from 'remotion';

// 颜色配置
const COLORS = {
  background: '#0a0a0f',
  primary: '#00d4ff',
  secondary: '#7c3aed',
  accent: '#f59e0b',
  text: '#ffffff',
  textMuted: '#94a3b8',
};

// 场景组件 - 通用背景
const SceneBackground = () => (
  <AbsoluteFill style={{ background: COLORS.background }}>
    {/* 网格背景 */}
    <div style={{
      position: 'absolute',
      inset: 0,
      backgroundImage: `
        linear-gradient(${COLORS.primary}10 1px, transparent 1px),
        linear-gradient(90deg, ${COLORS.primary}10 1px, transparent 1px)
      `,
      backgroundSize: '60px 60px',
      opacity: 0.3,
    }} />
    {/* 渐变光效 */}
    <div style={{
      position: 'absolute',
      top: '-50%',
      left: '-50%',
      width: '200%',
      height: '200%',
      background: `radial-gradient(circle at 30% 30%, ${COLORS.primary}15 0%, transparent 50%),
                   radial-gradient(circle at 70% 70%, ${COLORS.secondary}15 0%, transparent 50%)`,
    }} />
  </AbsoluteFill>
);

// 开场标题
const OpeningScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 30], [0, 1]);
  const titleScale = interpolate(frame, [0, 30], [0.8, 1]);
  const subtitleOpacity = interpolate(frame, [30, 60], [0, 1]);

  return (
    <AbsoluteFill>
      <SceneBackground />
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text
          style={{
            fontSize: 120,
            fontWeight: 'bold',
            color: COLORS.text,
            textAlign: 'center',
            transform: `scale(${titleScale})`,
            opacity: titleOpacity,
            fontFamily: 'system-ui',
          }}
        >
          OpenClaw
        </Text>
        <Text
          style={{
            fontSize: 48,
            color: COLORS.primary,
            marginTop: 20,
            opacity: subtitleOpacity,
            fontFamily: 'system-ui',
          }}
        >
          你的AI生产力引擎
        </Text>
      </div>
    </AbsoluteFill>
  );
};

// 场景1: 自动化客户服务
const CustomerServiceScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 15], [0, 1]);
  const slideUp = interpolate(frame, [15, 45], [50, 0]);

  return (
    <AbsoluteFill style={{ opacity }}>
      <SceneBackground />
      <div style={{
        position: 'absolute',
        top: 200 + slideUp,
        left: 0,
        right: 0,
        padding: '0 80px',
      }}>
        <Text style={{ fontSize: 36, color: COLORS.textMuted, marginBottom: 20 }}>
          场景一
        </Text>
        <Text style={{ fontSize: 72, fontWeight: 'bold', color: COLORS.text, marginBottom: 30 }}>
          自动化客户服务
        </Text>
        <Text style={{ fontSize: 32, color: COLORS.textMuted, lineHeight: 1.6 }}>
          AI客服 7×24小时响应 · 智能理解客户意图 · 自动处理咨询
        </Text>
        {/* 图标展示 */}
        <div style={{ display: 'flex', gap: 40, marginTop: 60 }}>
          {['💬', '🤖', '⚡'].map((emoji, i) => (
            <div key={i} style={{
              fontSize: 64,
              opacity: interpolate(frame, [30 + i * 10, 60 + i * 10], [0, 1]),
            }}>
              {emoji}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 场景2: 内容创作与分发
const ContentCreationScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 15], [0, 1]);
  const slideUp = interpolate(frame, [15, 45], [50, 0]);

  return (
    <AbsoluteFill style={{ opacity }}>
      <SceneBackground />
      <div style={{
        position: 'absolute',
        top: 200 + slideUp,
        left: 0,
        right: 0,
        padding: '0 80px',
      }}>
        <Text style={{ fontSize: 36, color: COLORS.textMuted, marginBottom: 20 }}>
          场景二
        </Text>
        <Text style={{ fontSize: 72, fontWeight: 'bold', color: COLORS.text, marginBottom: 30 }}>
          内容创作与分发
        </Text>
        <Text style={{ fontSize: 32, color: COLORS.textMuted, lineHeight: 1.6 }}>
          一键生成多平台内容 · 公众号、小红书、X同步发布 · 智能配图与排版
        </Text>
        {/* 图标展示 */}
        <div style={{ display: 'flex', gap: 40, marginTop: 60 }}>
          {['📝', '📱', '🌐'].map((emoji, i) => (
            <div key={i} style={{
              fontSize: 64,
              opacity: interpolate(frame, [30 + i * 10, 60 + i * 10], [0, 1]),
            }}>
              {emoji}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 场景3: 数据分析与报告
const DataAnalysisScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 15], [0, 1]);
  const slideUp = interpolate(frame, [15, 45], [50, 0]);

  return (
    <AbsoluteFill style={{ opacity }}>
      <SceneBackground />
      <div style={{
        position: 'absolute',
        top: 200 + slideUp,
        left: 0,
        right: 0,
        padding: '0 80px',
      }}>
        <Text style={{ fontSize: 36, color: COLORS.textMuted, marginBottom: 20 }}>
          场景三
        </Text>
        <Text style={{ fontSize: 72, fontWeight: 'bold', color: COLORS.text, marginBottom: 30 }}>
          数据分析与报告
        </Text>
        <Text style={{ fontSize: 32, color: COLORS.textMuted, lineHeight: 1.6 }}>
          自动抓取行业数据 · 智能生成洞察报告 · 可视化图表一键导出
        </Text>
        {/* 图标展示 */}
        <div style={{ display: 'flex', gap: 40, marginTop: 60 }}>
          {['📊', '📈', '🔍'].map((emoji, i) => (
            <div key={i} style={{
              fontSize: 64,
              opacity: interpolate(frame, [30 + i * 10, 60 + i * 10], [0, 1]),
            }}>
              {emoji}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 场景4: 销售获客流程 + 结尾
const SalesScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 15], [0, 1]);
  const slideUp = interpolate(frame, [15, 45], [50, 0]);
  const ctaOpacity = interpolate(frame, [60, 90], [0, 1]);

  return (
    <AbsoluteFill style={{ opacity }}>
      <SceneBackground />
      <div style={{
        position: 'absolute',
        top: 200 + slideUp,
        left: 0,
        right: 0,
        padding: '0 80px',
      }}>
        <Text style={{ fontSize: 36, color: COLORS.textMuted, marginBottom: 20 }}>
          场景四
        </Text>
        <Text style={{ fontSize: 72, fontWeight: 'bold', color: COLORS.text, marginBottom: 30 }}>
          销售获客流程
        </Text>
        <Text style={{ fontSize: 32, color: COLORS.textMuted, lineHeight: 1.6 }}>
          智能线索识别 · 自动跟进转化 · 私域流量运营 · 精准营销触达
        </Text>
        {/* 图标展示 */}
        <div style={{ display: 'flex', gap: 40, marginTop: 60 }}>
          {['🎯', '🚀', '💰'].map((emoji, i) => (
            <div key={i} style={{
              fontSize: 64,
              opacity: interpolate(frame, [30 + i * 10, 60 + i * 10], [0, 1]),
            }}>
              {emoji}
            </div>
          ))}
        </div>
      </div>
      {/* CTA 结尾 */}
      <div style={{
        position: 'absolute',
        bottom: 150,
        left: 0,
        right: 0,
        textAlign: 'center',
        opacity: ctaOpacity,
      }}>
        <Text style={{
          fontSize: 56,
          fontWeight: 'bold',
          color: COLORS.primary,
          marginBottom: 20,
        }}>
          让AI为你工作
        </Text>
        <Text style={{
          fontSize: 32,
          color: COLORS.textMuted,
        }}>
          openclaw.ai
        </Text>
      </div>
    </AbsoluteFill>
  );
};

// 主组件
export const OpenClawPromo = () => {
  return (
    <div style={{ background: COLORS.background }}>
      <Sequence from={0} duration={90}>
        <OpeningScene />
      </Sequence>
      <Sequence from={90} duration={180}>
        <CustomerServiceScene />
      </Sequence>
      <Sequence from={270} duration={180}>
        <ContentCreationScene />
      </Sequence>
      <Sequence from={450} duration={180}>
        <DataAnalysisScene />
      </Sequence>
      <Sequence from={630} duration={270}>
        <SalesScene />
      </Sequence>
    </div>
  );
};
