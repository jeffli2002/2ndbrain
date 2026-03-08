import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { getSupabaseAdmin } from '@/lib/supabase';

const CRON_DIR = '/root/.openclaw/cron';
const RUNS_DIR = '/root/.openclaw/cron/runs';
const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000;

const TASK_MAPPINGS = [
  { taskId: 'task-ai-daily', jobName: 'ai-daily-newsletter', label: 'AI日报' },
  { taskId: 'task-content-publish', jobName: 'daily-content-publish', label: '内容发布' },
  { taskId: 'task-kol', jobName: 'ai-kol-daily-newsletter', label: 'KOL日报' },
  { taskId: 'task-seo', jobName: 'openclaw-news-monitor', label: 'OpenClaw监控' },
  { taskId: 'task-chief', jobName: 'chief-daily-report', label: 'Chief工作总结' },
  { taskId: 'task-evolution', jobName: 'daily-skill-evolution', label: 'EvoMap进化报告' },
  { taskId: 'task-product', jobName: 'product-competitor-analysis', label: '竞品分析' },
  { taskId: 'task-health', jobName: 'cron-health-check', label: 'Cron巡检' },
];

type TrendPoint = {
  date: string;
  totalTokens: number;
  taskBreakdown: Record<string, number>;
};

function shanghaiDate(ms: number): string {
  return new Date(ms + SHANGHAI_OFFSET_MS).toISOString().slice(0, 10);
}

function listJobSnapshotFiles(): string[] {
  if (!fs.existsSync(CRON_DIR)) return [];
  return fs
    .readdirSync(CRON_DIR)
    .filter((name) => name.startsWith('jobs.json'))
    .map((name) => path.join(CRON_DIR, name));
}

function getJobIdsForName(jobName: string): string[] {
  const ids = new Set<string>();
  for (const filePath of listJobSnapshotFiles()) {
    try {
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
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
  const runFile = path.join(RUNS_DIR, `${jobId}.jsonl`);
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

function buildTrend(): TrendPoint[] {
  const byDate = new Map<string, TrendPoint>();

  for (const task of TASK_MAPPINGS) {
    const seenRunKeys = new Set<string>();
    for (const jobId of getJobIdsForName(task.jobName)) {
      for (const entry of readRunEntries(jobId)) {
        const runAtMs = entry.runAtMs as number | undefined;
        const totalTokens = entry.usage?.total_tokens as number | undefined;
        if (!runAtMs || typeof totalTokens !== 'number') continue;

        const runKey = `${task.taskId}:${runAtMs}:${totalTokens}`;
        if (seenRunKeys.has(runKey)) continue;
        seenRunKeys.add(runKey);

        const date = shanghaiDate(runAtMs);
        const point = byDate.get(date) || { date, totalTokens: 0, taskBreakdown: {} };
        point.totalTokens += totalTokens;
        point.taskBreakdown[task.taskId] = (point.taskBreakdown[task.taskId] || 0) + totalTokens;
        byDate.set(date, point);
      }
    }
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

async function buildTrendFromSupabaseHistory(): Promise<TrendPoint[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('documents')
    .select('date, content')
    .eq('type', 'metric-token-daily')
    .order('date', { ascending: true });

  if (error) {
    throw error;
  }

  if (!data?.length) return [];

  return data
    .map((row) => {
      try {
        const payload = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
        return {
          date: String(payload?.date || row.date),
          totalTokens: Number(payload?.totalTokens || 0),
          taskBreakdown: (payload?.taskBreakdown || {}) as Record<string, number>,
        } satisfies TrendPoint;
      } catch {
        return null;
      }
    })
    .filter((point): point is TrendPoint => !!point)
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function buildTrendFromSupabaseSnapshot(): Promise<TrendPoint[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('tasks')
    .select('id, token_usage, updated_at');

  if (error) {
    throw error;
  }

  if (!data?.length) return [];

  const byDate = new Map<string, TrendPoint>();

  for (const row of data) {
    const taskId = row.id as string | undefined;
    const totalTokens = Number(row.token_usage || 0);
    const updatedAt = row.updated_at ? new Date(row.updated_at).getTime() : Date.now();
    if (!taskId) continue;

    const date = shanghaiDate(updatedAt);
    const point = byDate.get(date) || { date, totalTokens: 0, taskBreakdown: {} };
    point.totalTokens += totalTokens;
    point.taskBreakdown[taskId] = totalTokens;
    byDate.set(date, point);
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export async function GET() {
  try {
    const localTrend = buildTrend();
    let trend = localTrend;
    let source: 'cron-runs' | 'supabase-history' | 'supabase-snapshot' = 'cron-runs';

    if (!trend.length) {
      trend = await buildTrendFromSupabaseHistory();
      source = 'supabase-history';
    }

    if (!trend.length) {
      trend = await buildTrendFromSupabaseSnapshot();
      source = 'supabase-snapshot';
    }

    const latest14 = trend.slice(-14);
    const totalTokens = trend.reduce((sum, point) => sum + point.totalTokens, 0);

    return NextResponse.json({
      success: true,
      trend,
      latest14,
      totalTokens,
      taskMeta: TASK_MAPPINGS,
      source,
    });
  } catch (error) {
    console.error('token-trend error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
