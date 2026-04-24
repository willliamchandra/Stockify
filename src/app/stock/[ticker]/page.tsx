import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance({
  fetchOptions: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    }
  }
});
import { SMA } from 'technicalindicators';
import StockChart from '@/components/StockChart';
import WatchlistButton from '@/components/WatchlistButton';
import SignalBadge from '@/components/SignalBadge';
import { formatCurrency } from '@/lib/formatters';
import { supabase } from '@/lib/supabase';
import JournalForm from '@/components/JournalForm';
import { Trash2 } from 'lucide-react';
import Link from 'next/link';

async function getStockData(ticker: string) {
  try {
    const period1 = new Date();
    period1.setMonth(period1.getMonth() - 6);
    const result = await yahooFinance.chart(ticker, { period1 });
    
    if (!result || !result.quotes || result.quotes.length === 0) {
      throw new Error('No data found');
    }

    const history = result.quotes.filter(q => 
      q.date && 
      q.open !== null && q.open !== undefined &&
      q.high !== null && q.high !== undefined &&
      q.low !== null && q.low !== undefined &&
      q.close !== null && q.close !== undefined
    );
  
  const prices = history.map(h => h.close as number);
  const sma20 = SMA.calculate({ values: prices, period: 20 });
  const sma50 = SMA.calculate({ values: prices, period: 50 });

  const chartData = history.map(h => ({
    time: h.date.toISOString().split('T')[0],
    open: h.open as number,
    high: h.high as number,
    low: h.low as number,
    close: h.close as number,
  }));

  const sma20Data = sma20.map((val, i) => ({
    time: history[i + 19].date.toISOString().split('T')[0],
    value: val,
  }));

  const sma50Data = sma50.map((val, i) => ({
    time: history[i + 49].date.toISOString().split('T')[0],
    value: val,
  }));

    return { chartData, sma20Data, sma50Data };
  } catch (error) {
    console.error(`Error fetching data for ${ticker}:`, error);
    return { chartData: [], sma20Data: [], sma50Data: [] };
  }
}

async function getLatestRec(ticker: string) {
  const { data } = await supabase
    .from('recommendations')
    .select('*')
    .eq('ticker', ticker)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return data;
}

export default async function StockDetail({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const { chartData, sma20Data, sma50Data } = await getStockData(ticker);
  const rec = await getLatestRec(ticker);

  return (
    <div className="space-y-4 md:space-y-6 pb-10 lg:pb-0">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 md:h-12 md:w-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-lg font-bold">
            {ticker.split('.')[0]}
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold leading-tight">{ticker}</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-tighter">IDX Indonesia</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {rec && <div className="scale-90 origin-right"><SignalBadge signal={rec.signal} /></div>}
          <div className="scale-90 origin-right"><WatchlistButton ticker={ticker} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Chart Column */}
        <div className="lg:col-span-8 bg-[#111] border border-white/5 rounded-2xl p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs md:text-sm font-semibold text-white/60">Technical Analysis Chart</h2>
            <div className="flex gap-3 text-[10px] text-white/30">
              <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-[#3b82f6]" /> SMA20</span>
              <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-[#f59e0b]" /> SMA50</span>
            </div>
          </div>
          <div className="h-[300px] md:h-[400px] lg:h-[450px] relative">
            <StockChart data={chartData} sma20={sma20Data} sma50={sma50Data} />
          </div>
        </div>

        {/* Info & Journal Column */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#111] border border-white/5 rounded-2xl p-5 md:p-6">
            <h2 className="text-xs md:text-sm font-semibold mb-4 text-white/60 uppercase tracking-widest">Analysis Details</h2>
            {rec ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 text-center">
                    <p className="text-[9px] text-white/30 uppercase mb-0.5">Price</p>
                    <p className="text-xs font-mono font-bold">{formatCurrency(rec.price)}</p>
                  </div>
                  <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 text-center">
                    <p className="text-[9px] text-white/30 uppercase mb-0.5">Entry</p>
                    <p className="text-xs font-mono font-bold text-emerald-400">{rec.entry || 'N/A'}</p>
                  </div>
                  <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 text-center">
                    <p className="text-[9px] text-white/30 uppercase mb-0.5">Conf.</p>
                    <p className="text-xs font-bold text-white/80">{rec.confidence}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-center">
                    <p className="text-[9px] text-emerald-400/60 uppercase mb-0.5">Take Profit</p>
                    <p className="text-xs font-mono font-bold text-emerald-400">{formatCurrency(rec.take_profit)}</p>
                  </div>
                  <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/10 text-center">
                    <p className="text-[9px] text-rose-400/60 uppercase mb-0.5">Stop Loss</p>
                    <p className="text-xs font-mono font-bold text-rose-400">{formatCurrency(rec.stop_loss)}</p>
                  </div>
                </div>
                
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 italic">
                  <p className="text-[10px] text-white/30 uppercase mb-2 not-italic">Rationale</p>
                  <p className="text-xs leading-relaxed text-white/60">
                    "{rec.explanation}"
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-white/40 text-xs italic">No data available.</p>
            )}
          </div>

          <JournalForm stock={{
            ticker,
            price: rec?.price || 0,
            take_profit: rec?.take_profit,
            stop_loss: rec?.stop_loss,
            explanation: rec?.explanation
          }} />
        </div>
      </div>
    </div>
  );
}
