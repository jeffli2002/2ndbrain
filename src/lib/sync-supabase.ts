import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { getSupabaseAdmin } from './supabase';

const workspace = '/root/.openclaw/workspace';
const cronDir = '/root/.openclaw/cron';
const jobsPath = '/root/.openclaw/cron/jobs.json';
const runsDir = '/root/.openclaw/cron/runs';
const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000;

const TASK_MAPPINGS = [
  { task_id: 'task-ai-daily', job_name: 'ai-daily-newsletter', schedule: '07:30 每天' },
  { task_id: 'task-content-publish', job_name: 'daily-content-publish', schedule: '09:00 每天' },
  { task_id: 'task-kol', job_name: 'ai-kol-daily-newsletter', schedule: '11:00 每天' },
  { task_id: 'task-seo', job_name: 'openclaw-news-monitor', schedule: '每2小时' },
  { task_id: 'task-chief', job_name: 'chief-daily-report', schedule: '19:30 每天' },
  { task_id: 'task-evolution', job_name: 'daily-skill-evolution', schedule: '22:00 每天' },
  { task_id: 'task-product', job_name: 'product-competitor-analysis', schedule: '14:00 每天' },
  { task_id: 'task-health', job_name: 'cron-health-check', schedule: '每2小时' },
];

function getFiles(dir: string, ext: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  fs.readdirSync(dir).forEach((f) => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) files.push(...getFiles(p, ext));
    else if (f.endsWith(ext)) files.push(p);
  });
  return files;
}

function loadCronJobs(): Record<string, any> {
  if (!fs.existsSync(jobsPath)) return {};
  const raw = JSON.parse(fs.readFileSync(jobsPath, 'utf-8'));
  return Object.fromEntries((raw.jobs || []).map((job: any) => [job.name, job]));
}

function getLatestRun(jobId: string): any | null {
  try {
    const raw = execFileSync('openclaw', ['cron', 'runs', '--id', jobId, '--limit', '1'], {
      encoding: 'utf-8',
      timeout: 15000,
    });
    const payload = JSON.parse(raw || '{}');
    return payload.entries?.[0] || null;
  } catch {
    return null;
  }
}

function getJobIdsForName(jobName: string): string[] {
  const ids = new Set<string>();
  const files = fs.readdirSync(cronDir).filter((f) => f.startsWith('jobs.json'));
  for (const file of files) {
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(cronDir, file), 'utf-8'));
      for (const job of raw.jobs || []) {
        if (job.name === jobName && job.id) ids.add(job.id);
      }
    } catch {
      continue;
    }
  }
  return [...ids];
}

