import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { buildManualTaskRow, getManualTaskAgentId, normalizeAgentId, normalizeManualTaskStatus } from '@/lib/manual-tasks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('tasks').select('*').like('id', 'manual-%').order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      tasks: (data || []).map((task) => ({
        ...task,
        agentId: getManualTaskAgentId(task),
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const agentId = normalizeAgentId(body?.agentId);
    const title = String(body?.title || '').trim();
    const note = typeof body?.note === 'string' ? body.note.trim() : undefined;
    const status = normalizeManualTaskStatus(body?.status);

    if (!agentId) {
      return NextResponse.json({ error: 'Invalid agentId' }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const row = buildManualTaskRow({
      agentId,
      title,
      note,
      status,
      now: new Date().toISOString(),
    });

    const { data, error } = await supabase.from('tasks').upsert(row).select().single();
    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      task: {
        ...data,
        agentId,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = normalizeAgentId(searchParams.get('agentId'));
    if (!agentId) {
      return NextResponse.json({ error: 'Invalid agentId' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('tasks').delete().eq('id', `manual-${agentId}`);
    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, agentId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
