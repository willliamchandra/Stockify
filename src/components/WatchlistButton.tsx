'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface WatchlistButtonProps {
  ticker: string;
}

export default function WatchlistButton({ ticker }: WatchlistButtonProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const userId = 'personal-user';

  useEffect(() => {
    checkWatchlist();
  }, [ticker]);

  const checkWatchlist = async () => {
    const { data } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', userId)
      .eq('ticker', ticker)
      .single();
    
    setIsInWatchlist(!!data);
    setLoading(false);
  };

  const toggleWatchlist = async () => {
    setLoading(true);
    try {
      if (isInWatchlist) {
        await fetch('/api/watchlist', {
          method: 'DELETE',
          body: JSON.stringify({ userId, ticker }),
        });
        setIsInWatchlist(false);
      } else {
        await fetch('/api/watchlist', {
          method: 'POST',
          body: JSON.stringify({ userId, ticker }),
        });
        setIsInWatchlist(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleWatchlist}
      disabled={loading}
      className={`p-3 rounded-xl border transition-all ${
        isInWatchlist 
          ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' 
          : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
      }`}
    >
      <Star size={24} fill={isInWatchlist ? 'currentColor' : 'none'} />
    </button>
  );
}
