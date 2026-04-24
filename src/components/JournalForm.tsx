'use client';

import { useState } from 'react';
import { Save, Check, RefreshCw } from 'lucide-react';

interface JournalFormProps {
  stock: {
    ticker: string;
    price: number;
    take_profit?: number;
    stop_loss?: number;
    explanation?: string;
  };
}

export default function JournalForm({ stock }: JournalFormProps) {
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await fetch('/api/journal', {
        method: 'POST',
        body: JSON.stringify({
          ticker: stock.ticker,
          action,
          price: stock.price,
          take_profit: stock.take_profit,
          stop_loss: stock.stop_loss,
          notes: notes || stock.explanation,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-6 space-y-4">
      <h3 className="text-emerald-400 font-semibold">Save to Trade Journal</h3>
      
      <div className="flex gap-2 p-1 bg-black/40 rounded-xl">
        {(['BUY', 'SELL'] as const).map((item) => (
          <button
            key={item}
            onClick={() => setAction(item)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              action === item 
                ? item === 'BUY' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={loading || saved}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
          saved 
            ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
            : loading
              ? 'bg-emerald-500/50 text-white/50 cursor-not-allowed'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
        }`}
      >
        {loading ? <RefreshCw size={18} className="animate-spin" /> : saved ? <Check size={18} /> : <Save size={18} />}
        {loading ? 'Saving Entry...' : saved ? 'Successfully Saved!' : 'Save Action'}
      </button>
    </div>
  );
}
