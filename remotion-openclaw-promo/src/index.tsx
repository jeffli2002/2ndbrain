import { registerRoot, Composition, Sequence, AbsoluteFill, useCurrentFrame, interpolate, Audio, staticFile } from 'remotion';

const COLORS = {
  background: '#0a0a0f',
  primary: '#00d4ff',
  secondary: '#7c3aed',
  text: '#ffffff',
  textMuted: '#94a3b8',
};

// 流式文字动画组件
const StreamText = ({ text, delay, color = COLORS.text, size = 36 }: { text: string; delay: number; color?: string; size?: number }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateLeft: 'clamp' });
  const x = interpolate(frame, [delay, delay + 15], [30, 0], { extrapolateLeft: 'clamp' });
  return (
    <span style={{ opacity, transform: `translateX(${x}px)`, display: 'inline-block', color, fontSize: size, marginRight: 8 }}>
      {text}
    </span>
  );
};

// 流式图标动画
const StreamIcon = ({ icon, delay }: { icon: string; delay: number }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateLeft: 'clamp' });
  const scale = interpolate(frame, [delay, delay + 20], [0.5, 1], { extrapolateLeft: 'clamp' });
  return (
    <span style={{ opacity, transform: `scale(${scale})`, fontSize: 72, display: 'inline-block' }}>
      {icon}
    </span>
  );
};

// 开场 - 全屏 0-3秒
const Opening = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20, 75, 90], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.background, opacity }}>
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
      }}>
        <h1 style={{ fontSize: 160, fontWeight: 'bold', color: COLORS.text, margin: 0, textShadow: `0 0 80px ${COLORS.primary}` }}>OpenClaw</h1>
        <p style={{ fontSize: 56, color: COLORS.primary, marginTop: 40, fontWeight: 300, letterSpacing: 8 }}>你的AI生产力引擎</p>
      </div>
    </AbsoluteFill>
  );
};

// 场景1: 自动化客户服务 - 左边区域 3-10秒 (帧90-300)
const Scene1 = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20, 180, 210], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const containerOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: 'clamp' });
  
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.background, opacity }}>
      {/* 左边60%区域 */}
      <div style={{ 
        position: 'absolute', 
        left: 0, 
        top: 0, 
        bottom: 0, 
        width: '60%', 
        padding: '80px 60px',
        background: `linear-gradient(135deg, ${COLORS.primary}08 0%, transparent 100%)`,
        opacity: containerOpacity
      }}>
        <p style={{ fontSize: 24, color: COLORS.primary, marginBottom: 20, letterSpacing: 6 }}>SCENE 01</p>
        <h2 style={{ fontSize: 72, fontWeight: 'bold', color: COLORS.text, marginBottom: 40 }}>
          <StreamText text="自动化" delay={30} color={COLORS.primary} />
        </h2>
        <h2 style={{ fontSize: 72, fontWeight: 'bold', color: COLORS.text, marginBottom: 40 }}>
          <StreamText text="客户服务" delay={60} />
        </h2>
        
        <div style={{ marginTop: 60 }}>
          <p style={{ fontSize: 28, color: COLORS.textMuted, marginBottom: 24 }}>
            <StreamText text="AI客服" delay={100} color={COLORS.primary} />
            <StreamText text="7×24小时响应" delay={130} />
          </p>
          <p style={{ fontSize: 28, color: COLORS.textMuted, marginBottom: 24 }}>
            <StreamText text="智能理解" delay={160} color={COLORS.primary} />
            <StreamText text="客户意图" delay={190} />
          </p>
        </div>

        <div style={{ display: 'flex', gap: 40, marginTop: 60 }}>
          <div><StreamIcon icon="💬" delay={220} /><p style={{ fontSize: 18, color: COLORS.textMuted, marginTop: 12 }}>即时对话</p></div>
          <div><StreamIcon icon="🤖" delay={240} /><p style={{ fontSize: 18, color: COLORS.textMuted, marginTop: 12 }}>智能理解</p></div>
          <div><StreamIcon icon="⚡" delay={260} /><p style={{ fontSize: 18, color: COLORS.textMuted, marginTop: 12 }}>极速响应</p></div>
        </div>
      </div>
      
      {/* 右边40%装饰区域 */}
      <div style={{ 
        position: 'absolute', 
        right: 0, 
        top: 0, 
        bottom: 0, 
        width: '40%', 
        background: `linear-gradient(180deg, ${COLORS.secondary}05 0%, transparent 100%)`
      }} />
    </AbsoluteFill>
  );
};

