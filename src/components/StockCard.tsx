'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, Info, BookPlus, Check, RefreshCw } from 'lucide-react';
import SignalBadge from './SignalBadge';
import { formatCurrency } from '@/lib/formatters';
import { useState } from 'react';

interface StockCardProps {
  rec: {
    ticker: string;
    price: number;
    signal: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    entry: string;
    take_profit: number;
    stop_loss: number;
    explanation: string;
  };
  compact?: boolean;
}

export default function StockCard({ rec, compact = false }: StockCardProps) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const displayTicker = rec.ticker.replace('.JK', '');

  const handleQuickJournal = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setLoading(true);
    try {
      await fetch('/api/journal', {
        method: 'POST',
        body: JSON.stringify({
          ticker: rec.ticker,
          action: rec.signal === 'HOLD' ? 'BUY' : rec.signal,
          price: rec.price,
          take_profit: rec.take_profit,
          stop_loss: rec.stop_loss,
          notes: `Quick Entry: ${rec.explanation.substring(0, 100)}...`,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <Link 
        href={`/stock/${rec.ticker}`}
        className="group flex items-center justify-between p-4 bg-[#111] border border-white/5 hover:border-white/10 rounded-2xl transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 font-bold text-sm">
            {displayTicker.split('.')[0]}
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">{displayTicker}</h3>
            <p className="text-xs text-white/40">{formatCurrency(rec.price)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-white/40 uppercase">Conf.</p>
            <p className="text-xs font-mono font-bold text-emerald-400">{rec.confidence}%</p>
          </div>
          <button
            onClick={handleQuickJournal}
            disabled={loading || saved}
            className={`p-2 rounded-lg border transition-all ${
              saved ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
            }`}
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <BookPlus size={14} />}
          </button>
          <SignalBadge signal={rec.signal} />
        </div>
      </Link>
    );
  }

  return (
    <div className="group relative bg-[#111] border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all duration-300 overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        {rec.signal === 'BUY' ? <TrendingUp size={64} /> : <TrendingDown size={64} />}
      </div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">{displayTicker}</h3>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-mono text-white/90">{formatCurrency(rec.price)}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <SignalBadge signal={rec.signal} />
          <button
            onClick={handleQuickJournal}
            disabled={loading || saved}
            className={`p-2.5 rounded-xl border transition-all ${
              saved ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
            }`}
            title="Quick Save to Journal"
          >
            {loading ? <RefreshCw size={18} className="animate-spin" /> : saved ? <Check size={18} /> : <BookPlus size={18} />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-1">
          <p className="text-xs text-white/40 uppercase tracking-wider">Entry Range</p>
          <p className="text-sm font-medium text-white/80">{rec.entry}</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-xs text-white/40 uppercase tracking-wider">Confidence</p>
          <p className="text-sm font-medium text-emerald-400 font-bold">{rec.confidence}%</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-white/40 uppercase tracking-wider">Take Profit</p>
          <p className="text-sm font-medium text-emerald-400">{formatCurrency(rec.take_profit)}</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-xs text-white/40 uppercase tracking-wider">Stop Loss</p>
          <p className="text-sm font-medium text-rose-400">{formatCurrency(rec.stop_loss)}</p>
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 bg-white/5 rounded-xl mb-6">
        <Info size={14} className="text-white/40 mt-1 shrink-0" />
        <p className="text-xs text-white/60 leading-relaxed italic line-clamp-2">
          {rec.explanation}
        </p>
      </div>

      <Link 
        href={`/stock/${rec.ticker}`}
        className="block w-full py-3 text-center text-sm font-bold text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all"
      >
        View Analysis & Chart
      </Link>
    </div>
  );
}
