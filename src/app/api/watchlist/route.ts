import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('watchlist')
    .select('ticker')
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { userId, ticker } = await request.json();

  if (!userId || !ticker) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

  const { error } = await supabase
    .from('watchlist')
    .insert({ user_id: userId, ticker });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: 'Added to watchlist' });
}

export async function DELETE(request: Request) {
  const { userId, ticker } = await request.json();

  if (!userId || !ticker) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', userId)
    .eq('ticker', ticker);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: 'Removed from watchlist' });
}
