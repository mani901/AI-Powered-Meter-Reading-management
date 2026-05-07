export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}) {
  return (
    <div className={`text-center py-16 bg-white border border-slate-200 rounded-xl ${className ?? ''}`}>
      <Icon size={48} className="mx-auto text-slate-300 mb-4" />
      <h3 className="font-semibold text-slate-700 mb-2">{title}</h3>
      {description ? <p className="text-slate-500 text-sm mb-4">{description}</p> : null}
      {action ? (
        <button
          onClick={action.onClick}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium inline-flex items-center gap-2"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}

