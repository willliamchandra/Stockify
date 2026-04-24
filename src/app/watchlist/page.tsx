'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import StockCard from '@/components/StockCard';
import { Star } from 'lucide-react';

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        fetchWatchlist(data.user.id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const fetchWatchlist = async (userId: string) => {
    try {
      const res = await fetch(`/api/watchlist?userId=${userId}`);
      const watchlistData = await res.json();
      const tickers = watchlistData.map((w: any) => w.ticker);
      setWatchlist(tickers);

      const recRes = await fetch('/api/recommendations');
      const recs = await recRes.json();
      
      const filteredRecs = recs.filter((r: any) => tickers.includes(r.ticker));
      setRecommendations(filteredRecs);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6">
        <div className="p-4 bg-white/5 rounded-full text-white/20">
          <Star size={48} />
        </div>
        <h1 className="text-2xl font-bold">Sign in to view your watchlist</h1>
        <p className="text-white/40 max-w-sm">
          Track your favorite IDX stocks and get notified of new analysis.
        </p>
        <button className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all">
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Watchlist</h1>
          <p className="text-white/40">Tracking {watchlist.length} IDX stocks</p>
        </div>
      </header>

      {recommendations.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
          <p className="text-white/40">You haven't added any stocks to your watchlist yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((rec) => (
            <StockCard key={rec.id} rec={rec} />
          ))}
        </div>
      )}
    </div>
  );
}