function readRunEntries(jobId: string): any[] {
  const runFile = path.join(runsDir, `${jobId}.jsonl`);
  if (!fs.existsSync(runFile)) return [];
  try {
    return fs
      .readFileSync(runFile, 'utf-8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .filter((entry) => entry.action === 'finished');
  } catch {
    return [];
  }
}

function getLatestHistoricalRun(jobName: string): any | null {
  let latest: any | null = null;
  for (const jobId of getJobIdsForName(jobName)) {
    for (const entry of readRunEntries(jobId)) {
      if (!latest || (entry.runAtMs || 0) > (latest.runAtMs || 0)) latest = entry;
    }
  }
  return latest;
}

function pickLatestRun(...runs: Array<any | null>): any | null {
  const candidates = runs.filter(Boolean);
  if (!candidates.length) return null;
  return candidates.sort((a, b) => ((b.runAtMs || 0) - (a.runAtMs || 0)) || ((b.ts || 0) - (a.ts || 0)))[0];
}

function msToIso(ms?: number | null): string | null {
  if (!ms) return null;
  return new Date(ms).toISOString();
}

function msToDuration(ms?: number | null): string | null {
  if (ms == null) return null;
  return `${Math.max(0, Math.round(ms / 1000))}s`;
}

function shanghaiDate(ms: number): string {
  return new Date(ms + SHANGHAI_OFFSET_MS).toISOString().slice(0, 10);
}

function buildHistoricalTokenSnapshots(now: string) {
  const byDate = new Map<string, { date: string; totalTokens: number; taskBreakdown: Record<string, number> }>();

  for (const mapping of TASK_MAPPINGS) {
    const seenRunKeys = new Set<string>();
    for (const jobId of getJobIdsForName(mapping.job_name)) {
      for (const entry of readRunEntries(jobId)) {
        const runAtMs = entry.runAtMs as number | undefined;
        const totalTokens = entry.usage?.total_tokens as number | undefined;
        if (!runAtMs || typeof totalTokens !== 'number') continue;

        const runKey = `${mapping.task_id}:${runAtMs}:${totalTokens}`;
        if (seenRunKeys.has(runKey)) continue;
        seenRunKeys.add(runKey);

        const date = shanghaiDate(runAtMs);
        const point = byDate.get(date) || { date, totalTokens: 0, taskBreakdown: {} };
        point.totalTokens += totalTokens;
        point.taskBreakdown[mapping.task_id] = (point.taskBreakdown[mapping.task_id] || 0) + totalTokens;
        byDate.set(date, point);
      }
    }
  }

  return [...byDate.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((point) => {
      const content = JSON.stringify({
        date: point.date,
        totalTokens: point.totalTokens,
        taskBreakdown: point.taskBreakdown,
      });

      return {
        id: `doc-token-daily-${point.date}`,
        title: `Token Daily Snapshot ${point.date}`,
        path: `/metrics/token-daily/${point.date}.json`,
        type: 'metric-token-daily',
        date: point.date,
        size: content.length,
        content,
        updated_at: now,
      };
    });
}

export async function syncSecondBrainData() {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const memories: any[] = [];
  const docs: any[] = [];

  const memoryPath = path.join(workspace, 'MEMORY.md');
  if (fs.existsSync(memoryPath)) {
    const content = fs.readFileSync(memoryPath, 'utf-8');
    memories.push({
      id: 'mem-long-term',
      title: 'MEMORY.md - 长期记忆',
      content: content.substring(0, 5000),
      date: now.split('T')[0],
      type: 'long-term',
    });
  }

  const dailyDir = path.join(workspace, 'memory', 'daily');
  if (fs.existsSync(dailyDir)) {
    const seen = new Set(['mem-long-term']);
    for (const f of getFiles(dailyDir, '.md')) {
      const filename = path.basename(f);
      if (filename.includes('report') || filename.includes('lessons') || filename.includes('morning')) continue;
      const content = fs.readFileSync(f, 'utf-8');
      const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? dateMatch[1] : 'unknown';
      const id = `mem-${path.basename(f, '.md')}`;
      if (seen.has(id)) continue;
      seen.add(id);
      memories.push({
        id,
        title: `工作日志 ${path.basename(f, '.md')}`,
        content: content.substring(0, 3000),
        date,
        type: 'daily',
      });
    }
  }

  const agentsDir = path.join(workspace, 'memory', 'agents');
  if (fs.existsSync(agentsDir)) {
    for (const agentName of fs.readdirSync(agentsDir)) {
      const agentPath = path.join(agentsDir, agentName);
      if (!fs.statSync(agentPath).isDirectory()) continue;
      for (const file of getFiles(agentPath, '.md')) {
        const filename = path.basename(file);
        const content = fs.readFileSync(file, 'utf-8');
        memories.push({
          id: `mem-${agentName}-${filename.replace('.md', '')}`,
          title: `${agentName} Agent - ${filename}`,
          content: content.substring(0, 3000),
          date: now.split('T')[0],
          type: `agent-${agentName}`,
        });
      }
    }
  }

  const docFiles = ['MEMORY.md', 'AGENTS.md', 'SOUL.md', 'USER.md', 'TOOLS.md', 'HEARTBEAT.md'];
  for (const file of docFiles) {
    const fullPath = path.join(workspace, file);
    if (!fs.existsSync(fullPath)) continue;
    const stats = fs.statSync(fullPath);
    docs.push({
      id: `doc-${file.replace('.md', '')}`,
      title: file,
      path: `/${workspace}/${file}`,
      type: 'config',
      date: new Date(stats.mtimeMs).toISOString().split('T')[0],
      size: stats.size,
    });
  }

  docs.push(...buildHistoricalTokenSnapshots(now));

  const jobsByName = loadCronJobs();
  const existingTasksRes = await supabase.from('tasks').select('*');
  const existingTasks = Object.fromEntries((existingTasksRes.data || []).map((row: any) => [row.id, row]));

  const tasks = TASK_MAPPINGS.map((mapping) => {
    const job = jobsByName[mapping.job_name];
    const existing = existingTasks[mapping.task_id] || {};
    const latestRun = pickLatestRun(job ? getLatestRun(job.id) : null, getLatestHistoricalRun(mapping.job_name));
    const usage = latestRun?.usage || {};
    return {
      id: mapping.task_id,
      name: mapping.job_name,
      schedule: mapping.schedule,
      status: latestRun?.status || job?.state?.lastStatus || (job?.enabled === false ? 'disabled' : existing.status || 'idle'),
      last_run: msToIso(latestRun?.runAtMs || job?.state?.lastRunAtMs) || existing.last_run || null,
      next_run: msToIso(job?.state?.nextRunAtMs) || existing.next_run || null,
      last_duration: msToDuration(latestRun?.durationMs || job?.state?.lastDurationMs) || existing.last_duration || null,
      error_count: job?.state?.consecutiveErrors ?? existing.error_count ?? 0,
      token_usage: usage.total_tokens ?? existing.token_usage ?? 0,
      updated_at: now,
    };
  });

  if (memories.length > 0) {
    await supabase.from('memories').upsert(memories.map((m) => ({ ...m, updated_at: now })));
  }
  if (docs.length > 0) {
    await supabase.from('documents').upsert(docs.map((d) => ({ ...d, updated_at: now })));
  }
  if (tasks.length > 0) {
    await supabase.from('tasks').upsert(tasks);
  }

  return { memories, docs, tasks, time: now };
}
