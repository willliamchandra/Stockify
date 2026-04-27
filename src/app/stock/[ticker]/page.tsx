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

    // Fetch News
    // 1. Initial ticker news with slightly relaxed filtering
    let news = (searchResult.news || []).filter(n => {
      const title = n.title.toLowerCase();
      const hasTicker = n.relatedTickers && (n.relatedTickers.includes(ticker) || n.relatedTickers.includes(baseTicker));
      const mentionsTicker = title.includes(baseTicker.toLowerCase());
      return hasTicker || mentionsTicker;
    });
    
    // 2. Try company name for better IDX coverage if news is sparse
    const quote = searchResult.quotes && searchResult.quotes[0];
    const companyName = quote ? (quote.longname || quote.shortname) : null;
    
    if (typeof companyName === 'string' && news.length < 2) {
      // Clean name: remove PT, Tbk, Persero, and parentheses
      const cleanName = companyName
        .replace(/PT\s+/i, '')
        .replace(/\s+Tbk\.?$/i, '')
        .replace(/\s+Persero$/i, '')
        .replace(/\(.*\)/g, '')
        .trim();

      const nameSearchResult = await yahooFinance.search(cleanName);
      if (nameSearchResult.news && nameSearchResult.news.length > 0) {
        const firstWord = cleanName.split(' ')[0].toLowerCase();
        const nameNews = nameSearchResult.news.filter(n => {
          const title = n.title.toLowerCase();
          return title.includes(baseTicker.toLowerCase()) || title.includes(firstWord);
        });

        const existingTitles = new Set(news.map(n => n.title));
        nameNews.forEach(n => {
          if (!existingTitles.has(n.title)) news.push(n);
        });
      }
    }

    return { chartData, sma20Data, sma50Data, news };
  } catch (error) {
    console.error(`Error fetching data for ${ticker}:`, error);
    return { chartData: [], sma20Data: [], sma50Data: [], news: [] };
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
  const { chartData, sma20Data, sma50Data, news } = await getStockData(ticker);
  const rec = await getLatestRec(ticker);
  const displayTicker = ticker.replace('.JK', '');

  return (
    <div className="space-y-4 md:space-y-6 pb-10 lg:pb-0">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 md:h-12 md:w-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-lg font-bold">
            {displayTicker.split('.')[0]}
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold leading-tight">{displayTicker}</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-tighter">IDX Indonesia</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {rec && <div className="scale-90 origin-right"><SignalBadge signal={rec.signal} /></div>}
          <div className="scale-90 origin-right"><WatchlistButton ticker={ticker} /></div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        {/* Main Column */}
        <div className="lg:flex-[8] flex flex-col gap-4">
          {/* Chart Section */}
          <div className="bg-[#111] border border-white/5 rounded-2xl p-4 md:p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-xs md:text-sm font-semibold text-white/60">Technical Analysis Chart</h2>
              <div className="flex gap-3 text-[10px] text-white/30">
                <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-[#3b82f6]" /> SMA20</span>
                <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-[#f59e0b]" /> SMA50</span>
              </div>
            </div>
            <div className="flex-1 min-h-[300px] md:min-h-[400px] lg:min-h-[450px] relative">
              <StockChart data={chartData} sma20={sma20Data} sma50={sma50Data} />
            </div>
          </div>

          {/* News Section */}
          <div className="bg-[#111] border border-white/5 rounded-2xl p-5 md:p-6">
            <h2 className="text-xs md:text-sm font-semibold mb-6 text-white/60 uppercase tracking-widest">Latest News</h2>
            {news && news.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {news.slice(0, 4).map((article: any, i: number) => (
                  <a 
                    key={i} 
                    href={article.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex flex-col p-4 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl transition-all group"
                  >
                    <p className="text-[10px] text-emerald-400 font-bold mb-2 uppercase tracking-wide">{article.publisher}</p>
                    <h3 className="text-sm font-bold text-white/90 group-hover:text-white transition-colors line-clamp-2 mb-3">
                      {article.title}
                    </h3>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-[10px] text-white/30">
                        {new Date(article.providerPublishTime * 1000).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Read More →</span>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="p-10 border border-dashed border-white/10 rounded-2xl text-center">
                <p className="text-white/40 text-xs italic">No news found for this stock.</p>
              </div>
            )}
          </div>
        </div>

        {/* Info & Journal Column */}
        <div className="lg:col-span-4 lg:flex-[4] flex flex-col gap-4">
          <div className="flex-1 bg-[#111] border border-white/5 rounded-2xl p-5 md:p-6 flex flex-col">
            <h2 className="text-xs md:text-sm font-semibold mb-4 text-white/60 uppercase tracking-widest shrink-0">Analysis Details</h2>
            {rec ? (
              <div className="space-y-4 flex-1 flex flex-col justify-center">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 text-center">
                    <p className="text-[9px] text-white/30 uppercase mb-0.5">Price</p>
                    <p className="text-xs font-mono font-bold text-white/80">{formatCurrency(rec.price)}</p>
                  </div>
                  <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 text-center">
                    <p className="text-[9px] text-white/30 uppercase mb-0.5">Entry</p>
                    <p className="text-xs font-mono font-bold text-white/80">{rec.entry || 'N/A'}</p>
                  </div>
                  <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 text-center">
                    <p className="text-[9px] text-white/30 uppercase mb-0.5">Conf.</p>
                    <p className="text-xs font-bold text-emerald-400">{rec.confidence}%</p>
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
                
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 italic shrink-0">
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

          <div className="shrink-0">
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
    </div>
  );
}
