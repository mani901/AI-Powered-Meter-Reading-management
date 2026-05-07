export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const btn = size === 'sm' ? 'px-4 py-2 rounded-lg text-sm' : 'px-4 py-2.5 rounded-xl text-xs';
  const wrapper = size === 'sm'
    ? 'flex gap-2 bg-white border border-slate-200 rounded-xl p-1 w-fit'
    : 'flex gap-2';

  return (
    <div className={`${wrapper} ${className ?? ''}`}>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`${btn} font-medium transition-colors ${
            value === opt ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

