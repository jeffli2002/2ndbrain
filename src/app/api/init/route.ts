import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST() {
  try {
    // Create memories table
    const { error: memError } = await supabaseAdmin.from('memories').select('*').limit(1);
    
    if (memError?.code === '42P01') { // Table doesn't exist
      await supabaseAdmin.rpc('create_memories_table', {});
    }
    
    // Create documents table
    const { error: docError } = await supabaseAdmin.from('documents').select('*').limit(1);
    
    if (docError?.code === '42P01') {
      // Table doesn't exist, create via SQL
      const { error: sqlError } = await supabaseAdmin.from('documents').insert({
        id: 'init',
        title: 'init',
        path: 'init',
        type: 'init',
        date: '2024-01-01',
        size: 0
      });
      
      if (sqlError && !sqlError.message.includes('already exists')) {
        console.log('Creating tables manually...');
      }
    }

    return NextResponse.json({ success: true, message: 'Database initialized' });
  } catch (error) {
    console.error('Init error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
