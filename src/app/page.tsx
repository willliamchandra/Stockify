'use client';

import { useState, useEffect } from 'react';
import StockCard from '@/components/StockCard';
import { supabase } from '@/lib/supabase';
import { RefreshCw, ArrowUpDown, Search } from 'lucide-react';

export default function Home() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [sortBy, setSortBy] = useState<'ticker' | 'confidence' | 'signal'>('confidence');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [compact, setCompact] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRecommendations();
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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

  const filteredRecommendations = recommendations.filter(rec => 
    rec.ticker.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedRecommendations = [...filteredRecommendations].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    if (sortBy === 'ticker' || sortBy === 'signal') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });

  const toggleSort = (field: 'ticker' | 'confidence' | 'signal') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="space-y-6 md:space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2 text-center md:text-left hidden md:block">
          <h1 className="text-3xl md:text-6xl font-extrabold tracking-tight text-white">
            Daily <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">Market Picks</span>
          </h1>
          <p className="text-xs md:text-lg text-white/40 max-w-xl">
            AI-driven technical signals for IDX top-tier stocks. 
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
            <input 
              type="text"
              placeholder="Search ticker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setCompact(!compact)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white/60 hover:text-white rounded-xl transition-all text-xs font-bold"
            >
              {compact ? 'Detailed' : 'Compact'}
            </button>
            <button 
              onClick={handleFetchAnalysis}
              disabled={fetching}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] whitespace-nowrap text-xs"
            >
              <RefreshCw size={14} className={fetching ? 'animate-spin' : ''} />
              {fetching ? 'Analyzing...' : 'Run Analysis'}
            </button>
          </div>
        </div>
      </header>

      <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex-shrink-0 flex items-center h-8 px-3 border-r border-white/10">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Sort</span>
        </div>
        <div className="flex gap-2 py-0.5">
          {[
            { label: 'Confidence', field: 'confidence' },
            { label: 'Name', field: 'ticker' },
            { label: 'Signal', field: 'signal' },
          ].map((item) => (
            <button
              key={item.field}
              onClick={() => toggleSort(item.field as any)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                sortBy === item.field ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {item.label}
              {sortBy === item.field && <ArrowUpDown size={12} className={sortOrder === 'desc' ? 'rotate-180 transition-transform' : ''} />}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className={compact ? "flex flex-col gap-3" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={`${compact ? 'h-16' : 'h-64'} bg-white/5 animate-pulse rounded-2xl border border-white/5`} />
          ))}
        </div>
      ) : sortedRecommendations.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 border border-dashed border-white/10 bg-white/5 rounded-3xl text-center">
          <p className="text-white/60 mb-6">No recommendations found.</p>
        </div>
      ) : (
        <div className={compact ? "flex flex-col gap-3" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}>
          {sortedRecommendations.map((rec: any) => (
            <StockCard key={rec.id} rec={rec} compact={compact} />
          ))}
        </div>
      )}

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-4 bg-emerald-500 text-white rounded-full shadow-2xl hover:bg-emerald-600 transition-all z-50 animate-in fade-in slide-in-from-bottom-4"
        >
          <ArrowUpDown size={24} className="rotate-180" />
        </button>
      )}
    </div>
  );
}
