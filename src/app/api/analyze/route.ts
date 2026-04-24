import { NextResponse } from 'next/server';
import { runDailyAnalysis } from '@/lib/analysis';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const recommendations = await runDailyAnalysis();
    
    if (recommendations.length === 0) {
      return NextResponse.json({ error: 'No recommendations generated' }, { status: 500 });
    }

    // Use upsert to prevent duplicates based on the ticker
    const { error } = await supabase
      .from('recommendations')
      .upsert(recommendations, { onConflict: 'ticker' });

    if (error) throw error;

    return NextResponse.json({ 
      message: `Successfully analyzed ${recommendations.length} stocks`,
      data: recommendations 
    });
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
