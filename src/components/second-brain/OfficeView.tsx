import type { AgentStatus, OfficeActivity, OfficeCollaboration, StatusStyle, TeamAgent } from "./types";

interface OfficeViewProps {
  teamAgents: TeamAgent[];
  isLoadingAgents: boolean;
  selectedOfficeAgentId: string;
  setSelectedOfficeAgentId: (id: string) => void;
  activeCollaborations: OfficeCollaboration[];
  officeActivities: OfficeActivity[];
  statusMap: Record<AgentStatus, StatusStyle>;
  getStatusStyle: (status: AgentStatus) => StatusStyle;
  formatRelativeTime: (value?: string | null) => string;
}

export function OfficeView({
  teamAgents,
  isLoadingAgents,
  selectedOfficeAgentId,
  setSelectedOfficeAgentId,
  activeCollaborations,
  officeActivities,
  statusMap,
  getStatusStyle,
  formatRelativeTime,
}: OfficeViewProps) {

    const svgWidth = 1280;
    const svgHeight = 760;

    const officeAgentThemes: Record<
      string,
      {
        surface: string;
        border: string;
        text: string;
        accent: string;
      }
    > = {
      chief: { surface: 'bg-violet-500/10', border: 'border-violet-400/30', text: 'text-violet-200', accent: '#8b5cf6' },
      content: { surface: 'bg-sky-500/10', border: 'border-sky-400/30', text: 'text-sky-200', accent: '#38bdf8' },
      growth: { surface: 'bg-emerald-500/10', border: 'border-emerald-400/30', text: 'text-emerald-200', accent: '#10b981' },
      coding: { surface: 'bg-cyan-500/10', border: 'border-cyan-400/30', text: 'text-cyan-200', accent: '#06b6d4' },
      product: { surface: 'bg-amber-500/10', border: 'border-amber-400/30', text: 'text-amber-200', accent: '#f59e0b' },
      finance: { surface: 'bg-lime-500/10', border: 'border-lime-400/30', text: 'text-lime-200', accent: '#84cc16' },
      abby: { surface: 'bg-rose-500/10', border: 'border-rose-400/30', text: 'text-rose-200', accent: '#f43f5e' },
    };

    type HairStyle = 'bun' | 'bob' | 'spiky' | 'side-part' | 'curly' | 'ponytail' | 'waves';
    type AvatarAccessory = 'tie' | 'scarf' | 'hoodie' | 'badge' | 'glasses' | 'apron' | 'headset';
    type OfficePose = 'desk' | 'walk' | 'sit' | 'meeting' | 'reception' | 'stand';

    interface AvatarProfile {
      hairStyle: HairStyle;
      hairColor: string;
      outfit: string;
      secondary: string;
      accent: string;
      accessory: AvatarAccessory;
      label: string;
    }

    interface OfficePlacement {
      zone: string;
      x: number;
      y: number;
      pose: OfficePose;
      onDesk?: boolean;
      collaborationId?: string;
    }

    interface DeskAnchor {
      ownerId: string;
      label: string;
      x: number;
      y: number;
    }

    interface SceneSpot {
      zone: string;
      x: number;
      y: number;
      pose: OfficePose;
    }

    const avatarProfiles: Record<string, AvatarProfile> = {
      chief: {
        hairStyle: 'bun',
        hairColor: '#312e81',
        outfit: '#7c3aed',
        secondary: '#a78bfa',
        accent: '#fbbf24',
        accessory: 'tie',
        label: 'Chief',
      },
      content: {
        hairStyle: 'bob',
        hairColor: '#082f49',
        outfit: '#0ea5e9',
        secondary: '#7dd3fc',
        accent: '#fda4af',
        accessory: 'scarf',
        label: 'Content',
      },
      growth: {
        hairStyle: 'waves',
        hairColor: '#14532d',
        outfit: '#10b981',
        secondary: '#6ee7b7',
        accent: '#fde68a',
        accessory: 'badge',
        label: 'Growth',
      },
      coding: {
        hairStyle: 'spiky',
        hairColor: '#083344',
        outfit: '#0891b2',
        secondary: '#67e8f9',
        accent: '#1e293b',
        accessory: 'hoodie',
        label: 'Coding',
      },
      product: {
        hairStyle: 'side-part',
        hairColor: '#78350f',
        outfit: '#f59e0b',
        secondary: '#fcd34d',
        accent: '#fb7185',
        accessory: 'glasses',
        label: 'Product',
      },
      finance: {
        hairStyle: 'ponytail',
        hairColor: '#365314',
        outfit: '#84cc16',
        secondary: '#bef264',
        accent: '#0f172a',
        accessory: 'headset',
        label: 'Finance',
      },
      abby: {
        hairStyle: 'curly',
        hairColor: '#4c0519',
        outfit: '#f43f5e',
        secondary: '#fda4af',
        accent: '#fde68a',
        accessory: 'apron',
        label: 'Abby',
      },
    };

    const deskAnchors: DeskAnchor[] = [
      { ownerId: 'chief', label: 'Desk A1', x: 780, y: 360 },
      { ownerId: 'content', label: 'Desk A2', x: 940, y: 360 },
      { ownerId: 'growth', label: 'Desk A3', x: 1100, y: 360 },
      { ownerId: 'coding', label: 'Desk B1', x: 780, y: 560 },
      { ownerId: 'product', label: 'Desk B2', x: 940, y: 560 },
      { ownerId: 'finance', label: 'Desk B3', x: 1100, y: 560 },
    ];

    const walkingSpots: SceneSpot[] = [
      { zone: 'Central Aisle · North Loop', x: 555, y: 360, pose: 'walk' },
      { zone: 'Central Aisle · South Loop', x: 585, y: 525, pose: 'walk' },
      { zone: 'Break Area · Walk Loop', x: 360, y: 430, pose: 'walk' },
      { zone: 'Break Area · Coffee Loop', x: 405, y: 555, pose: 'walk' },
      { zone: 'Print / Storage · Front Loop', x: 220, y: 235, pose: 'walk' },
      { zone: 'Print / Storage · Side Loop', x: 315, y: 220, pose: 'walk' },
    ];

    const restingSpots: SceneSpot[] = [
      { zone: 'Break Area · Sofa Left', x: 155, y: 474, pose: 'sit' },
      { zone: 'Break Area · Sofa Center', x: 235, y: 474, pose: 'sit' },
      { zone: 'Break Area · Sofa Right', x: 315, y: 474, pose: 'sit' },
      { zone: 'Break Area · Lounge Chair', x: 410, y: 520, pose: 'sit' },
    ];

    const fallbackSpots: SceneSpot[] = [
      { zone: 'Collab Corner', x: 650, y: 250, pose: 'stand' },
      { zone: 'Printer Area', x: 180, y: 205, pose: 'stand' },
    ];

    const meetingSeats: Record<'meeting-a' | 'meeting-b', SceneSpot[]> = {
      'meeting-b': [
        { zone: 'Meeting Room B · Small Table', x: 453, y: 190, pose: 'meeting' },
        { zone: 'Meeting Room B · Small Table', x: 657, y: 190, pose: 'meeting' },
        { zone: 'Meeting Room B · Small Table', x: 555, y: 118, pose: 'meeting' },
        { zone: 'Meeting Room B · Small Table', x: 555, y: 264, pose: 'meeting' },
      ],
      'meeting-a': [
        { zone: 'Meeting Room A · Big Table', x: 798, y: 188, pose: 'meeting' },
        { zone: 'Meeting Room A · Big Table', x: 858, y: 122, pose: 'meeting' },
        { zone: 'Meeting Room A · Big Table', x: 936, y: 102, pose: 'meeting' },
        { zone: 'Meeting Room A · Big Table', x: 1014, y: 122, pose: 'meeting' },
        { zone: 'Meeting Room A · Big Table', x: 1074, y: 188, pose: 'meeting' },
        { zone: 'Meeting Room A · Big Table', x: 936, y: 276, pose: 'meeting' },
      ],
    };

    const findOfficeAgent = (agentId: string) => teamAgents.find((agent) => agent.id === agentId);
    const deskAnchorByOwner = new Map(deskAnchors.map((anchor) => [anchor.ownerId, anchor]));

    const getOfficeStatusColor = (status: AgentStatus) => {
      switch (status) {
        case 'running':
          return '#4ade80';
        case 'ok':
          return '#34d399';
        case 'error':
          return '#f87171';
        case 'idle':
          return '#fde047';
        case 'external':
          return '#cbd5e1';
        default:
          return '#c084fc';
      }
    };

    const now = Date.now();
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const currentWalkPhase = Math.floor(now / 10000);
    const currentRestPhase = Math.floor(now / 30000);

    const getSlotIndex = (length: number, seed: number) => {
      if (!length) return 0;
      return ((seed % length) + length) % length;
    };

    const getIdleDurationMs = (agent: TeamAgent) => {
      const timestamp = agent.lastActiveAt ? new Date(agent.lastActiveAt).getTime() : Number.NaN;
      if (Number.isNaN(timestamp)) return Number.POSITIVE_INFINITY;
      return Math.max(now - timestamp, 0);
    };

    const officePlacementMap = new Map<string, OfficePlacement>();

    activeCollaborations.forEach((collaboration) => {
      const seats = meetingSeats[collaboration.room] || meetingSeats['meeting-b'];
      collaboration.agentIds.forEach((agentId, index) => {
        const agent = findOfficeAgent(agentId);
        if (!agent || agent.isExternal) return;

        const seat = seats[index % seats.length];
        officePlacementMap.set(agent.id, {
          ...seat,
          collaborationId: collaboration.id,
        });
      });
    });

    const unplacedAgents = teamAgents.filter((agent) => !officePlacementMap.has(agent.id));

    const walkingIdleAgents = unplacedAgents
      .filter((agent) => !agent.isExternal && agent.id !== 'abby' && (agent.status === 'idle' || agent.status === 'ok') && getIdleDurationMs(agent) < ONE_HOUR_MS)
      .sort((a, b) => a.id.localeCompare(b.id));

    const restingIdleAgents = unplacedAgents
      .filter((agent) => !agent.isExternal && agent.id !== 'abby' && (agent.status === 'idle' || agent.status === 'ok') && getIdleDurationMs(agent) >= ONE_HOUR_MS)
      .sort((a, b) => a.id.localeCompare(b.id));

    const walkingSpotByAgentId = new Map(
      walkingIdleAgents.map((agent, index) => [
        agent.id,
        walkingSpots[getSlotIndex(walkingSpots.length, index + currentWalkPhase)],
      ])
    );

    const restingSpotByAgentId = new Map(
      restingIdleAgents.map((agent, index) => [
        agent.id,
        restingSpots[getSlotIndex(restingSpots.length, index + currentRestPhase)],
      ])
    );

    let fallbackIndex = 0;

    teamAgents.forEach((agent) => {
      if (officePlacementMap.has(agent.id)) return;

      if (agent.id === 'abby') {
        officePlacementMap.set(agent.id, {
          zone: 'Entrance Reception · Front Desk',
          x: 205,
          y: 664,
          pose: 'reception',
        });
        return;
      }

      const deskAnchor = deskAnchorByOwner.get(agent.id);
      if (deskAnchor && ['running', 'error', 'loading'].includes(agent.status)) {
        officePlacementMap.set(agent.id, {
          zone: `Open Workspace · ${deskAnchor.label}`,
          x: deskAnchor.x,
          y: deskAnchor.y,
          pose: 'desk',
          onDesk: true,
        });
        return;
      }

      const walkingSpot = walkingSpotByAgentId.get(agent.id);
      if (walkingSpot) {
        officePlacementMap.set(agent.id, { ...walkingSpot });
        return;
      }

      const restingSpot = restingSpotByAgentId.get(agent.id);
      if (restingSpot) {
        officePlacementMap.set(agent.id, { ...restingSpot });
        return;
      }

      const fallback = fallbackSpots[fallbackIndex % fallbackSpots.length];
      fallbackIndex += 1;
      officePlacementMap.set(agent.id, { ...fallback });
    });

    const renderZoneLabel = (x: number, y: number, title: string, subtitle: string) => (
      <g transform={`translate(${x} ${y})`}>
        <rect x={0} y={0} width={132} height={42} rx={18} fill="rgba(12,14,18,0.88)" stroke="rgba(255,255,255,0.08)" />
        <text x={14} y={16} fill="#e2e8f0" fontSize="10" letterSpacing="2.8" fontWeight="700">
          {title}
        </text>
        <text x={14} y={30} fill="#71717a" fontSize="11">
          {subtitle}
        </text>
      </g>
    );

    const renderRollingChair = (x: number, y: number, rotate = 0, accent = '#cbd5e1', scale = 1) => (
      <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
        <ellipse cx="0" cy="22" rx="26" ry="7" fill="rgba(0,0,0,0.2)" />
        <rect x="-16" y="-22" width="32" height="22" rx="10" fill={accent} opacity="0.95" />
        <rect x="-12" y="-48" width="24" height="28" rx="9" fill={accent} opacity="0.82" />
        <rect x="-3.5" y="0" width="7" height="18" rx="3.5" fill="rgba(226,232,240,0.7)" />
        <line x1="0" y1="18" x2="-18" y2="30" stroke="rgba(226,232,240,0.7)" strokeWidth="4" strokeLinecap="round" />
        <line x1="0" y1="18" x2="18" y2="30" stroke="rgba(226,232,240,0.7)" strokeWidth="4" strokeLinecap="round" />
        <line x1="0" y1="18" x2="0" y2="34" stroke="rgba(226,232,240,0.7)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="-20" cy="31" r="4.5" fill="#0f172a" />
        <circle cx="20" cy="31" r="4.5" fill="#0f172a" />
        <circle cx="0" cy="35" r="4.5" fill="#0f172a" />
      </g>
    );

    const renderMeetingTable = (x: number, y: number, variant: 'small' | 'large') => {
      const width = variant === 'large' ? 248 : 176;
      const height = variant === 'large' ? 110 : 84;
      const chairOffsets =
        variant === 'large'
          ? [
              { x: -138, y: 0, r: -10 },
              { x: -78, y: -66, r: -30 },
              { x: 0, y: -86, r: 0 },
              { x: 78, y: -66, r: 30 },
              { x: 138, y: 0, r: 10 },
              { x: 0, y: 88, r: 180 },
            ]
          : [
              { x: -102, y: 0, r: -10 },
              { x: 0, y: -72, r: 0 },
              { x: 102, y: 0, r: 10 },
              { x: 0, y: 74, r: 180 },
            ];

      return (
        <g transform={`translate(${x} ${y})`}>
          <ellipse cx="0" cy="0" rx={width / 2 + 16} ry={height / 2 + 14} fill="rgba(0,0,0,0.14)" />
          {chairOffsets.map((chair, index) => (
            <g key={`${variant}-chair-${index}`} transform={`translate(${chair.x} ${chair.y}) rotate(${chair.r})`}>
              {renderRollingChair(0, 0, 0, '#dbeafe', variant === 'large' ? 0.72 : 0.62)}
            </g>
          ))}
          <ellipse cx="0" cy="8" rx={width / 2} ry={height / 2} fill="rgba(15,23,42,0.55)" />
          <ellipse cx="0" cy="0" rx={width / 2} ry={height / 2} fill="url(#meetingTableTop)" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
          <ellipse cx="0" cy="4" rx={width / 2 - 22} ry={height / 2 - 18} fill="rgba(255,255,255,0.05)" />
          <rect x="-10" y={height / 2 - 4} width="20" height="52" rx="10" fill="rgba(226,232,240,0.55)" />
          <ellipse cx="0" cy={height / 2 + 56} rx="66" ry="18" fill="rgba(148,163,184,0.38)" />
        </g>
      );
    };

    const renderSofa = () => (
      <g transform="translate(232 456)">
        <ellipse cx="0" cy="70" rx="150" ry="18" fill="rgba(0,0,0,0.18)" />
        <rect x="-118" y="-12" width="236" height="58" rx="24" fill="url(#sofaBase)" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
        <rect x="-128" y="-4" width="30" height="50" rx="14" fill="rgba(255,255,255,0.14)" />
        <rect x="98" y="-4" width="30" height="50" rx="14" fill="rgba(255,255,255,0.14)" />
        <rect x="-108" y="-50" width="216" height="44" rx="18" fill="rgba(255,255,255,0.1)" />
        <rect x="-103" y="2" width="64" height="30" rx="14" fill="rgba(255,255,255,0.08)" />
        <rect x="-30" y="2" width="60" height="30" rx="14" fill="rgba(255,255,255,0.08)" />
        <rect x="40" y="2" width="62" height="30" rx="14" fill="rgba(255,255,255,0.08)" />
      </g>
    );

    const renderCoffeeTable = () => (
      <g transform="translate(314 538)">
        <ellipse cx="0" cy="44" rx="60" ry="12" fill="rgba(0,0,0,0.16)" />
        <ellipse cx="0" cy="0" rx="72" ry="24" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
        <ellipse cx="0" cy="4" rx="60" ry="16" fill="rgba(255,255,255,0.05)" />
        <rect x="-6" y="12" width="12" height="28" rx="6" fill="rgba(226,232,240,0.55)" />
      </g>
    );

    const renderReceptionDesk = () => (
      <g transform="translate(238 666)">
        <ellipse cx="0" cy="40" rx="132" ry="16" fill="rgba(0,0,0,0.18)" />
        <path d="M -118 14 Q -96 -18 -20 -22 L 110 -16 Q 122 -14 122 -2 L 122 24 Q 122 38 104 40 L -104 40 Q -124 38 -124 22 Z" fill="url(#receptionDesk)" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
        <rect x="-60" y="-14" width="46" height="12" rx="6" fill="rgba(255,255,255,0.12)" />
        <rect x="0" y="-10" width="34" height="18" rx="6" fill="rgba(15,23,42,0.82)" />
      </g>
    );

    const renderPrinterArea = () => (
      <g>
        <g transform="translate(128 165)">
          <rect x="-58" y="-30" width="116" height="60" rx="18" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
          <rect x="-34" y="-42" width="56" height="24" rx="8" fill="rgba(15,23,42,0.88)" />
          <rect x="-28" y="-10" width="44" height="16" rx="6" fill="rgba(255,255,255,0.16)" />
          <rect x="-40" y="12" width="52" height="10" rx="5" fill="rgba(255,255,255,0.08)" />
        </g>
        <g transform="translate(222 148)">
          <rect x="-42" y="-24" width="84" height="108" rx="18" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
          <rect x="-22" y="0" width="44" height="12" rx="6" fill="rgba(250,204,21,0.16)" />
          <rect x="-22" y="24" width="44" height="12" rx="6" fill="rgba(56,189,248,0.18)" />
          <rect x="-22" y="48" width="44" height="12" rx="6" fill="rgba(196,181,253,0.2)" />
        </g>
      </g>
    );

    const renderHair = (profile: AvatarProfile, headY: number) => {
      switch (profile.hairStyle) {
        case 'bun':
          return (
            <g>
              <path d={`M -18 ${headY - 6} Q 0 ${headY - 26} 18 ${headY - 6} L 16 ${headY + 6} Q 0 ${headY - 2} -16 ${headY + 6} Z`} fill={profile.hairColor} />
              <circle cx="10" cy={headY - 18} r="6.5" fill={profile.hairColor} />
            </g>
          );
        case 'bob':
          return (
            <path d={`M -19 ${headY - 2} Q -14 ${headY - 24} 0 ${headY - 26} Q 16 ${headY - 24} 19 ${headY - 2} L 18 ${headY + 11} Q 0 ${headY + 18} -18 ${headY + 11} Z`} fill={profile.hairColor} />
          );
        case 'spiky':
          return (
            <polygon points={`-18,${headY - 3} -10,${headY - 25} -2,${headY - 12} 6,${headY - 28} 12,${headY - 10} 18,${headY - 4} 18,${headY + 8} -18,${headY + 8}`} fill={profile.hairColor} />
          );
        case 'side-part':
          return (
            <path d={`M -18 ${headY + 2} Q -12 ${headY - 24} 8 ${headY - 26} Q 20 ${headY - 22} 18 ${headY - 6} Q 7 ${headY - 12} -18 ${headY + 2} Z`} fill={profile.hairColor} />
          );
        case 'curly':
          return (
            <g fill={profile.hairColor}>
              <circle cx="-12" cy={headY - 10} r="8" />
              <circle cx="0" cy={headY - 18} r="10" />
              <circle cx="12" cy={headY - 10} r="8" />
              <circle cx="-6" cy={headY} r="9" />
              <circle cx="8" cy={headY + 2} r="8" />
            </g>
          );
        case 'ponytail':
          return (
            <g>
              <path d={`M -17 ${headY + 2} Q -12 ${headY - 24} 0 ${headY - 26} Q 15 ${headY - 24} 17 ${headY + 2} Z`} fill={profile.hairColor} />
              <path d={`M 14 ${headY - 6} Q 24 ${headY + 6} 12 ${headY + 16}`} fill="none" stroke={profile.hairColor} strokeWidth="8" strokeLinecap="round" />
            </g>
          );
        case 'waves':
          return (
            <path d={`M -19 ${headY - 1} Q -12 ${headY - 24} 0 ${headY - 24} Q 15 ${headY - 22} 19 ${headY - 2} Q 12 ${headY + 10} 4 ${headY + 12} Q -4 ${headY + 16} -19 ${headY + 8} Z`} fill={profile.hairColor} />
          );
        default:
          return null;
      }
    };

    const renderAccessory = (profile: AvatarProfile, bodyY: number) => {
      switch (profile.accessory) {
        case 'tie':
          return <path d={`M 0 ${bodyY + 6} L 4 ${bodyY + 16} L 0 ${bodyY + 31} L -4 ${bodyY + 16} Z`} fill={profile.accent} />;
        case 'scarf':
          return <path d={`M -14 ${bodyY + 8} Q 0 ${bodyY + 2} 14 ${bodyY + 8} L 10 ${bodyY + 12} Q 0 ${bodyY + 8} -10 ${bodyY + 12} Z`} fill={profile.accent} />;
        case 'hoodie':
          return <path d={`M -16 ${bodyY + 8} Q 0 ${bodyY - 8} 16 ${bodyY + 8}`} fill="none" stroke={profile.accent} strokeWidth="4" strokeLinecap="round" />;
        case 'badge':
          return <circle cx="10" cy={bodyY + 14} r="4" fill={profile.accent} />;
        case 'glasses':
          return (
            <g stroke="#1f2937" strokeWidth="2" fill="none">
              <circle cx="-7" cy="-40" r="5" />
              <circle cx="7" cy="-40" r="5" />
              <line x1="-2" y1="-40" x2="2" y2="-40" />
            </g>
          );
        case 'apron':
          return <rect x="-12" y={bodyY + 10} width="24" height="22" rx="8" fill={profile.accent} opacity="0.95" />;
        case 'headset':
          return (
            <g stroke={profile.accent} strokeWidth="2.5" fill="none" strokeLinecap="round">
              <path d="M -14 -40 Q 0 -54 14 -40" />
              <line x1="14" y1="-40" x2="14" y2="-31" />
              <circle cx="16" cy="-28" r="2" fill={profile.accent} stroke="none" />
            </g>
          );
        default:
          return null;
      }
    };

    const renderOfficeAvatar = (agent: TeamAgent, placement: OfficePlacement, scale = 1) => {
      const profile = avatarProfiles[agent.id] || avatarProfiles.chief;
      const theme = officeAgentThemes[agent.id] || officeAgentThemes.chief;
      const statusColor = getOfficeStatusColor(agent.status);
      const selected = selectedOfficeAgentId === agent.id;
      const seated = placement.pose === 'sit' || placement.pose === 'desk' || placement.pose === 'meeting';
      const walking = placement.pose === 'walk';
      const bodyY = seated ? -22 : -28;
      const bodyHeight = 42;
      const headY = seated ? -44 : -50;
      const animationClass =
        placement.pose === 'walk'
          ? 'office-anim-anchor animate-office-walk'
          : placement.pose === 'desk'
          ? 'office-anim-anchor animate-office-type'
          : placement.pose === 'meeting' || placement.pose === 'reception' || placement.pose === 'stand'
          ? 'office-anim-anchor animate-office-talk'
          : placement.pose === 'sit'
          ? 'office-anim-anchor animate-office-rest'
          : '';
      const chestLetter = (profile.label || agent.name).slice(0, 1).toUpperCase();

      return (
        <g
          transform={`translate(${placement.x} ${placement.y}) scale(${scale})`}
          className={animationClass}
          onClick={() => setSelectedOfficeAgentId(agent.id)}
          style={{ cursor: 'pointer' }}
        >
          {selected && <circle cx="0" cy="-18" r="38" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeDasharray="6 5" />}
          <ellipse cx="0" cy="16" rx="22" ry="7" fill="rgba(0,0,0,0.22)" />

          {renderHair(profile, headY)}
          <circle cx="0" cy={headY} r="14" fill="#fde7d3" />
          <circle cx="-5" cy={headY - 2} r="1.2" fill="#1f2937" />
          <circle cx="5" cy={headY - 2} r="1.2" fill="#1f2937" />
          <path d={`M -4 ${headY + 6} Q 0 ${headY + 9} 4 ${headY + 6}`} stroke="#b45309" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <rect x="-5" y={headY + 12} width="10" height="14" rx="5" fill="#f3d2b8" />
          <path
            d={`M -15 ${bodyY + 10} Q 0 ${bodyY - 2} 15 ${bodyY + 10} L 15 ${bodyY + 17} Q 0 ${bodyY + 7} -15 ${bodyY + 17} Z`}
            fill={profile.secondary}
            opacity="0.95"
          />
          <rect x="-17" y={bodyY} width="34" height={bodyHeight} rx="13" fill={profile.outfit} />
          <rect x="-17" y={bodyY + 22} width="34" height="10" rx="5" fill={profile.secondary} opacity="0.5" />
          {renderAccessory(profile, bodyY)}
          <text x="0" y={bodyY + 23} textAnchor="middle" fill="rgba(255,255,255,0.92)" fontSize="11" fontWeight="700">
            {chestLetter}
          </text>

          {seated ? (
            <g stroke="#1f2937" strokeWidth="4.5" strokeLinecap="round">
              <line x1="-8" y1={bodyY + 28} x2="-20" y2={bodyY + 18} />
              <line x1="8" y1={bodyY + 28} x2="20" y2={bodyY + 18} />
              <line x1="-20" y1={bodyY + 18} x2="-18" y2={bodyY + 34} />
              <line x1="20" y1={bodyY + 18} x2="18" y2={bodyY + 34} />
            </g>
          ) : walking ? (
            <g stroke="#1f2937" strokeWidth="4.5" strokeLinecap="round">
              <line x1="-12" y1={bodyY + 8} x2="-22" y2={bodyY + 20} />
              <line x1="12" y1={bodyY + 8} x2="24" y2={bodyY + 16} />
              <line x1="-6" y1={bodyY + 30} x2="-20" y2={bodyY + 48} />
              <line x1="6" y1={bodyY + 30} x2="18" y2={bodyY + 38} />
            </g>
          ) : (
            <g stroke="#1f2937" strokeWidth="4.5" strokeLinecap="round">
              <line x1="-14" y1={bodyY + 10} x2="-24" y2={bodyY + 22} />
              <line x1="14" y1={bodyY + 10} x2="24" y2={bodyY + 22} />
              <line x1="-6" y1={bodyY + 30} x2="-8" y2={bodyY + 48} />
              <line x1="6" y1={bodyY + 30} x2="8" y2={bodyY + 48} />
            </g>
          )}

          <circle cx="24" cy={headY - 8} r="5" fill={statusColor} stroke="rgba(255,255,255,0.9)" strokeWidth="2" />
          <g transform="translate(0 40)">
            <rect x="-30" y="0" width="60" height="16" rx="8" fill="rgba(15,23,42,0.82)" stroke={theme.accent} strokeWidth="1" />
            <text x="0" y="11" textAnchor="middle" fill="#f8fafc" fontSize="9.5" fontWeight="700">
              {profile.label}
            </text>
          </g>
        </g>
      );
    };

    const renderDeskUnit = (anchor: DeskAnchor) => {
      const owner = findOfficeAgent(anchor.ownerId);
      if (!owner) return null;

      const placement = officePlacementMap.get(anchor.ownerId);
      const theme = officeAgentThemes[anchor.ownerId] || officeAgentThemes.chief;
      const occupied = !!placement?.onDesk;
      const selected = selectedOfficeAgentId === anchor.ownerId;

      return (
        <g
          key={anchor.ownerId}
          transform={`translate(${anchor.x} ${anchor.y})`}
          onClick={() => setSelectedOfficeAgentId(anchor.ownerId)}
          style={{ cursor: 'pointer' }}
        >
          {selected && <rect x="-86" y="-94" width="172" height="152" rx="26" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="2.5" />}
          <ellipse cx="0" cy="58" rx="88" ry="18" fill="rgba(0,0,0,0.16)" />
          <rect x="-72" y="-34" width="144" height="18" rx="9" fill="rgba(148,163,184,0.48)" />
          <rect x="-76" y="-48" width="152" height="20" rx="10" fill="url(#deskTop)" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
          <rect x="-64" y="-46" width="128" height="10" rx="6" fill="rgba(255,255,255,0.06)" />
          <rect x="-58" y="-28" width="10" height="72" rx="5" fill="rgba(226,232,240,0.32)" />
          <rect x="48" y="-28" width="10" height="72" rx="5" fill="rgba(226,232,240,0.32)" />
          <rect x="-20" y="-88" width="40" height="28" rx="6" fill="rgba(15,23,42,0.88)" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
          <rect x="-8" y="-60" width="16" height="10" rx="4" fill="rgba(226,232,240,0.5)" />
          <rect x="-26" y="-16" width="52" height="6" rx="3" fill="rgba(226,232,240,0.45)" />
          {renderRollingChair(0, 28, 0, occupied ? '#93c5fd' : '#cbd5e1', 0.82)}

          <g transform="translate(-72 -84)">
            <rect x="0" y="0" width="46" height="16" rx="8" fill="rgba(15,23,42,0.76)" stroke={theme.accent} strokeWidth="1" />
            <text x="23" y="11" textAnchor="middle" fill="#f8fafc" fontSize="9" fontWeight="700">
              {anchor.label}
            </text>
          </g>

          {!occupied && (
            <g transform="translate(0 2)">
              <rect x="-24" y="-10" width="48" height="20" rx="10" fill="rgba(15,23,42,0.84)" stroke={theme.accent} strokeWidth="1" />
              <text x="0" y="4" textAnchor="middle" fill="#e2e8f0" fontSize="9.5" fontWeight="700">
                Away
              </text>
            </g>
          )}

          {occupied && placement && renderOfficeAvatar(owner, placement, 0.92)}
        </g>
      );
    };

    const selectedOfficeAgent = teamAgents.find((agent) => agent.id === selectedOfficeAgentId) ?? teamAgents[0];
    const selectedPlacement = officePlacementMap.get(selectedOfficeAgent?.id || 'chief');
    const selectedTheme = officeAgentThemes[selectedOfficeAgent?.id || 'chief'] || officeAgentThemes.chief;
    const selectedOfficeStatusStyle = selectedOfficeAgent ? getStatusStyle(selectedOfficeAgent.status) : statusMap.loading;

    const seatedDeskCount = Array.from(officePlacementMap.values()).filter((placement) => placement.onDesk).length;
    const walkingCount = Array.from(officePlacementMap.values()).filter((placement) => placement.pose === 'walk').length;
    const restingCount = Array.from(officePlacementMap.values()).filter((placement) => placement.pose === 'sit').length;
    const meetingCount = Array.from(officePlacementMap.values()).filter((placement) => placement.pose === 'meeting').length;
    const collaborationCount = activeCollaborations.length;

    const presenceCards = teamAgents.map((agent) => ({
      agent,
      placement: officePlacementMap.get(agent.id),
    }));

    return (
      <div className="p-6 lg:p-8 pb-12 animate-fadeIn">
        <div className="flex flex-col gap-4 mb-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <svg className="w-7 h-7 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 21h18" />
                <path d="M5 21V7l8-4v18" />
                <path d="M19 21V11l-6-4" />
                <path d="M9 9v.01" />
                <path d="M9 12v.01" />
                <path d="M9 15v.01" />
                <path d="M9 18v.01" />
              </svg>
              Second Brain Office
            </h2>
            <p className="text-sm text-[#71717a] mt-2 max-w-4xl leading-6">
Agent 现在会按实时状态自动换位：忙碌时回工位打字，空闲未满 1 小时会在办公室里走动，空闲超过 1 小时会去休息区；检测到协作会话时，会自动进入对应会议室。
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <div className="px-3 py-2 rounded-xl border border-[#27272a] bg-[#141416] text-[#a1a1aa]">Full Width Canvas</div>
            <div className="px-3 py-2 rounded-xl border border-[#27272a] bg-[#141416] text-[#a1a1aa]">SVG Furniture + Cartoon Agents</div>
            <div className="px-3 py-2 rounded-xl border border-green-500/20 bg-green-500/10 text-green-200">{walkingCount} walking · {restingCount} resting</div>
            <div className="px-3 py-2 rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-200">{meetingCount} in meetings · {collaborationCount} live collab</div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-[#27272a] bg-[#101012] p-4 sm:p-5 shadow-[0_24px_60px_rgba(0,0,0,0.32)]">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-semibold text-white">SVG Office Overview</h3>
                <p className="text-xs text-[#71717a] mt-1 leading-5">
                  用 SVG 重画了真实桌子、椭圆会议桌、三人沙发、茶几、带轮办公椅和差异化人物形象；现在会根据 idle 时长、running 状态和 live collaboration 自动切换位置。
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#71717a]">
                <span className={`w-2 h-2 rounded-full ${isLoadingAgents ? 'bg-purple-500' : 'bg-green-500'} ${isLoadingAgents ? '' : 'animate-pulse'}`}></span>
                <span>{isLoadingAgents ? '同步中' : '10 秒轮询更新'}</span>
              </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-[#1f1f22] bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.07),transparent_26%),linear-gradient(180deg,#0b0b0d_0%,#111216_100%)]">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto block">
                <defs>
                  <linearGradient id="deskTop" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#1f2937" />
                    <stop offset="100%" stopColor="#475569" />
                  </linearGradient>
                  <linearGradient id="meetingTableTop" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#475569" />
                    <stop offset="100%" stopColor="#1e293b" />
                  </linearGradient>
                  <linearGradient id="sofaBase" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>
                  <linearGradient id="receptionDesk" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#334155" />
                  </linearGradient>
                </defs>

                <rect x="24" y="24" width="1232" height="712" rx="34" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />
                <path d="M 506 120 L 640 120 L 640 642 L 506 642 Q 470 642 470 606 L 470 156 Q 470 120 506 120 Z" fill="rgba(255,255,255,0.018)" stroke="rgba(255,255,255,0.06)" strokeDasharray="10 12" />
                <path d="M 82 82 H 432 V 270 H 82 Z" fill="rgba(255,255,255,0.018)" stroke="rgba(255,255,255,0.05)" />
                <path d="M 710 82 H 1196 V 286 H 710 Z" fill="rgba(255,255,255,0.018)" stroke="rgba(255,255,255,0.05)" />

                {renderZoneLabel(78, 68, 'PRINT / STORAGE', '打印与储物')}
                {renderZoneLabel(462, 64, 'MEETING B', '小型讨论')}
                {renderZoneLabel(858, 64, 'MEETING A', '评审与会议')}
                {renderZoneLabel(112, 350, 'BREAK AREA', '沙发与咖啡')}
                {renderZoneLabel(486, 650, 'CENTRAL AISLE', '走动留白')}
                {renderZoneLabel(824, 294, 'OPEN WORKSPACE', '工作工位')}
                {renderZoneLabel(104, 622, 'RECEPTION', 'Abby 前台')}
                {renderZoneLabel(1108, 610, 'WC', '洗手间')}
                {renderZoneLabel(70, 606, 'ENTRANCE', '访客入口')}

                {renderPrinterArea()}
                {renderMeetingTable(555, 190, 'small')}
                {renderMeetingTable(936, 188, 'large')}
                {renderSofa()}
                {renderCoffeeTable()}
                {renderRollingChair(418, 524, -24, '#e2e8f0', 0.95)}
                <text x="430" y="474" fill="#fef3c7" fontSize="22">☕</text>
                <text x="378" y="424" fill="#86efac" fontSize="26">🌿</text>
                {renderReceptionDesk()}
                <path d="M 82 666 h 86" stroke="rgba(250,204,21,0.7)" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 8" />
                <path d="M 164 656 l 18 10 l -18 10" fill="none" stroke="rgba(250,204,21,0.7)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="1110" y="612" width="92" height="118" rx="24" fill="rgba(255,255,255,0.045)" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
                <rect x="1134" y="628" width="44" height="30" rx="12" fill="rgba(255,255,255,0.08)" />
                <ellipse cx="1156" cy="643" rx="16" ry="8" fill="#020617" />
                <rect x="1128" y="678" width="56" height="26" rx="12" fill="rgba(255,255,255,0.06)" />

                {deskAnchors.map((anchor) => renderDeskUnit(anchor))}

                {presenceCards
                  .filter(({ placement }) => placement && !placement.onDesk)
                  .map(({ agent, placement }) =>
                    placement ? <g key={`${agent.id}-presence`}>{renderOfficeAvatar(agent, placement, agent.id === 'abby' ? 1.06 : 1)}</g> : null
                  )}
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-[#27272a] bg-[#141416] p-4">
              <p className="text-xs text-[#71717a] mb-2">工位打字</p>
              <p className="text-2xl font-semibold text-white">{seatedDeskCount}/6</p>
              <p className="text-xs text-[#a1a1aa] mt-2">running / error / loading 的 Agent 会坐回工位并显示 typing 动画。</p>
            </div>
            <div className="rounded-2xl border border-[#27272a] bg-[#141416] p-4">
              <p className="text-xs text-[#71717a] mb-2">闲置走动</p>
              <p className="text-2xl font-semibold text-white">{walkingCount}</p>
              <p className="text-xs text-[#a1a1aa] mt-2">最后活跃时间距今少于 1 小时的 Agent 会在办公室里走动。</p>
            </div>
            <div className="rounded-2xl border border-[#27272a] bg-[#141416] p-4">
              <p className="text-xs text-[#71717a] mb-2">休息区落座</p>
              <p className="text-2xl font-semibold text-white">{restingCount}</p>
              <p className="text-xs text-[#a1a1aa] mt-2">超过 1 小时没有活跃的 Agent 会去沙发区休息。</p>
            </div>
            <div className="rounded-2xl border border-[#27272a] bg-[#141416] p-4">
              <p className="text-xs text-[#71717a] mb-2">会议协作</p>
              <p className="text-2xl font-semibold text-blue-300">{meetingCount}</p>
              <p className="text-xs text-[#a1a1aa] mt-2">2 人会去 Meeting B，3 人及以上会自动去 Meeting A。异常 Agent 仍会亮红灯留在工位。</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6 items-start">
            <div className={`rounded-3xl border overflow-hidden ${selectedTheme.border} bg-[#141416] shadow-[0_24px_60px_rgba(0,0,0,0.32)]`}>
              <div className="p-5 border-b border-[#27272a]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#71717a]">Selected Agent</p>
                    <h3 className="text-lg font-semibold text-white mt-2">{selectedOfficeAgent?.name || 'Agent'}</h3>
                    <p className="text-xs text-[#a1a1aa] mt-1">{selectedPlacement?.zone || 'Office floor'}</p>
                  </div>
                  <div className="shrink-0 rounded-2xl border border-white/10 bg-[#101012] px-3 py-2">
                    <div className={`text-xs ${selectedOfficeStatusStyle.color}`}>{selectedOfficeStatusStyle.icon} {selectedOfficeStatusStyle.label}</div>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="rounded-2xl border border-[#27272a] bg-[#101012] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#71717a] mb-2">Current Task</p>
                  <p className="text-sm text-[#e4e4e7] leading-6">{selectedOfficeAgent?.currentTask || '暂无任务信息'}</p>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4"><span className="text-[#71717a]">角色</span><span className="text-[#e4e4e7] text-right">{selectedOfficeAgent?.role || '-'}</span></div>
                  <div className="flex items-center justify-between gap-4"><span className="text-[#71717a]">最后活跃</span><span className="text-[#e4e4e7] text-right">{selectedOfficeAgent?.lastActive || '-'}</span></div>
                  <div className="flex items-center justify-between gap-4"><span className="text-[#71717a]">当前区域</span><span className="text-[#e4e4e7] text-right max-w-[58%]">{selectedPlacement?.zone || 'Office floor'}</span></div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl border border-[#27272a] bg-[#101012] p-3">
                    <div className="text-lg font-semibold text-white">{selectedOfficeAgent?.totalTasks || 0}</div>
                    <div className="text-[11px] text-[#71717a] mt-1">任务数</div>
                  </div>
                  <div className="rounded-2xl border border-[#27272a] bg-[#101012] p-3">
                    <div className="text-lg font-semibold text-green-300">{selectedOfficeAgent?.runningTasks || 0}</div>
                    <div className="text-[11px] text-[#71717a] mt-1">运行中</div>
                  </div>
                  <div className="rounded-2xl border border-[#27272a] bg-[#101012] p-3">
                    <div className="text-lg font-semibold text-red-300">{selectedOfficeAgent?.errorTasks || 0}</div>
                    <div className="text-[11px] text-[#71717a] mt-1">异常</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#27272a] bg-[#141416] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
              <div className="p-5 border-b border-[#27272a] flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">Live Activities</h3>
                  <p className="text-xs text-[#71717a] mt-1">根据状态变化自动生成，保留最近 18 条。</p>
                </div>
                <div className="text-right text-xs text-[#71717a]">
                  <div>{isLoadingAgents ? '同步中' : 'Auto Refresh'}</div>
                  <div className="mt-1">10 sec</div>
                </div>
              </div>

              <div className="max-h-[420px] overflow-auto divide-y divide-[#27272a]">
                {officeActivities.map((activity) => {
                  const activityStatusStyle = getStatusStyle(activity.status);
                  const activityTheme = officeAgentThemes[activity.agentId] || officeAgentThemes.chief;
                  return (
                    <div key={activity.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 shrink-0 rounded-2xl border flex items-center justify-center text-xl ${activityTheme.border} ${activityTheme.surface}`}>
                          {activity.agentIcon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-white truncate">{activity.agentName}</p>
                            <span className={`text-[11px] ${activityStatusStyle.color}`}>{formatRelativeTime(activity.timestamp)}</span>
                          </div>
                          <p className="text-sm text-[#cbd5e1] leading-6 mt-1">{activity.message}</p>
                          <div className="mt-2 flex items-center gap-2 text-[11px] text-[#71717a]">
                            <span>{activityStatusStyle.icon}</span>
                            <span>{activityStatusStyle.label}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-4 mb-3">
              <h3 className="text-lg font-semibold text-white">Agent Roster</h3>
              <p className="text-xs text-[#71717a]">列表已改成全宽，不再被右侧详情面板挤压。</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
              {presenceCards.map(({ agent, placement }) => {
                const theme = officeAgentThemes[agent.id] || officeAgentThemes.chief;
                const statusStyle = getStatusStyle(agent.status);
                const isSelected = selectedOfficeAgentId === agent.id;
                return (
                  <button
                    key={`presence-card-${agent.id}`}
                    type="button"
                    onClick={() => setSelectedOfficeAgentId(agent.id)}
                    className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                      isSelected ? `${theme.surface} ${theme.border} ring-2 ring-white/15` : 'border-[#27272a] bg-[#141416] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{agent.icon}</span>
                          <p className="text-sm font-medium text-white truncate">{agent.name}</p>
                        </div>
                        <p className="text-[11px] text-[#71717a] mt-2 truncate">{placement?.zone || agent.role}</p>
                      </div>
                      <span className={`text-[11px] shrink-0 ${statusStyle.color}`}>{statusStyle.icon} {statusStyle.label}</span>
                    </div>
                    <p className="text-[11px] text-[#a1a1aa] mt-3 line-clamp-2">{agent.currentTask}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );

}
