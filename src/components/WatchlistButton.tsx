'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface WatchlistButtonProps {
  ticker: string;
}

export default function WatchlistButton({ ticker }: WatchlistButtonProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        checkWatchlist(data.user.id);
      }
    });
  }, [ticker]);

  const checkWatchlist = async (userId: string) => {
    const { data } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', userId)
      .eq('ticker', ticker)
      .single();
    
    setIsInWatchlist(!!data);
  };

  const toggleWatchlist = async () => {
    if (!user) {
      alert('Please sign in to manage your watchlist');
      return;
    }

    setLoading(true);
    try {
      if (isInWatchlist) {
        await fetch('/api/watchlist', {
          method: 'DELETE',
          body: JSON.stringify({ userId: user.id, ticker }),
        });
        setIsInWatchlist(false);
      } else {
        await fetch('/api/watchlist', {
          method: 'POST',
          body: JSON.stringify({ userId: user.id, ticker }),
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
