export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  trend,
  change,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  trend?: { value: string; up: boolean; upIcon?: React.ElementType; downIcon?: React.ElementType };
  change?: { value: string; up: boolean };
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center`}>
          <Icon size={22} />
        </div>
        {trend ? (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend.up ? 'text-green-600' : 'text-red-600'}`}>
            {trend.up
              ? trend.upIcon ? <trend.upIcon size={14} /> : <span className="leading-none">↗</span>
              : trend.downIcon ? <trend.downIcon size={14} /> : <span className="leading-none">↘</span>}
            {trend.value}
          </div>
        ) : null}
        {change ? (
          <span className={`text-xs font-medium ${change.up ? 'text-green-600' : 'text-red-600'}`}>
            {change.up ? '↑' : '↓'} {change.value}
          </span>
        ) : null}
      </div>
      <p className="text-slate-500 text-sm">{label}</p>
      <p className="text-slate-900 text-2xl font-bold mt-0.5">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {sub && <p className="text-slate-400 text-xs mt-1">{sub}</p>}
    </div>
  );
}

