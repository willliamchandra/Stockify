'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/formatters';
import { Trash2, Calendar, TrendingUp, TrendingDown, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function JournalPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const res = await fetch('/api/journal');
      const data = await res.json();
      setEntries(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await fetch('/api/journal', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
      setEntries(entries.filter(e => e.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-3xl font-bold">Trade Journal</h1>
        <p className="text-white/40 text-sm">Review your past actions and analysis.</p>
      </header>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 border border-dashed border-white/10 rounded-3xl text-center space-y-4">
          <BookOpen size={48} className="text-white/10" />
          <p className="text-white/40">No journal entries found. Save your first trade from the stock analysis page!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden group">
              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Link 
                        href={`/stock/${entry.ticker}`}
                        className="text-2xl font-bold hover:text-emerald-400 transition-colors"
                      >
                        {entry.ticker}
                      </Link>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        entry.action === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {entry.action}
                      </span>
                    </div>
                    <button 
                      onClick={() => deleteEntry(entry.id)}
                      className="p-2 text-white/20 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-1">
                      <p className="text-xs text-white/40 uppercase tracking-widest">Entry Price</p>
                      <p className="text-lg font-mono">{formatCurrency(entry.price)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-white/40 uppercase tracking-widest">Take Profit</p>
                      <p className="text-lg font-mono text-emerald-400">{formatCurrency(entry.take_profit)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-white/40 uppercase tracking-widest">Stop Loss</p>
                      <p className="text-lg font-mono text-rose-400">{formatCurrency(entry.stop_loss)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-white/40 uppercase tracking-widest">Date</p>
                      <div className="flex items-center gap-2 text-white/60 text-sm">
                        <Calendar size={14} />
                        {new Date(entry.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Analysis / Notes</p>
                    <p className="text-sm text-white/80 leading-relaxed italic">
                      "{entry.notes}"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
