export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  valueFormatter?: (dataKey: string, value: any) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
      {label ? <p className="font-semibold text-slate-900 mb-2">{label}</p> : null}
      {payload.map((p: any) => (
        <div key={p.dataKey ?? p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-600">{p.name ?? p.dataKey}:</span>
          <span className="font-medium text-slate-900">
            {valueFormatter ? valueFormatter(p.dataKey, p.value) : String(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

