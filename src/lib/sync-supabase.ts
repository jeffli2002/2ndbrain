import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { supabaseAdmin as supabase } from './supabase';

const workspace = '/root/.openclaw/workspace';
const jobsPath = '/root/.openclaw/cron/jobs.json';

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

function msToIso(ms?: number | null): string | null {
  if (!ms) return null;
  return new Date(ms).toISOString();
}

function msToDuration(ms?: number | null): string | null {
  if (ms == null) return null;
  return `${Math.max(0, Math.round(ms / 1000))}s`;
}

export async function syncSecondBrainData() {
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

  const jobsByName = loadCronJobs();
  const existingTasksRes = await supabase.from('tasks').select('*');
  const existingTasks = Object.fromEntries((existingTasksRes.data || []).map((row: any) => [row.id, row]));

  const tasks = TASK_MAPPINGS.map((mapping) => {
    const job = jobsByName[mapping.job_name];
    const existing = existingTasks[mapping.task_id] || {};
    const latestRun = job ? getLatestRun(job.id) : null;
    const usage = latestRun?.usage || {};
    return {
      id: mapping.task_id,
      name: mapping.job_name,
      schedule: mapping.schedule,
      status: latestRun?.status || job?.state?.lastStatus || (job?.enabled === false ? 'disabled' : 'idle'),
      last_run: msToIso(latestRun?.runAtMs || job?.state?.lastRunAtMs),
      next_run: msToIso(latestRun?.nextRunAtMs || job?.state?.nextRunAtMs),
      last_duration: msToDuration(latestRun?.durationMs || job?.state?.lastDurationMs),
      error_count: job?.state?.consecutiveErrors ?? 0,
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
