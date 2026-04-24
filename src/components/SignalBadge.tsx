import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SignalBadgeProps {
  signal: 'BUY' | 'SELL' | 'HOLD';
}

export default function SignalBadge({ signal }: SignalBadgeProps) {
  const colors = {
    BUY: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    SELL: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    HOLD: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  return (
    <span className={cn(
      'px-2 py-0.5 rounded-full text-xs font-semibold border transition-all duration-300',
      colors[signal]
    )}>
      {signal}
    </span>
  );
}
