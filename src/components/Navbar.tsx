import Link from 'next/link';
import { LayoutDashboard, Star, TrendingUp } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/50 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              <TrendingUp size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">IDX <span className="text-emerald-500">Insight</span></span>
          </Link>

          <div className="flex items-center gap-6">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              <LayoutDashboard size={18} />
              <span>Recommendations</span>
            </Link>
            <Link 
              href="/watchlist" 
              className="flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              <Star size={18} />
              <span>Watchlist</span>
            </Link>
            <div className="h-4 w-[1px] bg-white/10" />
            <button className="text-sm font-semibold text-white bg-white/5 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10 transition-all">
              Sign In
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
