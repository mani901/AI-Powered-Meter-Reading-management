export function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const config =
    score >= 0.85 ? { label: 'High Confidence', color: 'bg-green-100 text-green-700 border-green-300', barColor: 'bg-green-500' }
      : score >= 0.65 ? { label: 'Medium Confidence', color: 'bg-amber-100 text-amber-700 border-amber-300', barColor: 'bg-amber-500' }
        : { label: 'Low Confidence', color: 'bg-red-100 text-red-700 border-red-300', barColor: 'bg-red-500' };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${config.color}`}>
      <div className="w-24 h-2 bg-white/60 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${config.barColor}`} style={{ width: `${pct}%` }} />
      </div>
      {pct}% — {config.label}
    </div>
  );
}

