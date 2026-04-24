'use client';

import { useState, useEffect } from 'react';
import StockCard from '@/components/StockCard';
import { supabase } from '@/lib/supabase';
import { RefreshCw, ArrowUpDown } from 'lucide-react';

export default function Home() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [sortBy, setSortBy] = useState<'ticker' | 'confidence' | 'price'>('ticker');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('recommendations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setRecommendations(data);
    }
    setLoading(false);
  };

  const handleFetchAnalysis = async () => {
    setFetching(true);
    try {
      await fetch('/api/analyze');
      await fetchRecommendations();
    } catch (error) {
      console.error(error);
    } finally {
      setFetching(false);
    }
  };

  const sortedRecommendations = [...recommendations].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    if (sortBy === 'ticker') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });

  const toggleSort = (field: 'ticker' | 'confidence' | 'price') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-8 md:space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
            Daily <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">Market Picks</span>
          </h1>
          <p className="text-sm md:text-lg text-white/40 max-w-xl">
            AI-driven technical signals for IDX top-tier stocks. 
            Updated based on RSI, SMA, and MACD momentum.
          </p>
        </div>
        
        <button 
          onClick={handleFetchAnalysis}
          disabled={fetching}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] whitespace-nowrap"
        >
          <RefreshCw size={20} className={fetching ? 'animate-spin' : ''} />
          {fetching ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-4 p-2 bg-white/5 rounded-2xl border border-white/5 overflow-x-auto">
        <span className="text-xs font-bold text-white/40 uppercase tracking-widest pl-2 pr-4 border-r border-white/10">Sort By</span>
        {[
          { label: 'Name', field: 'ticker' },
          { label: 'Confidence', field: 'confidence' },
          { label: 'Price', field: 'price' }
        ].map((item) => (
          <button
            key={item.field}
            onClick={() => toggleSort(item.field as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              sortBy === item.field ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
            }`}
          >
            {item.label}
            {sortBy === item.field && <ArrowUpDown size={14} className={sortOrder === 'desc' ? 'rotate-180 transition-transform' : ''} />}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-white/5 animate-pulse rounded-3xl border border-white/5" />
          ))}
        </div>
      ) : sortedRecommendations.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 border border-dashed border-white/10 bg-white/5 rounded-3xl text-center">
          <p className="text-white/60 mb-6">No recommendations found. Run the analysis to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedRecommendations.map((rec: any) => (
            <StockCard key={rec.id} rec={rec} />
          ))}
        </div>
      )}
    </div>
  );
}
