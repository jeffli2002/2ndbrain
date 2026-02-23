import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://njxjuvxosvwvluxefrzg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qeGp1dnhvc3Z3dmx1eGVmcnpnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTgyOTI1NSwiZXhwIjoyMDg3NDA1MjU1fQ.hNxgmLO2OOG75jmRKcFmddDq0fF21C0Uqh8XFFqydDU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

import * as fs from 'fs';
import * as path from 'path';

function getFiles(dir: string, ext: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      files.push(...getFiles(p, ext));
    } else if (f.endsWith(ext)) {
      files.push(p);
    }
  });
  return files;
}

async function syncData() {
  console.log('Starting data sync...');
  
  const workspace = '/root/.openclaw/workspace';
  
  // 1. Sync Memories
  const memories: any[] = [];
  
  // MEMORY.md
  const memoryPath = path.join(workspace, 'MEMORY.md');
  if (fs.existsSync(memoryPath)) {
    const content = fs.readFileSync(memoryPath, 'utf-8');
    memories.push({
      id: 'mem-long-term',
      title: 'MEMORY.md - 长期记忆',
      content: content.substring(0, 5000),
      date: new Date().toISOString().split('T')[0],
      type: 'long-term'
    });
  }
  
  // Daily memory files
  const memoryDir = path.join(workspace, 'memory');
  const dailyFiles = getFiles(memoryDir, '.md').filter(f => f.includes('daily_report') || f.match(/\d{8}/));
  dailyFiles.forEach(f => {
    const content = fs.readFileSync(f, 'utf-8');
    const dateMatch = f.match(/(\d{8})/);
    const date = dateMatch ? dateMatch[1].replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : 'unknown';
    memories.push({
      id: `mem-${date}`,
      title: `工作日志 ${date}`,
      content: content.substring(0, 3000),
      date: date,
      type: 'daily'
    });
  });
  
  // 2. Sync Documents
  const docs: any[] = [];
  const docFiles = [
    { path: 'MEMORY.md', type: 'memory' },
    { path: 'ai-one-person-company-agent-architecture.md', type: 'plan' },
  ];
  
  docFiles.forEach(d => {
    const fullPath = path.join(workspace, d.path);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      docs.push({
        id: `doc-${d.path.replace('.md', '')}`,
        title: d.path,
        path: `/${workspace}/${d.path}`,
        type: d.type,
        date: stats.mtime.toISOString().split('T')[0],
        size: stats.size
      });
    }
  });
  
  // 3. Get current tasks from cron (mock - in real would query cron API)
  const tasks = [
    { id: 'task-ai-daily', name: 'ai-daily-newsletter', schedule: '7:30 每天', status: 'ok' },
    { id: 'task-content', name: 'daily-content-publish', schedule: '9:00 每天', status: 'ok' },
    { id: 'task-seo', name: 'growth-seo-keywords', schedule: '10:00 每天', status: 'ok' },
    { id: 'task-kol', name: 'ai-kol-daily', schedule: '11:00 每天', status: 'ok' },
    { id: 'task-chief', name: 'chief-daily-report', schedule: '19:30 每天', status: 'ok' },
    { id: 'task-evolution', name: 'daily-skill-evolution', schedule: '22:00 每天', status: 'ok' },
  ];
  
  // Upsert to Supabase
  const now = new Date().toISOString();
  
  if (memories.length > 0) {
    const { error } = await supabase.from('memories').upsert(memories.map(m => ({...m, updated_at: now})));
    console.log('Memories sync:', error ? error.message : 'OK');
  }
  
  if (docs.length > 0) {
    const { error } = await supabase.from('documents').upsert(docs.map(d => ({...d, updated_at: now})));
    console.log('Documents sync:', error ? error.message : 'OK');
  }
  
  // Update task status
  const { error: taskError } = await supabase.from('tasks').upsert(tasks.map(t => ({
    ...t,
    last_run: now,
    next_run: now,
    error_count: 0,
    updated_at: now
  })));
  console.log('Tasks sync:', taskError ? taskError.message : 'OK');
  
  console.log('Sync complete at', new Date().toISOString());
}

syncData().catch(console.error);
