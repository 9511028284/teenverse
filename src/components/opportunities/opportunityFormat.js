export const typeLabels = {
  internship: 'Internship',
  freelance: 'Freelance',
  part_time: 'Part-time',
  campus_ambassador: 'Campus Ambassador',
  entry_level: 'Entry-level',
  startup_collab: 'Startup Collaboration',
};

export const formatDate = (value) => {
  if (!value) return 'Rolling';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Rolling'
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatMoney = (opportunity) => {
  if (opportunity?.is_paid === false) return 'Unpaid / learning';
  const min = Number(opportunity?.stipend_min);
  const max = Number(opportunity?.stipend_max);
  const prefix = opportunity?.currency === 'INR' ? 'Rs.' : opportunity?.currency || 'Rs.';
  if (min > 0 && max > 0) return `${prefix} ${min.toLocaleString()} - ${max.toLocaleString()}`;
  if (min > 0) return `From ${prefix} ${min.toLocaleString()}`;
  if (max > 0) return `Up to ${prefix} ${max.toLocaleString()}`;
  return 'Payment not specified';
};
