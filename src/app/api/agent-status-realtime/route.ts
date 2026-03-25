import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://njxjuvxosvwvluxefrzg.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qeGp1dnhvc3Z3dmx1eGVmcnpnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTgyOTI1NSwiZXhwIjoyMDg3NDA1MjU1fQ.hNxgmLO2OOG75jmRKcFmddDq0fF21C0Uqh8XFFqydDU';

const CANONICAL_AGENTS = [
  { id: 'chief', name: 'Chief Agent' },
  { id: 'content', name: 'Content Agent' },
  { id: 'growth', name: 'Growth Agent' },
  { id: 'coding', name: 'Coding Agent' },
  { id: 'product', name: 'Product Agent' },
  { id: 'finance', name: 'Finance Agent' },
] as const;

const EXCLUDED_JOB_NAMES = new Set([
  'sync-agent-status',
]);

const USER_CHANNEL_SEGMENTS = new Set([
  'discord',
  'feishu',
  'googlechat',
  'imessage',
  'irc',
  'line',
  'signal',
  'slack',
  'telegram',
  'whatsapp',
]);

const ACTIVE_SESSION_WINDOW_MINUTES = 20;
const LAST_ACTIVE_LOOKBACK_MINUTES = 14 * 24 * 60;

type CanonicalAgentId = (typeof CANONICAL_AGENTS)[number]['id'];
type AggregatedAgentStatus = 'running' | 'ok' | 'error' | 'idle';

type OpenClawCronJob = {
  id: string;
  name?: string;
  description?: string;
  enabled?: boolean;
  agentId?: string;
  payload?: {
    message?: string;
    text?: string;
  };
  state?: {
    lastStatus?: string;
    lastRunStatus?: string;
    lastRunAtMs?: number;
    nextRunAtMs?: number;
    lastDurationMs?: number;
    consecutiveErrors?: number;
    lastError?: string;
  };
};

type OpenClawCronListResponse = {
  jobs?: OpenClawCronJob[];
};

type OpenClawSession = {
  key: string;
  agentId?: string;
  kind?: string;
  updatedAt?: number;
  ageMs?: number;
  sessionId?: string;
};

type OpenClawSessionsResponse = {
  sessions?: OpenClawSession[];
};

type LiveSessionSummary = {
  key: string;
  agentId: CanonicalAgentId;
  updatedAt?: number;
  ageMs?: number;
  isSubagent: boolean;
};

type AgentRecentActivity = {
  agentId: CanonicalAgentId;
  updatedAt: number;
  key: string;
};

type SupabaseTaskRow = {
  id?: string;
  name?: string;
  status?: string;
  last_run?: string | null;
  schedule?: string | null;
  error_count?: number | null;
  updated_at?: string | null;
};

function normalizeAgentId(value?: string | null): CanonicalAgentId | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;

  if (normalized === 'main') return 'chief';

  if (CANONICAL_AGENTS.some((agent) => agent.id === normalized)) {
    return normalized as CanonicalAgentId;
  }

  return null;
}

function extractJsonPayload<T>(raw: string): T {
  const jsonStart = raw.indexOf('{');
  const jsonEnd = raw.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) {
    throw new Error('OpenClaw CLI did not return JSON payload');
  }

  return JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as T;
}

function inferAgentId(job: OpenClawCronJob): CanonicalAgentId | null {
  const explicitAgentId = normalizeAgentId(job.agentId);
  if (explicitAgentId) return explicitAgentId;

  const searchText = [job.name, job.description, job.payload?.message, job.payload?.text]
    .filter((value): value is string => Boolean(value))
    .join('\n');

  const directMatch = searchText.match(/(?:归属Agent|目标Agent)[:：]\s*([a-z-]+)/i);
  if (directMatch) {
    const matchedAgentId = normalizeAgentId(directMatch[1]);
    if (matchedAgentId) return matchedAgentId;
  }

  const normalizedText = searchText.toLowerCase();
  const patternMap: Array<{ agentId: CanonicalAgentId; patterns: string[] }> = [
    { agentId: 'chief', patterns: ['chief agent', '目标agent：main', '归属agent：main', '目标agent：chief', '归属agent：chief'] },
    { agentId: 'content', patterns: ['content agent', '目标agent：content', '归属agent：content'] },
    { agentId: 'growth', patterns: ['growth agent', '目标agent：growth', '归属agent：growth'] },
    { agentId: 'coding', patterns: ['coding agent', '目标agent：coding', '归属agent：coding'] },
    { agentId: 'product', patterns: ['product agent', '目标agent：product', '归属agent：product'] },
    { agentId: 'finance', patterns: ['finance agent', '目标agent：finance', '归属agent：finance'] },
  ];

  for (const candidate of patternMap) {
    if (candidate.patterns.some((pattern) => normalizedText.includes(pattern))) {
      return candidate.agentId;
    }
  }

  return null;
}

