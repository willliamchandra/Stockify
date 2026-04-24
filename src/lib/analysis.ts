import YahooFinance from 'yahoo-finance2';
import { RSI, SMA, MACD } from 'technicalindicators';

const yahooFinance = new YahooFinance({
  fetchOptions: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    }
  }
});

export interface StockRecommendation {
  ticker: string;
  price: number;
  entry: string;
  take_profit: number;
  stop_loss: number;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  explanation: string;
}

const TICKERS = [
  // Banking
  'BBCA.JK', 'BBRI.JK', 'BMRI.JK', 'BBNI.JK', 'BRIS.JK', 'BTPS.JK', 'BDMN.JK', 'ARTO.JK',
  // Consumer & Retail
  'UNVR.JK', 'ICBP.JK', 'INDF.JK', 'AMRT.JK', 'MYOR.JK', 'CPIN.JK', 'KLBF.JK', 'ACES.JK', 'ERAA.JK', 'MAPI.JK',
  // Energy & Mining
  'ADRO.JK', 'PGAS.JK', 'PTBA.JK', 'ITMG.JK', 'HRUM.JK', 'MEDC.JK', 'ANTM.JK', 'TINS.JK', 'MDKA.JK', 'MBMA.JK', 'ADMR.JK', 'PGEO.JK',
  // Infrastructure & Telecom
  'TLKM.JK', 'ASII.JK', 'ISAT.JK', 'EXCL.JK', 'JSMR.JK', 'TOWR.JK', 'TBIG.JK',
  // Technology
  'GOTO.JK', 'BUKA.JK', 'BELI.JK',
  // Property & Construction
  'BSDE.JK', 'PWON.JK', 'CTRA.JK', 'SMGR.JK', 'INTP.JK',
  // Cigarette
  'HMSP.JK', 'GGRM.JK',
  // Healthcare
  'MIKA.JK', 'HEAL.JK'
];

export async function analyzeStock(ticker: string): Promise<StockRecommendation | null> {
  try {
    const period1 = new Date();
    period1.setMonth(period1.getMonth() - 6); // 6 months of data
    
    const result = await yahooFinance.chart(ticker, { period1 });
    const history = result.quotes.filter(q => q.date && q.close !== null && q.close !== undefined);
    
    if (!history || history.length < 50) return null;

    const prices = history.map(h => h.close as number);
    const latestPrice = prices[prices.length - 1];

    // Indicators
    const rsiValues = RSI.calculate({ values: prices, period: 14 });
    const sma20Values = SMA.calculate({ values: prices, period: 20 });
    const sma50Values = SMA.calculate({ values: prices, period: 50 });
    const macdValues = MACD.calculate({
      values: prices,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false
    });

    const latestRsi = rsiValues[rsiValues.length - 1];
    const latestSma20 = sma20Values[sma20Values.length - 1];
    const latestSma50 = sma50Values[sma50Values.length - 1];
    const latestMacd = macdValues[macdValues.length - 1];

    let score = 0;
    let reasons: string[] = [];

    // RSI Logic
    if (latestRsi < 30) {
      score += 30;
      reasons.push('RSI is oversold (< 30)');
    } else if (latestRsi < 45) {
      score += 15;
      reasons.push('RSI is recovering from lower levels');
    } else if (latestRsi > 70) {
      score -= 30;
      reasons.push('RSI is overbought (> 70)');
    }

    // SMA Logic
    if (latestPrice > latestSma50) {
      score += 20;
      reasons.push('Price is above SMA50 (bullish trend)');
    } else {
      score -= 10;
      reasons.push('Price is below SMA50 (bearish trend)');
    }

    if (latestPrice > latestSma20) {
      score += 10;
      reasons.push('Price is above SMA20 (short-term momentum)');
    }

    // MACD Logic
    if (latestMacd.MACD && latestMacd.signal && latestMacd.MACD > latestMacd.signal) {
      score += 20;
      reasons.push('MACD crossover (bullish momentum)');
    } else {
      score -= 10;
    }

    let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    if (score >= 40) signal = 'BUY';
    else if (score <= -20) signal = 'SELL';

    const confidence = Math.min(Math.max(Math.abs(score), 0), 100);
    
    // Entry, TP, SL calculation
    const entryRange = `${(latestPrice * 0.99).toFixed(0)} - ${(latestPrice * 1.01).toFixed(0)}`;
    const tp = latestPrice * 1.04; // 4% target
    const sl = latestPrice * 0.97; // 3% stop loss

    return {
      ticker,
      price: latestPrice,
      entry: entryRange,
      take_profit: Number(tp.toFixed(0)),
      stop_loss: Number(sl.toFixed(0)),
      signal,
      confidence,
      explanation: reasons.join('. ') + '.'
    };
  } catch (error) {
    console.error(`Error analyzing ${ticker}:`, error);
    return null;
  }
}

export async function runDailyAnalysis() {
  const recommendations: StockRecommendation[] = [];
  const BATCH_SIZE = 5;

  for (let i = 0; i < TICKERS.length; i += BATCH_SIZE) {
    const batch = TICKERS.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(ticker => analyzeStock(ticker)));
    
    results.forEach(rec => {
      if (rec) recommendations.push(rec);
    });
    
    // Small delay between batches to be nice to the API
    if (i + BATCH_SIZE < TICKERS.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  return recommendations;
}
