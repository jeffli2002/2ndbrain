import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
  try {
    const workspace = '/root/.openclaw/workspace';
    const memories: any[] = [];
    const docs: any[] = [];
    const now = new Date().toISOString();

    // Read MEMORY.md
    const memoryPath = path.join(workspace, 'MEMORY.md');
    if (fs.existsSync(memoryPath)) {
      const content = fs.readFileSync(memoryPath, 'utf-8');
      memories.push({
        id: 'mem-long-term',
        title: 'MEMORY.md - 长期记忆',
        content: content.substring(0, 5000),
        date: now.split('T')[0],
        type: 'long-term'
      });
    }

    // Read daily memory files
    const memoryDir = path.join(workspace, 'memory');
    if (fs.existsSync(memoryDir)) {
      fs.readdirSync(memoryDir).forEach(f => {
        if (f.endsWith('.md')) {
          const content = fs.readFileSync(path.join(memoryDir, f), 'utf-8');
          const dateMatch = f.match(/(\d{8})/);
          const date = dateMatch ? dateMatch[1].replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : 'unknown';
          memories.push({
            id: `mem-${date}`,
            title: f.replace('.md', ''),
            content: content.substring(0, 3000),
            date: date,
            type: 'daily'
          });
        }
      });
    }

    // Sync memories
    if (memories.length > 0) {
      await supabaseAdmin.from('memories').upsert(memories.map(m => ({...m, updated_at: now})));
    }

    // Sync documents info
    const docFiles = ['MEMORY.md', 'ai-one-person-company-agent-architecture.md'];
    docFiles.forEach(f => {
      const fullPath = path.join(workspace, f);
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        docs.push({
          id: `doc-${f.replace('.md', '')}`,
          title: f,
          path: `/${workspace}/${f}`,
          type: f === 'MEMORY.md' ? 'memory' : 'plan',
          date: stats.mtime.toISOString().split('T')[0],
          size: stats.size
        });
      }
    });

    if (docs.length > 0) {
      await supabaseAdmin.from('documents').upsert(docs.map(d => ({...d, updated_at: now})));
    }

    return NextResponse.json({ 
      success: true, 
      message: `Synced ${memories.length} memories, ${docs.length} documents`,
      time: now
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