function normalizeJobStatus(job: OpenClawCronJob): AggregatedAgentStatus {
  if (job.enabled === false) {
    return 'idle';
  }

  const normalizedStatus = (job.state?.lastStatus || job.state?.lastRunStatus || '').trim().toLowerCase();

  if (['running', 'busy', 'working', 'queued', 'started', 'in-progress'].includes(normalizedStatus)) {
    return 'running';
  }

  if (['error', 'failed', 'timeout', 'timed-out', 'cancelled'].includes(normalizedStatus)) {
    return 'error';
  }

  if (['ok', 'success', 'succeeded', 'completed', 'finished'].includes(normalizedStatus)) {
    return 'ok';
  }

  return 'idle';
}

function normalizeSupabaseStatus(status?: string | null): AggregatedAgentStatus {
  const normalized = status?.trim().toLowerCase();

  if (['running', 'busy', 'working', 'queued', 'started', 'in-progress'].includes(normalized || '')) {
    return 'running';
  }

  if (['error', 'failed', 'timeout', 'timed-out', 'cancelled'].includes(normalized || '')) {
    return 'error';
  }

  if (['ok', 'success', 'succeeded', 'completed', 'finished'].includes(normalized || '')) {
    return 'ok';
  }

  return 'idle';
}

function isCronSession(session: OpenClawSession) {
  return session.key.includes(':cron:');
}

function isUserFacingSession(session: OpenClawSession) {
  if (session.kind === 'group') return true;

  return session.key
    .split(':')
    .some((segment) => USER_CHANNEL_SEGMENTS.has(segment));
}

function isRootSelfSession(session: OpenClawSession) {
  const parts = session.key.split(':');
  return parts.length === 3 && parts[0] === 'agent' && parts[1] === parts[2];
}

function isLikelySubagentSession(session: OpenClawSession) {
  return session.key.includes('subagent') || session.key.includes(':worker:') || session.key.includes(':delegate:');
}

function toRecentActivity(session: OpenClawSession): AgentRecentActivity | null {
  const agentId = normalizeAgentId(session.agentId);
  if (!agentId) return null;
  if (isCronSession(session)) return null;
  if (!session.updatedAt) return null;

  return {
    agentId,
    updatedAt: session.updatedAt,
    key: session.key,
  };
}

function toLiveSessionSummary(session: OpenClawSession): LiveSessionSummary | null {
  const agentId = normalizeAgentId(session.agentId);
  if (!agentId) return null;
  if (isCronSession(session)) return null;
  if (isUserFacingSession(session)) return null;
  if (isRootSelfSession(session)) return null;

  return {
    key: session.key,
    agentId,
    updatedAt: session.updatedAt,
    ageMs: session.ageMs,
    isSubagent: isLikelySubagentSession(session),
  };
}

function dedupeLiveSessionsByAgent(sessions: LiveSessionSummary[]) {
  const byAgent = new Map<CanonicalAgentId, LiveSessionSummary>();

  sessions
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .forEach((session) => {
      if (!byAgent.has(session.agentId)) {
        byAgent.set(session.agentId, session);
      }
    });

  return [...byAgent.values()];
}

