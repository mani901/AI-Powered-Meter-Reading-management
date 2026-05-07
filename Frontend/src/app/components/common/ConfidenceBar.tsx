export function ConfidenceBar({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score * 100));
  const color = score >= 0.85 ? 'bg-green-500' : score >= 0.65 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-500 whitespace-nowrap">{pct.toFixed(0)}%</span>
    </div>
  );
}

