export function formatCurrencyPKR(amount: number, opts?: { maximumFractionDigits?: number }) {
  return `PKR ${amount.toLocaleString('en', { maximumFractionDigits: opts?.maximumFractionDigits ?? 0 })}`;
}

export function formatDateGB(date: string | Date, opts?: Intl.DateTimeFormatOptions) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', opts);
}