function buildActiveCollaborations(activeSessions: LiveSessionSummary[], detectedFrom = 'openclaw-sessions-realtime') {
  const uniqueAgentIds = [...new Set(activeSessions.map((session) => session.agentId))];
  if (uniqueAgentIds.length < 2) return [];

  const room = uniqueAgentIds.length >= 3 ? 'meeting-a' : 'meeting-b';
  const roomName = room === 'meeting-a' ? 'Meeting Room A · 大会议室' : 'Meeting Room B · 小会议室';
  const agentNames = uniqueAgentIds.map((agentId) => {
    const agent = CANONICAL_AGENTS.find((candidate) => candidate.id === agentId);
    return agent?.name.replace(/ Agent$/, '') || agentId;
  });
  const latestUpdatedAt = activeSessions.reduce((latest, session) => {
    const current = session.updatedAt || 0;
    return current > latest ? current : latest;
  }, 0);

  return [
    {
      id: `live-collab-${uniqueAgentIds.join('-')}`,
      room,
      roomName,
      agentIds: uniqueAgentIds,
      label: uniqueAgentIds.length >= 3
        ? `${agentNames.join(' / ')} 正在多人协作`
        : `${agentNames.join(' / ')} 正在协作`,
      lastUpdatedAt: new Date(latestUpdatedAt || Date.now()).toISOString(),
      sessionKeys: activeSessions.map((session) => session.key),
      detectedFrom,
    },
  ];
}

function detectAgentFromName(name?: string | null): CanonicalAgentId | null {
  const nameLower = name?.toLowerCase() || '';
  if (!nameLower) return null;

  if (nameLower.includes('content') || nameLower.includes('newsletter') || nameLower.includes('daily-content')) return 'content';
  if (nameLower.includes('growth') || nameLower.includes('seo') || nameLower.includes('marketing') || nameLower.includes('openclaw-news')) return 'growth';
  if (nameLower.includes('coding') || nameLower.includes('github') || nameLower.includes('sync-') || nameLower.includes('skill-evolution') || nameLower.includes('backup')) return 'coding';
  if (nameLower.includes('product') || nameLower.includes('competitor')) return 'product';
  if (nameLower.includes('finance') || nameLower.includes('financial') || nameLower.includes('trustmrr')) return 'finance';
  if (nameLower.includes('chief') || nameLower.includes('health') || nameLower.includes('memory') || nameLower.includes('report') || nameLower.includes('delivery')) return 'chief';

  return null;
}

function parseTaskCountFromSchedule(value?: string | null) {
  const match = value?.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function isAggregatedAgentRow(task: SupabaseTaskRow, agentId: CanonicalAgentId) {
  return task.id === `agent-${agentId}` || task.name === CANONICAL_AGENTS.find((agent) => agent.id === agentId)?.name;
}

async function fetchSupabaseTasks(): Promise<SupabaseTaskRow[]> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/tasks?select=id,name,status,last_run,schedule,error_count,updated_at`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Supabase tasks fetch failed: HTTP ${response.status}`);
  }

  return (await response.json()) as SupabaseTaskRow[];
}