// 场景2: 内容创作与分发 - 左边区域 10-17秒 (帧300-510)
const Scene2 = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20, 180, 210], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const containerOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: 'clamp' });
  
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.background, opacity }}>
      <div style={{ 
        position: 'absolute', 
        left: 0, 
        top: 0, 
        bottom: 0, 
        width: '60%', 
        padding: '80px 60px',
        background: `linear-gradient(135deg, ${COLORS.secondary}08 0%, transparent 100%)`,
        opacity: containerOpacity
      }}>
        <p style={{ fontSize: 24, color: COLORS.secondary, marginBottom: 20, letterSpacing: 6 }}>SCENE 02</p>
        <h2 style={{ fontSize: 72, fontWeight: 'bold', color: COLORS.text, marginBottom: 40 }}>
          <StreamText text="内容创作" delay={30} color={COLORS.secondary} />
        </h2>
        <h2 style={{ fontSize: 72, fontWeight: 'bold', color: COLORS.text, marginBottom: 40 }}>
          <StreamText text="与分发" delay={60} />
        </h2>
        
        <div style={{ marginTop: 60 }}>
          <p style={{ fontSize: 28, color: COLORS.textMuted, marginBottom: 24 }}>
            <StreamText text="一键生成" delay={100} color={COLORS.secondary} />
            <StreamText text="多平台内容" delay={130} />
          </p>
          <p style={{ fontSize: 28, color: COLORS.textMuted, marginBottom: 24 }}>
            <StreamText text="公众号、小红书、X" delay={160} />
          </p>
        </div>

        <div style={{ display: 'flex', gap: 40, marginTop: 60 }}>
          <div><StreamIcon icon="📝" delay={200} /><p style={{ fontSize: 18, color: COLORS.textMuted, marginTop: 12 }}>智能写作</p></div>
          <div><StreamIcon icon="📱" delay={220} /><p style={{ fontSize: 18, color: COLORS.textMuted, marginTop: 12 }}>多端分发</p></div>
          <div><StreamIcon icon="🎨" delay={240} /><p style={{ fontSize: 18, color: COLORS.textMuted, marginTop: 12 }}>智能配图</p></div>
        </div>
      </div>
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40%', background: `linear-gradient(180deg, #f59e0b05 0%, transparent 100%)` }} />
    </AbsoluteFill>
  );
};

// 场景3: 数据分析与报告 - 左边区域 17-24秒 (帧510-720)
const Scene3 = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20, 180, 210], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const containerOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: 'clamp' });
  
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.background, opacity }}>
      <div style={{ 
        position: 'absolute', 
        left: 0, 
        top: 0, 
        bottom: 0, 
        width: '60%', 
        padding: '80px 60px',
        background: `linear-gradient(135deg, #f59e0b08 0%, transparent 100%)`,
        opacity: containerOpacity
      }}>
        <p style={{ fontSize: 24, color: '#f59e0b', marginBottom: 20, letterSpacing: 6 }}>SCENE 03</p>
        <h2 style={{ fontSize: 72, fontWeight: 'bold', color: COLORS.text, marginBottom: 40 }}>
          <StreamText text="数据分析" delay={30} color="#f59e0b" />
        </h2>
        <h2 style={{ fontSize: 72, fontWeight: 'bold', color: COLORS.text, marginBottom: 40 }}>
          <StreamText text="与报告" delay={60} />
        </h2>
        
        <div style={{ marginTop: 60 }}>
          <p style={{ fontSize: 28, color: COLORS.textMuted, marginBottom: 24 }}>
            <StreamText text="自动抓取" delay={100} color="#f59e0b" />
            <StreamText text="行业数据" delay={130} />
          </p>
          <p style={{ fontSize: 28, color: COLORS.textMuted, marginBottom: 24 }}>
            <StreamText text="智能生成" delay={160} color="#f59e0b" />
            <StreamText text="洞察报告" delay={190} />
          </p>
        </div>

        <div style={{ display: 'flex', gap: 40, marginTop: 60 }}>
          <div><StreamIcon icon="📊" delay={220} /><p style={{ fontSize: 18, color: COLORS.textMuted, marginTop: 12 }}>数据抓取</p></div>
          <div><StreamIcon icon="📈" delay={240} /><p style={{ fontSize: 18, color: COLORS.textMuted, marginTop: 12 }}>趋势分析</p></div>
          <div><StreamIcon icon="🔍" delay={260} /><p style={{ fontSize: 18, color: COLORS.textMuted, marginTop: 12 }}>精准洞察</p></div>
        </div>
      </div>
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40%', background: `linear-gradient(180deg, #10b98105 0%, transparent 100%)` }} />
    </AbsoluteFill>
  );
};

