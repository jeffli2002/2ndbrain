export const CANONICAL_AGENT_IDS = ['chief', 'content', 'growth', 'coding', 'product', 'finance'] as const;

export type CanonicalAgentId = (typeof CANONICAL_AGENT_IDS)[number];
export type ManualTaskStatus = 'running' | 'ok' | 'error' | 'idle';

export type TaskLike = {
  id?: string;
  name?: string;
  schedule?: string | null;
  status?: string | null;
  last_run?: string | null;
  updated_at?: string | null;
  error_count?: number | null;
};

const MANUAL_TASK_PREFIX = 'manual-';

export function normalizeAgentId(value?: string | null): CanonicalAgentId | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === 'main') return 'chief';
  return CANONICAL_AGENT_IDS.includes(normalized as CanonicalAgentId) ? (normalized as CanonicalAgentId) : null;
}

export function getManualTaskAgentId(task?: TaskLike | null): CanonicalAgentId | null {
  const id = String(task?.id || '');
  if (!id.startsWith(MANUAL_TASK_PREFIX)) return null;
  return normalizeAgentId(id.slice(MANUAL_TASK_PREFIX.length));
}

export function isManualTaskRow(task?: TaskLike | null) {
  return Boolean(getManualTaskAgentId(task));
}

export function normalizeManualTaskStatus(status?: string | null): ManualTaskStatus {
  const normalized = status?.trim().toLowerCase();
  if (normalized === 'running') return 'running';
  if (normalized === 'ok') return 'ok';
  if (normalized === 'error') return 'error';
  return 'idle';
}

export function pickLatestIso(...values: Array<string | null | undefined>) {
  let latest: string | null = null;

  for (const value of values) {
    if (!value) continue;
    const current = new Date(value).getTime();
    if (Number.isNaN(current)) continue;
    if (!latest || current > new Date(latest).getTime()) {
      latest = value;
    }
  }

  return latest;
}

export function isoToTimestamp(value?: string | null) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function getManualTaskTitle(task?: TaskLike | null) {
  const title = task?.name?.trim();
  return title || null;
}

export function buildManualTaskRow(input: {
  agentId: CanonicalAgentId;
  title: string;
  status?: ManualTaskStatus;
  note?: string;
  now?: string;
}) {
  const now = input.now || new Date().toISOString();
  const title = input.title.trim();
  const note = input.note?.trim();
  const status = input.status || 'running';

  return {
    id: `${MANUAL_TASK_PREFIX}${input.agentId}`,
    name: title,
    schedule: note ? `manual · agent:${input.agentId} · ${note}` : `manual · agent:${input.agentId}`,
    status,
    last_run: now,
    next_run: null,
    last_duration: null,
    error_count: status === 'error' ? 1 : 0,
    token_usage: 0,
    updated_at: now,
  };
}