function buildSupabaseFallback(tasks: SupabaseTaskRow[]) {
  const aggregatedRows = CANONICAL_AGENTS.map((agent) => tasks.find((task) => isAggregatedAgentRow(task, agent.id))).filter(Boolean) as SupabaseTaskRow[];
  const hasAggregatedRows = aggregatedRows.length > 0;

  const agents = CANONICAL_AGENTS.map((agent) => {
    const aggregatedRow = tasks.find((task) => isAggregatedAgentRow(task, agent.id));
    if (aggregatedRow) {
      const rawStatus = normalizeSupabaseStatus(aggregatedRow.status);
      const taskCount = parseTaskCountFromSchedule(aggregatedRow.schedule);
      const failedTasks = Math.max(aggregatedRow.error_count || 0, 0);
      const lastActiveAt = aggregatedRow.updated_at || aggregatedRow.last_run || null;
      const lastActiveMs = lastActiveAt ? new Date(lastActiveAt).getTime() : 0;
      const staleRunning = rawStatus === 'running' && lastActiveMs > 0 && Date.now() - lastActiveMs > ACTIVE_SESSION_WINDOW_MINUTES * 60 * 1000;
      const status = staleRunning ? (taskCount > 0 ? 'ok' : 'idle') : rawStatus;
      const runningTasks = status === 'running' ? 1 : 0;
      const completedTasks = Math.max(taskCount - failedTasks - runningTasks, 0);

      return {
        id: agent.id,
        name: agent.name,
        status,
        tasks: taskCount,
        completedTasks,
        failedTasks,
        runningTasks,
        idleTasks: Math.max(taskCount - completedTasks - failedTasks - runningTasks, 0),
        lastRun: aggregatedRow.last_run || null,
        lastActiveAt,
      };
    }

    const rawAgentTasks = tasks.filter((task) => !String(task.id || '').startsWith('agent-') && detectAgentFromName(task.name) === agent.id);
    const runningTasks = rawAgentTasks.filter((task) => normalizeSupabaseStatus(task.status) === 'running').length;
    const failedTasks = rawAgentTasks.filter((task) => normalizeSupabaseStatus(task.status) === 'error').length;
    const completedTasks = rawAgentTasks.filter((task) => normalizeSupabaseStatus(task.status) === 'ok').length;
    const lastRun = rawAgentTasks.reduce<string | null>((latest, task) => {
      if (!task.last_run) return latest;
      if (!latest) return task.last_run;
      return new Date(task.last_run).getTime() > new Date(latest).getTime() ? task.last_run : latest;
    }, null);
    const lastActiveAt = rawAgentTasks.reduce<string | null>((latest, task) => {
      const current = task.updated_at || task.last_run;
      if (!current) return latest;
      if (!latest) return current;
      return new Date(current).getTime() > new Date(latest).getTime() ? current : latest;
    }, null);

    let status: AggregatedAgentStatus = 'idle';
    if (runningTasks > 0) status = 'running';
    else if (failedTasks > 0) status = 'error';
    else if (completedTasks > 0) status = 'ok';

    return {
      id: agent.id,
      name: agent.name,
      status,
      tasks: rawAgentTasks.length,
      completedTasks,
      failedTasks,
      runningTasks,
      idleTasks: Math.max(rawAgentTasks.length - completedTasks - failedTasks - runningTasks, 0),
      lastRun,
      lastActiveAt,
    };
  });

  const activeSessions = agents
    .filter((agent) => agent.status === 'running')
    .map((agent) => ({
      key: `supabase:agent:${agent.id}`,
      agentId: agent.id,
      updatedAt: (agent.lastActiveAt || agent.lastRun) ? new Date((agent.lastActiveAt || agent.lastRun) as string).getTime() : Date.now(),
      ageMs: (agent.lastActiveAt || agent.lastRun) ? Math.max(Date.now() - new Date((agent.lastActiveAt || agent.lastRun) as string).getTime(), 0) : 0,
      isSubagent: false,
    }));

  return {
    timestamp: new Date().toISOString(),
    source: hasAggregatedRows ? 'supabase-agent-sync-fallback' : 'supabase-task-fallback',
    agents,
    activeSessions,
    activeCollaborations: buildActiveCollaborations(activeSessions as LiveSessionSummary[], hasAggregatedRows ? 'supabase-agent-sync' : 'supabase-task-inference'),
  };
}

async function loadOpenClawCronJobs(): Promise<OpenClawCronJob[]> {
  const { stdout } = await execFileAsync('openclaw', ['cron', 'list', '--json', '--all'], {
    timeout: 30_000,
    maxBuffer: 8 * 1024 * 1024,
    env: process.env,
  });

  const payload = extractJsonPayload<OpenClawCronListResponse>(stdout);
  return (payload.jobs || []).filter((job) => !EXCLUDED_JOB_NAMES.has(job.name || ''));
}

async function loadOpenClawActiveSessions(): Promise<LiveSessionSummary[]> {
  const { stdout } = await execFileAsync(
    'openclaw',
    ['sessions', '--json', '--all-agents', '--active', String(ACTIVE_SESSION_WINDOW_MINUTES)],
    {
      timeout: 30_000,
      maxBuffer: 8 * 1024 * 1024,
      env: process.env,
    }
  );

  const payload = extractJsonPayload<OpenClawSessionsResponse>(stdout);
  const liveSessions = (payload.sessions || [])
    .map((session) => toLiveSessionSummary(session))
    .filter((session): session is LiveSessionSummary => Boolean(session));

  return dedupeLiveSessionsByAgent(liveSessions);
}

