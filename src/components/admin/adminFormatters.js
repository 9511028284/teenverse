export const formatMetricValue = (value, format = 'number') => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  if (format === 'currency') return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  if (format === 'percent') return `${Number(value).toFixed(1)}%`;
  if (format === 'duration') return `${Number(value).toFixed(1)}h`;
  if (format === 'milliseconds') return `${Math.round(Number(value))} ms`;
  if (format === 'decimal') return Number(value).toFixed(2);
  return new Intl.NumberFormat('en-IN', { notation: Math.abs(value) >= 100000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value);
};