// 场景4: 销售获客流程 - 全屏 24-30秒 (帧720-900)
const Scene4 = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20, 150, 180], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ctaOpacity = interpolate(frame, [100, 130], [0, 1], { extrapolateLeft: 'clamp' });
  
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.background, opacity }}>
      <div style={{ 
        position: 'absolute', 
        left: 0, 
        top: 0, 
        bottom: 0, 
        width: '100%', 
        padding: '80px 120px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <p style={{ fontSize: 24, color: '#10b981', marginBottom: 20, letterSpacing: 6 }}>SCENE 04</p>
        <h2 style={{ fontSize: 84, fontWeight: 'bold', color: COLORS.text, marginBottom: 40 }}>
          <StreamText text="销售获客流程" delay={30} color="#10b981" size={84} />
        </h2>
        
        <div style={{ marginTop: 40 }}>
          <p style={{ fontSize: 32, color: COLORS.textMuted, marginBottom: 20 }}>
            <StreamText text="智能线索识别" delay={70} color="#10b981" size={32} />
          </p>
          <p style={{ fontSize: 32, color: COLORS.textMuted, marginBottom: 20 }}>
            <StreamText text="自动跟进转化" delay={100} color="#10b981" size={32} />
          </p>
          <p style={{ fontSize: 32, color: COLORS.textMuted, marginBottom: 20 }}>
            <StreamText text="精准营销触达" delay={130} color="#10b981" size={32} />
          </p>
        </div>

        <div style={{ display: 'flex', gap: 60, marginTop: 60 }}>
          <div><StreamIcon icon="🎯" delay={160} /><p style={{ fontSize: 20, color: COLORS.textMuted, marginTop: 16 }}>线索识别</p></div>
          <div><StreamIcon icon="🚀" delay={180} /><p style={{ fontSize: 20, color: COLORS.textMuted, marginTop: 16 }}>自动跟进</p></div>
          <div><StreamIcon icon="💰" delay={200} /><p style={{ fontSize: 20, color: COLORS.textMuted, marginTop: 16 }}>精准转化</p></div>
        </div>
      </div>
      
      {/* CTA */}
      <div style={{ position: 'absolute', bottom: 100, left: 0, right: 0, textAlign: 'center', opacity: ctaOpacity }}>
        <p style={{ fontSize: 72, fontWeight: 'bold', color: COLORS.primary, marginBottom: 20, textShadow: `0 0 60px ${COLORS.primary}` }}>让AI为你工作</p>
        <p style={{ fontSize: 40, color: COLORS.textMuted, letterSpacing: 8 }}>openclaw.ai</p>
      </div>
    </AbsoluteFill>
  );
};

// 背景音乐
const BackgroundMusic = () => (
  <Audio src={staticFile('bgm3.mp3')} volume={0.35} startFrom={0} />
);

const OpenClawPromo = () => (
  <>
    <BackgroundMusic />
    <Sequence from={0} duration={90}>
      <Opening />
    </Sequence>
    <Sequence from={90} duration={210}>
      <Scene1 />
    </Sequence>
    <Sequence from={300} duration={210}>
      <Scene2 />
    </Sequence>
    <Sequence from={510} duration={210}>
      <Scene3 />
    </Sequence>
    <Sequence from={720} duration={180}>
      <Scene4 />
    </Sequence>
  </>
);

registerRoot(() => (
  <Composition
    id="openclaw-promo"
    component={OpenClawPromo}
    durationInFrames={900}
    fps={30}
    width={1920}
    height={1080}
  />
));