async function loadOpenClawRecentActivityByAgent(): Promise<Map<CanonicalAgentId, AgentRecentActivity>> {
  const { stdout } = await execFileAsync(
    'openclaw',
    ['sessions', '--json', '--all-agents', '--active', String(LAST_ACTIVE_LOOKBACK_MINUTES)],
    {
      timeout: 30_000,
      maxBuffer: 8 * 1024 * 1024,
      env: process.env,
    }
  );

  const payload = extractJsonPayload<OpenClawSessionsResponse>(stdout);
  const byAgent = new Map<CanonicalAgentId, AgentRecentActivity>();

  (payload.sessions || [])
    .map((session) => toRecentActivity(session))
    .filter((session): session is AgentRecentActivity => Boolean(session))
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .forEach((session) => {
      if (!byAgent.has(session.agentId)) {
        byAgent.set(session.agentId, session);
      }
    });

  return byAgent;
}

export async function GET() {
  try {
    const [jobs, activeSessions, recentActivityByAgent] = await Promise.all([
      loadOpenClawCronJobs(),
      loadOpenClawActiveSessions(),
      loadOpenClawRecentActivityByAgent(),
    ]);
    const activeCollaborations = buildActiveCollaborations(activeSessions);

    const agents = CANONICAL_AGENTS.map((agent) => {
      const agentJobs = jobs.filter((job) => inferAgentId(job) === agent.id);
      const completedTasks = agentJobs.filter((job) => normalizeJobStatus(job) === 'ok').length;
      const failedTasks = agentJobs.filter((job) => normalizeJobStatus(job) === 'error').length;
      const runningTasks = agentJobs.filter((job) => normalizeJobStatus(job) === 'running').length;
      const idleTasks = Math.max(agentJobs.length - completedTasks - failedTasks - runningTasks, 0);
      const lastRunAtMs = agentJobs.reduce<number | null>((latest, job) => {
        const current = job.state?.lastRunAtMs;
        if (!current) return latest;
        if (!latest || current > latest) return current;
        return latest;
      }, null);

      const recentActivityAtMs = recentActivityByAgent.get(agent.id)?.updatedAt || null;
      const lastActiveAtMs = Math.max(lastRunAtMs || 0, recentActivityAtMs || 0) || null;

      let status: AggregatedAgentStatus = 'idle';
      if (runningTasks > 0) status = 'running';
      else if (failedTasks > 0) status = 'error';
      else if (completedTasks > 0) status = 'ok';

      return {
        id: agent.id,
        name: agent.name,
        status,
        tasks: agentJobs.length,
        completedTasks,
        failedTasks,
        runningTasks,
        idleTasks,
        lastRun: lastRunAtMs ? new Date(lastRunAtMs).toISOString() : null,
        lastActiveAt: lastActiveAtMs ? new Date(lastActiveAtMs).toISOString() : null,
      };
    });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      source: 'openclaw-cron+sessions-realtime',
      agents,
      activeSessions,
      activeCollaborations,
    });
  } catch (openClawError) {
    console.warn('OpenClaw realtime unavailable, falling back to Supabase sync:', openClawError);

    try {
      const supabaseTasks = await fetchSupabaseTasks();
      return NextResponse.json(buildSupabaseFallback(supabaseTasks));
    } catch (fallbackError) {
      console.error('Error fetching real-time agent status from OpenClaw and Supabase fallback:', fallbackError);

      return NextResponse.json({
        timestamp: new Date().toISOString(),
        source: 'error',
        agents: CANONICAL_AGENTS.map((agent) => ({
          id: agent.id,
          name: agent.name,
          status: 'idle' as const,
          tasks: 0,
          completedTasks: 0,
          failedTasks: 0,
          runningTasks: 0,
          idleTasks: 0,
          lastRun: null,
          lastActiveAt: null,
        })),
        activeSessions: [],
        activeCollaborations: [],
        error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error',
      });
    }
  }
}
