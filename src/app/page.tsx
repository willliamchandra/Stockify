import StockCard from '@/components/StockCard';

async function getRecommendations() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/recommendations`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export default async function Home() {
  const recommendations = await getRecommendations();

  return (
    <div className="space-y-12">
      <header className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
          Daily <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">Market Picks</span>
        </h1>
        <p className="text-lg text-white/40 max-w-2xl mx-auto">
          AI-driven technical signals for IDX top-tier stocks. 
          Updated every 24 hours based on RSI, SMA, and MACD momentum.
        </p>
      </header>

      {recommendations.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 border border-white/5 bg-white/5 rounded-3xl text-center">
          <p className="text-white/60 mb-6">No recommendations found. Run the analysis to get started.</p>
          <a 
            href="/api/analyze" 
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            Run Initial Analysis
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((rec: any) => (
            <StockCard key={rec.id} rec={rec} />
          ))}
        </div>
      )}
    </div>
  );
}
