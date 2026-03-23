import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { task_id, token_usage, duration } = body;

    if (!task_id || !token_usage) {
      return NextResponse.json(
        { error: 'Missing required fields: task_id, token_usage' },
        { status: 400 }
      );
    }

    // Update token_usage in Supabase
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update({ 
        token_usage: token_usage,
        last_duration: duration || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', task_id)
      .select();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      task_id,
      token_usage,
      message: 'Token usage updated successfully'
    });
  } catch (error) {
    console.error('Update token usage error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// GET method for simple testing
export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to update token usage',
    example: {
      task_id: 'task-ai-daily',
      token_usage: 150000,
      duration: '120s'
    }
  });
}
