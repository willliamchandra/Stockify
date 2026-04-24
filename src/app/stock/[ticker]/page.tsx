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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-2xl font-bold">
            {ticker.split('.')[0]}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{ticker}</h1>
            <p className="text-white/40">Indonesia Stock Exchange</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {rec && <SignalBadge signal={rec.signal} />}
          <WatchlistButton ticker={ticker} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#111] border border-white/5 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Technical Chart</h2>
            <div className="flex gap-4 text-xs text-white/40">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#3b82f6]" /> SMA20</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#f59e0b]" /> SMA50</span>
            </div>
          </div>
          <StockChart data={chartData} sma20={sma20Data} sma50={sma50Data} />
        </div>

        <div className="space-y-8">
          <div className="bg-[#111] border border-white/5 rounded-3xl p-6">
            <h2 className="text-xl font-semibold mb-6">Latest Analysis</h2>
            {rec ? (
              <div className="space-y-6">
                <div className="p-4 bg-white/5 rounded-2xl">
                  <p className="text-sm text-white/40 mb-1">Signal Confidence</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${rec.confidence}%` }} />
                    </div>
                    <span className="text-lg font-bold">{rec.confidence}%</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-white/40 uppercase mb-1">Price</p>
                    <p className="text-lg font-mono">{formatCurrency(rec.price)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 uppercase mb-1">Target</p>
                    <p className="text-lg font-mono text-emerald-400">{formatCurrency(rec.take_profit)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-white/40 uppercase">Rationale</p>
                  <p className="text-sm leading-relaxed text-white/70 italic">
                    "{rec.explanation}"
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-white/40 italic">No analysis data available for this stock.</p>
            )}
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-6">
            <h3 className="text-emerald-400 font-semibold mb-2">Strategy Tip</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Consider entering between {rec?.entry || 'N/A'}. 
              Always set your stop-loss to manage risk effectively in volatile markets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
