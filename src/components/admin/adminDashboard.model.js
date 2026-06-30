const number = (value) => Number(value) || 0;
const sum = (rows, key) => rows.reduce((total, row) => total + number(row[key]), 0);
const average = (rows, key) => rows.length ? sum(rows, key) / rows.length : 0;
const rate = (value, total) => total ? (value / total) * 100 : 0;
const byStatus = (rows, statuses) => rows.filter((row) => statuses.includes(String(row.status || '').toLowerCase()));
const metric = (label, value, format = 'number', hint, change = null) => ({ label, value, format, change, hint });
const unavailable = (label, format = 'number') => metric(label, null, format);
const periodChange = (current, previous) => previous ? ((number(current) - number(previous)) / number(previous)) * 100 : null;

const dateLabel = (value) => new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const formatDateTime = (value) => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const groupCount = (rows, key, fallback = 'Unknown') => {
  const totals = new Map();
  rows.forEach((row) => {
    const value = String(row[key] || fallback).trim() || fallback;
    totals.set(value, (totals.get(value) || 0) + 1);
  });
  return [...totals.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
};

const dailySeries = (rows, dateKey, valueKey) => {
  const totals = new Map();
  rows.forEach((row) => {
    if (!row[dateKey]) return;
    const day = new Date(row[dateKey]).toISOString().slice(0, 10);
    const amount = valueKey ? number(row[valueKey]) : 1;
    totals.set(day, (totals.get(day) || 0) + amount);
  });
  return [...totals.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-30)
    .map(([day, value]) => ({ label: dateLabel(day), value }));
};

const uniqueActorsSince = (rows, days) => {
  const threshold = Date.now() - days * 86400000;
  return new Set(rows.filter((row) => row.actor_id && new Date(row.created_at).getTime() >= threshold).map((row) => row.actor_id)).size;
};

const activityRows = (data) => [
  ...(data.profiles || []).map((row) => ({ id: `user-${row.id}`, event: 'User registered', detail: row.full_name || row.email || row.id, source: 'Users', created_at: row.created_at })),
  ...(data.jobs || []).map((row) => ({ id: `job-${row.id}`, event: 'Job posted', detail: row.title, source: 'Marketplace', created_at: row.created_at })),
  ...(data.applications || []).map((row) => ({ id: `application-${row.id}`, event: 'Application submitted', detail: `Application #${row.id} · ${row.status || 'pending'}`, source: 'Marketplace', created_at: row.created_at })),
  ...(data.payment_logs || []).map((row) => ({ id: `payment-${row.id}`, event: 'Payment event', detail: `${row.status || 'unknown'} · ₹${number(row.amount).toLocaleString('en-IN')}`, source: 'Payments', created_at: row.created_at })),
  ...(data.support_tickets || []).map((row) => ({ id: `support-${row.id}`, event: 'Support ticket', detail: row.subject, source: 'Support', created_at: row.created_at })),
  ...(data.kyc_status || []).map((row) => ({ id: `kyc-${row.user_id}-${row.submitted_at}`, event: 'KYC event', detail: `${row.status} · ${row.provider || 'provider not set'}`, source: 'Operations', created_at: row.verified_at || row.submitted_at })),
].filter((row) => row.created_at).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

const tableColumns = {
  activity: [
    { key: 'event', label: 'Event' },
    { key: 'detail', label: 'Detail' },
    { key: 'source', label: 'Source' },
    { key: 'occurred', label: 'Occurred' },
  ],
  payments: [
    { key: 'id', label: 'Transaction' },
    { key: 'status', label: 'Status' },
    { key: 'amount', label: 'Amount' },
    { key: 'order_id', label: 'Order' },
    { key: 'occurred', label: 'Occurred' },
  ],
};

const common = (snapshot) => {
  const data = snapshot.data || {};
  const applications = data.applications || [];
  const paidApplications = applications.filter((row) => ['paid', 'released', 'completed'].includes(String(row.payment_status || row.status || '').toLowerCase()));
  const completed = byStatus(applications, ['completed', 'paid', 'released']);
  const hired = applications.filter((row) => ['accepted', 'hired', 'in_progress', 'completed', 'paid', 'released'].includes(String(row.status || '').toLowerCase()));
  const gmv = sum(paidApplications, 'bid_amount') || sum(data.payment_logs || [], 'amount');
  const commission = sum(paidApplications, 'platform_fee') || gmv * 0.05;
  const activity = activityRows(data).map((row) => ({ ...row, occurred: formatDateTime(row.created_at) }));
  return { data, applications, paidApplications, completed, hired, gmv, commission, activity };
};

const founderModel = (snapshot) => {
  const c = common(snapshot);
  const { data } = c;
  const totalUsers = snapshot.totals.profiles || 0;
  const openTickets = (data.support_tickets || []).filter((row) => row.status !== 'resolved').length;
  const failedPayments = byStatus(data.payment_logs || [], ['failed', 'error']).length;
  const activeUsers = uniqueActorsSince(data.audit_logs || [], 30);
  const pendingPayments = byStatus(data.escrow_orders || [], ['funded', 'processing', 'pending']).length;
  const escrowBalance = sum(byStatus(data.escrow_orders || [], ['funded', 'held']), 'bid_amount');
  const securityAlerts = (data.consistency_flags || []).filter((row) => row.status !== 'resolved').length;
  const healthInputs = [failedPayments === 0, openTickets < 10, snapshot.issues.length === 0, pendingPayments < 10];
  const healthScore = rate(healthInputs.filter(Boolean).length, healthInputs.length);
  const growthScore = Math.min(100, rate(snapshot.rangeCounts.profiles || 0, Math.max(totalUsers, 1)) * 10 + rate(c.hired.length, Math.max(c.applications.length, 1)));
  const riskScore = Math.min(100, failedPayments * 12 + openTickets * 3 + snapshot.issues.length * 10);
  const priorities = [
    openTickets ? `Resolve ${openTickets} open support ticket${openTickets === 1 ? '' : 's'}.` : null,
    pendingPayments ? `Review ${pendingPayments} pending payment${pendingPayments === 1 ? '' : 's'}.` : null,
    failedPayments ? `Investigate ${failedPayments} failed payment event${failedPayments === 1 ? '' : 's'}.` : null,
    snapshot.issues.length ? `Restore ${snapshot.issues.length} unavailable analytics source${snapshot.issues.length === 1 ? '' : 's'}.` : null,
  ].filter(Boolean);

  return {
    description: 'Company-wide marketplace, growth, revenue, support, and platform-health view.',
    metrics: [
      metric('Total Users', totalUsers), metric('New Users', snapshot.rangeCounts.profiles || 0, 'number', 'Compared with the previous period', periodChange(snapshot.rangeCounts.profiles, snapshot.previousRangeCounts?.profiles)), metric('Active Users', activeUsers),
      metric('DAU', uniqueActorsSince(data.audit_logs || [], 1)), metric('WAU', uniqueActorsSince(data.audit_logs || [], 7)), metric('MAU', activeUsers),
      metric('Freelancers', snapshot.totals.freelancers || 0), metric('Clients', snapshot.totals.clients || 0), metric('Jobs Posted', snapshot.totals.jobs || 0),
      metric('Applications', c.applications.length), metric('Hires', c.hired.length), metric('Completed Projects', c.completed.length),
      metric('Orders', (data.escrow_orders || []).length), metric('Completion Rate', rate(c.completed.length, c.hired.length), 'percent'),
      metric('Total Revenue', c.gmv, 'currency'), metric('GMV', c.gmv, 'currency'), metric('Platform Commission', c.commission, 'currency'), metric('Escrow Balance', escrowBalance, 'currency'), metric('Pending Payouts', pendingPayments),
      metric('Failed Payments', failedPayments), metric('Support Tickets', openTickets), metric('Business Health', healthScore, 'percent'),
      metric('Infrastructure Health', snapshot.issues.length ? 0 : 100, 'percent'), metric('Security Alerts', securityAlerts), metric('Growth Score', growthScore, 'percent'), metric('Risk Score', riskScore, 'percent'),
    ],
    charts: [
      { type: 'line', title: 'User Growth', subtitle: 'New user records by day', series: dailySeries(data.profiles || [], 'created_at') },
      { type: 'line', title: 'Revenue Trend', subtitle: 'Successful payment volume by day', series: dailySeries(c.paidApplications, 'paid_at', 'bid_amount'), format: 'currency' },
      { type: 'line', title: 'Orders Trend', subtitle: 'Applications created by day', series: dailySeries(c.applications, 'created_at') },
      { type: 'bar', title: 'Conversion Funnel', subtitle: 'Recorded users progressing through marketplace milestones', series: [
        { label: 'Signup', value: totalUsers },
        { label: 'KYC', value: byStatus(data.kyc_status || [], ['verified', 'approved']).length },
        { label: 'Portfolio', value: new Set((data.portfolio_items || []).map((row) => row.user_id)).size },
        { label: 'Application', value: new Set(c.applications.map((row) => row.freelancer_id)).size },
        { label: 'Hire', value: c.hired.length },
        { label: 'Payment', value: c.paidApplications.length },
      ] },
    ],
    alerts: [
      failedPayments ? `${failedPayments} failed payment event(s) need review.` : null,
      openTickets ? `${openTickets} support ticket(s) are still open.` : null,
      snapshot.issues.length ? `${snapshot.issues.length} analytics source(s) could not be read.` : null,
    ].filter(Boolean),
    insights: {
      summary: totalUsers
        ? `TeenVerseHub has ${totalUsers.toLocaleString('en-IN')} users, ${activeUsers.toLocaleString('en-IN')} active users in the last 30 days, and ${c.applications.length.toLocaleString('en-IN')} applications in the selected period.`
        : 'User acquisition data is connected but no records matched this period.',
      opportunity: c.applications.length && !c.hired.length
        ? 'The largest growth opportunity is improving application-to-hire conversion.'
        : `The strongest current signal is ${snapshot.rangeCounts.profiles || 0} new user registrations in this period.`,
      risk: failedPayments || openTickets
        ? `${failedPayments} failed payment events and ${openTickets} open support tickets are the largest recorded operational risks.`
        : 'No failed payments or open support tickets were recorded in this period.',
      priorities: priorities.length ? priorities : ['Review acquisition performance and define the next growth experiment.'],
      actions: [
        c.applications.length > c.hired.length ? 'Review the application funnel and contact stalled clients.' : null,
        snapshot.issues.length ? 'Connect or repair the unavailable analytics sources.' : null,
        'Review the executive dashboard before the next operating meeting.',
      ].filter(Boolean),
    },
    table: { title: 'Recent Activity', description: 'Latest persisted events across core product tables.', rows: c.activity.slice(0, 100), columns: tableColumns.activity },
  };
};

const marketingModel = (snapshot) => {
  const c = common(snapshot);
  const web = snapshot.externalTelemetry?.web;
  const acquisition = [...(c.data.freelancers || []), ...(c.data.clients || [])];
  const signups = acquisition.length;
  const previousSignups = number(snapshot.previousRangeCounts?.freelancers) + number(snapshot.previousRangeCounts?.clients);
  const channels = groupCount(acquisition, 'source').map((item) => ({ id: item.label, channel: item.label, signups: item.value, conversion: null, revenue: null, cac: null, roi: null }));
  return {
    description: 'Acquisition channel performance using real signup attribution. Ad spend and visitor tracking require campaign integrations.',
    metrics: [web ? metric('Visitors', web.visitors) : unavailable('Visitors'), web ? metric('Tracked Events', web.events) : unavailable('Tracked Events'), metric('Attributed Signups', signups, 'number', 'Compared with the previous period', periodChange(signups, previousSignups)), unavailable('CAC', 'currency'), unavailable('CPA', 'currency'), unavailable('ROI', 'percent'), metric('Revenue', c.gmv, 'currency'), unavailable('Conversion Rate', 'percent'), unavailable('Retention', 'percent'), unavailable('Bounce Rate', 'percent')],
    charts: [
      { type: 'bar', title: 'Traffic Sources', subtitle: 'Signup attribution from profile source fields', series: groupCount(acquisition, 'source') },
      { type: 'line', title: 'Campaign Signups', subtitle: 'Attributed profiles created by day', series: dailySeries(acquisition, 'created_at') },
      { type: 'bar', title: 'Cost vs Revenue', subtitle: 'Revenue is live; campaign cost requires an ad-platform connector', series: [{ label: 'Recorded revenue', value: c.gmv }] , format: 'currency' },
    ],
    integrations: ['Web analytics visitor events', 'Meta/Instagram Ads spend', 'Google Ads spend', 'LinkedIn campaign spend'],
    table: { title: 'Acquisition Channels', description: 'No cost or visitor metrics are fabricated.', rows: channels, columns: [{ key: 'channel', label: 'Channel' }, { key: 'signups', label: 'Signups' }, { key: 'conversion', label: 'Conversion' }, { key: 'cac', label: 'CAC' }, { key: 'roi', label: 'ROI' }] },
  };
};

const growthModel = (snapshot) => {
  const c = common(snapshot);
  const active = c.data.audit_logs || [];
  const newUsers = snapshot.rangeCounts.profiles || 0;
  const activated = (c.data.profiles || []).filter((row) => row.onboarding_completed).length;
  return {
    description: 'Acquisition, activation, active-user, and retention signals derived from persisted user and audit events.',
    metrics: [metric('Daily Active Users', uniqueActorsSince(active, 1)), metric('Weekly Active Users', uniqueActorsSince(active, 7)), metric('Monthly Active Users', uniqueActorsSince(active, 30)), metric('Returning Users', Math.max(0, uniqueActorsSince(active, 30) - newUsers)), metric('New Users', newUsers, 'number', 'Compared with the previous period', periodChange(newUsers, snapshot.previousRangeCounts?.profiles)), unavailable('Churn', 'percent'), metric('Activation Rate', rate(activated, c.data.profiles?.length || 0), 'percent'), unavailable('Retention Cohorts', 'percent')],
    charts: [
      { type: 'line', title: 'Growth Curve', subtitle: 'New users by day', series: dailySeries(c.data.profiles || [], 'created_at') },
      { type: 'bar', title: 'User Segments', subtitle: 'Profile roles in the selected period', series: groupCount(c.data.profiles || [], 'role') },
      { type: 'line', title: 'Activity Trend', subtitle: 'Recorded product audit events', series: dailySeries(active, 'created_at') },
    ],
    integrations: ['Session analytics for cohort retention and churn'],
    table: { title: 'Recent User Activity', rows: c.activity.filter((row) => ['Users', 'Marketplace'].includes(row.source)), columns: tableColumns.activity },
  };
};

const marketplaceModel = (snapshot) => {
  const c = common(snapshot);
  const jobs = c.data.jobs || [];
  const openJobs = jobs.filter((row) => !row.is_archived && !row.hired_freelancer_id).length;
  const closedJobs = jobs.filter((row) => row.is_archived || row.hired_freelancer_id).length;
  const categories = groupCount(jobs, 'category');
  const jobRows = jobs.map((row) => ({ ...row, budget: `₹${number(row.budget).toLocaleString('en-IN')}`, created: formatDateTime(row.created_at), state: row.is_archived ? 'Closed' : row.hired_freelancer_id ? 'Hired' : 'Open' }));
  return {
    description: 'Supply, demand, applications, hires, and completion health across jobs and opportunities.',
    metrics: [metric('Open Jobs', openJobs), metric('Closed Jobs', closedJobs), metric('Average Applications', jobs.length ? c.applications.length / jobs.length : 0, 'decimal'), metric('Hiring Rate', rate(c.hired.length, c.applications.length), 'percent'), metric('Completion Rate', rate(c.completed.length, c.hired.length), 'percent'), metric('Average Project Value', average(c.applications, 'bid_amount'), 'currency'), unavailable('Average Hiring Time', 'duration'), unavailable('Repeat Clients', 'percent'), unavailable('Repeat Freelancers', 'percent')],
    charts: [{ type: 'bar', title: 'Top Categories', series: categories }, { type: 'line', title: 'Marketplace Demand', subtitle: 'Jobs posted by day', series: dailySeries(jobs, 'created_at') }, { type: 'line', title: 'Applications Trend', series: dailySeries(c.applications, 'created_at') }],
    table: { title: 'Jobs', rows: jobRows, columns: [{ key: 'title', label: 'Job' }, { key: 'category', label: 'Category' }, { key: 'budget', label: 'Budget' }, { key: 'state', label: 'State' }, { key: 'created', label: 'Created' }] },
  };
};

const revenueModel = (snapshot) => {
  const c = common(snapshot);
  const refunds = byStatus(c.data.payment_logs || [], ['refunded', 'refund']).reduce((total, row) => total + number(row.amount), 0);
  const net = Math.max(0, c.commission - refunds);
  return {
    description: 'GMV, platform fees, refunds, and net revenue from payment and application records.',
    metrics: [metric('GMV', c.gmv, 'currency'), metric('Platform Revenue', c.commission, 'currency'), metric('Commission', c.commission, 'currency'), unavailable('Subscription Revenue', 'currency'), metric('Refunds', refunds, 'currency'), unavailable('Gateway Fees', 'currency'), unavailable('Taxes', 'currency'), metric('Net Revenue', net, 'currency'), metric('Period Revenue', c.commission, 'currency'), unavailable('Annual Revenue', 'currency')],
    charts: [{ type: 'line', title: 'Revenue Trend', series: dailySeries(c.paidApplications, 'paid_at', 'platform_fee'), format: 'currency' }, { type: 'bar', title: 'Revenue Sources', series: [{ label: 'Marketplace commission', value: c.commission }, { label: 'Refund impact', value: refunds }], format: 'currency' }],
    integrations: ['Subscription billing ledger', 'Gateway fee and tax reconciliation', 'Forecasting model'],
    table: { title: 'Payment Ledger', rows: (c.data.payment_logs || []).map((row) => ({ ...row, amount: `₹${number(row.amount).toLocaleString('en-IN')}`, occurred: formatDateTime(row.created_at) })), columns: tableColumns.payments },
  };
};

const paymentsModel = (snapshot) => {
  const c = common(snapshot);
  const escrows = c.data.escrow_orders || [];
  const logs = c.data.payment_logs || [];
  const held = byStatus(escrows, ['funded', 'held']);
  const pending = byStatus(escrows, ['pending', 'processing', 'funded']);
  const completed = byStatus(escrows, ['released', 'paid', 'completed']);
  const failed = byStatus(logs, ['failed', 'error']);
  return {
    description: 'Escrow exposure, releases, payment failures, refunds, and settlement records.',
    metrics: [metric('Escrow Balance', sum(held, 'bid_amount'), 'currency'), metric('Pending Releases', pending.length), metric('Completed Releases', completed.length), metric('Failed Payments', failed.length), metric('Refunds', byStatus(logs, ['refund', 'refunded']).length), metric('Disputes', byStatus(escrows, ['disputed']).length), unavailable('Settlement Time', 'duration')],
    charts: [{ type: 'bar', title: 'Escrow Status', series: groupCount(escrows, 'status') }, { type: 'line', title: 'Transaction Volume', series: dailySeries(logs, 'created_at', 'amount'), format: 'currency' }],
    table: { title: 'Recent Transactions', rows: logs.map((row) => ({ ...row, amount: `₹${number(row.amount).toLocaleString('en-IN')}`, occurred: formatDateTime(row.created_at) })), columns: tableColumns.payments },
  };
};

const operationsModel = (snapshot) => {
  const c = common(snapshot);
  const dedicatedKyc = c.data.kyc_status || [];
  const kyc = dedicatedKyc.length ? dedicatedKyc : [
    ...(c.data.freelancers || []).map((row) => ({ user_id: row.id, status: row.kyc_status || (row.is_kyc_verified ? 'verified' : 'not_started'), provider: 'freelancer profile', submitted_at: row.created_at, source_type: 'freelancer-kyc' })),
    ...(c.data.clients || []).map((row) => ({ user_id: row.id, status: row.kyc_status || (row.is_kyc_verified ? 'verified' : 'not_started'), provider: 'client profile', submitted_at: row.created_at, source_type: 'client-kyc' })),
  ];
  const reports = c.data.reports || [];
  const flags = c.data.consistency_flags || [];
  const rows = [
    ...kyc.map((row) => ({ id: row.user_id, type: row.source_type || 'kyc', queue: 'KYC', subject: row.user_id, status: row.status, reason: row.rejection_reason || row.provider || '—', created: formatDateTime(row.submitted_at) })),
    ...reports.map((row) => ({ id: row.id, type: 'report', queue: 'Report', subject: row.target_id, status: row.status, reason: row.reason, created: formatDateTime(row.created_at) })),
  ];
  return {
    description: 'Verification, trust, moderation, account, and fraud queues with auditable actions.',
    metrics: [metric('Pending KYC', byStatus(kyc, ['pending', 'submitted']).length), metric('Approved KYC', byStatus(kyc, ['verified', 'approved']).length), metric('Rejected KYC', byStatus(kyc, ['rejected']).length), metric('User Reports', reports.length), metric('Moderation Queue', byStatus(reports, ['pending', 'reviewing']).length), metric('Fraud Alerts', flags.filter((row) => row.status !== 'resolved').length), metric('Suspended Accounts', (c.data.profiles || []).filter((row) => row.status === 'suspended').length), metric('Verification Queue', byStatus(kyc, ['pending', 'submitted']).length)],
    charts: [{ type: 'bar', title: 'KYC Outcomes', series: groupCount(kyc, 'status') }, { type: 'bar', title: 'Risk Flags', series: groupCount(flags, 'severity') }],
    table: { title: 'Operations Queue', description: 'Approve, reject, review, or suspend records. Every mutation is written to the admin audit log.', rows, columns: [{ key: 'queue', label: 'Queue' }, { key: 'subject', label: 'Subject' }, { key: 'status', label: 'Status' }, { key: 'reason', label: 'Context' }, { key: 'created', label: 'Created' }], operational: true },
  };
};

const supportModel = (snapshot) => {
  const c = common(snapshot);
  const tickets = c.data.support_tickets || [];
  const closed = byStatus(tickets, ['resolved', 'closed']);
  const resolutionHours = closed.map((row) => (new Date(row.updated_at) - new Date(row.created_at)) / 3600000).filter(Number.isFinite);
  return {
    description: 'Ticket volume, status, and response workload from the support system.',
    metrics: [metric('Open Tickets', tickets.length - closed.length), metric('Closed Tickets', closed.length), unavailable('SLA', 'percent'), metric('Resolution Time', resolutionHours.length ? resolutionHours.reduce((a, b) => a + b, 0) / resolutionHours.length : 0, 'duration'), unavailable('Average Response Time', 'duration'), unavailable('Satisfaction Score', 'decimal')],
    charts: [{ type: 'bar', title: 'Ticket Status', series: groupCount(tickets, 'status') }, { type: 'line', title: 'Ticket Volume', series: dailySeries(tickets, 'created_at') }],
    integrations: ['SLA policy events', 'First-response timestamps', 'Post-resolution CSAT survey'],
    table: { title: 'Support Tickets', rows: tickets.map((row) => ({ ...row, created: formatDateTime(row.created_at), updated: formatDateTime(row.updated_at) })), columns: [{ key: 'subject', label: 'Subject' }, { key: 'user_id', label: 'User' }, { key: 'status', label: 'Status' }, { key: 'created', label: 'Created' }, { key: 'updated', label: 'Updated' }] },
  };
};

const productModel = (snapshot) => {
  const c = common(snapshot);
  const audits = c.data.audit_logs || [];
  const portfolios = c.data.portfolio_items || [];
  return {
    description: 'Persisted product events, content creation, search, portfolio, application, and learning signals.',
    metrics: [metric('Tracked Events', audits.length), metric('Feature Usage', new Set(audits.map((row) => row.action)).size), unavailable('Session Duration', 'duration'), metric('Click Events', audits.filter((row) => /click/i.test(row.action)).length), metric('Portfolio Items', portfolios.length), metric('Applications', c.applications.length), metric('Quiz Events', audits.filter((row) => /quiz/i.test(row.action)).length), metric('Search Usage', audits.filter((row) => /search/i.test(row.action)).length)],
    charts: [{ type: 'bar', title: 'Feature Adoption', series: groupCount(audits, 'action') }, { type: 'line', title: 'Event Volume', series: dailySeries(audits, 'created_at') }, { type: 'bar', title: 'Journey Milestones', series: [{ label: 'Portfolio', value: portfolios.length }, { label: 'Applications', value: c.applications.length }, { label: 'Completed', value: c.completed.length }] }],
    integrations: ['Page-view and clickstream event collector', 'Session identifiers and duration'],
    table: { title: 'Product Events', rows: audits.map((row) => ({ ...row, occurred: formatDateTime(row.created_at), detail: row.details ? JSON.stringify(row.details) : '—' })), columns: [{ key: 'action', label: 'Action' }, { key: 'actor_id', label: 'Actor' }, { key: 'detail', label: 'Details' }, { key: 'occurred', label: 'Occurred' }] },
  };
};

const aiModel = (snapshot) => {
  const logs = snapshot.data.ai_usage_logs || [];
  const external = snapshot.externalTelemetry?.ai;
  const succeeded = logs.filter((row) => row.success === true).length;
  const failed = logs.filter((row) => row.success === false).length;
  return {
    description: 'AI feature requests and outcomes. Token, latency, model, and cost telemetry need additional columns or an observability sink.',
    metrics: [metric('AI Requests', Math.max(logs.length, external?.requests || 0)), external ? metric('Tokens Used', number(external.inputTokens) + number(external.outputTokens)) : unavailable('Tokens Used'), external ? metric('Cost', external.cost, 'currency') : unavailable('Cost', 'currency'), metric('Success Rate', rate(succeeded, logs.length), 'percent'), metric('Failure Rate', rate(failed, logs.length), 'percent'), unavailable('Average Response Time', 'milliseconds'), metric('AI Features', new Set(logs.map((row) => row.type)).size), external ? metric('Models Used', external.models?.length || 0) : unavailable('Models Used')],
    charts: [{ type: 'bar', title: 'Most Used AI Features', series: groupCount(logs, 'type') }, { type: 'bar', title: 'Provider & Model Usage', series: external?.models || [] }, { type: 'line', title: 'Request Volume', series: dailySeries(logs, 'created_at') }],
    integrations: ['Token input/output counts', 'Provider and model identifier', 'Request latency', 'Provider cost'],
    table: { title: 'AI Request Log', rows: logs.map((row) => ({ ...row, outcome: row.success === true ? 'Success' : row.success === false ? 'Failed' : 'Unknown', occurred: formatDateTime(row.created_at) })), columns: [{ key: 'type', label: 'Feature' }, { key: 'category', label: 'Category' }, { key: 'sub_category', label: 'Subcategory' }, { key: 'outcome', label: 'Outcome' }, { key: 'occurred', label: 'Occurred' }] },
  };
};

const infrastructureModel = (snapshot) => {
  const infrastructure = snapshot.externalTelemetry?.infrastructure;
  const vercel = infrastructure?.vercel;
  return {
  description: 'Live Supabase, Cloudflare D1/edge, and Vercel production availability telemetry.',
  metrics: [metric('Supabase API Latency', snapshot.apiLatencyMs, 'milliseconds'), metric('Database Health', snapshot.issues.length ? 0 : 100, 'percent'), infrastructure ? metric('D1 Query Latency', infrastructure.d1LatencyMs, 'milliseconds') : unavailable('D1 Query Latency', 'milliseconds'), vercel?.latencyMs !== null && vercel?.latencyMs !== undefined ? metric('Vercel Latency', vercel.latencyMs, 'milliseconds') : unavailable('Vercel Latency', 'milliseconds'), unavailable('Storage Usage'), unavailable('Cache Hit Rate', 'percent'), metric('Data Source Errors', snapshot.issues.length), vercel ? metric('Vercel Uptime Probe', vercel.status === 'healthy' ? 100 : 0, 'percent') : unavailable('Vercel Uptime Probe', 'percent')],
  statuses: [
    { label: 'Supabase Data API', status: snapshot.issues.length ? 'warning' : 'healthy', description: snapshot.issues.length ? `${snapshot.issues.length} source query failures.` : `Responsive in ${snapshot.apiLatencyMs} ms.` },
    { label: 'Cloudflare D1 & Edge', status: infrastructure?.d1Status || 'unknown', description: infrastructure ? `D1 queried in ${infrastructure.d1LatencyMs} ms via ${infrastructure.edgeColo || 'the nearest edge'}.` : 'Command Center telemetry is not connected.' },
    { label: 'Vercel production', status: vercel?.status || 'unknown', description: vercel ? `HTTP ${vercel.statusCode || 'unavailable'} in ${vercel.latencyMs ?? '—'} ms.` : 'Vercel production probe is not configured.' },
    { label: 'Object storage', status: 'unknown', description: 'Connect R2 usage metrics for bucket and transfer totals.' },
  ],
  integrations: ['R2 usage metrics', 'Vercel Web Analytics data export', 'Cloudflare zone traffic GraphQL dataset'],
  charts: [],
  };
};

const securityModel = (snapshot) => {
  const audits = snapshot.data.audit_logs || [];
  const suspicious = audits.filter((row) => /fail|suspicious|fraud|blocked|ban/i.test(row.action));
  return {
    description: 'Rate limiting, suspicious events, account risk, and security operations from persisted audit sources.',
    metrics: [metric('Failed Logins', audits.filter((row) => /login.*fail|fail.*login/i.test(row.action)).length), metric('Suspicious Activity', suspicious.length), unavailable('Rate Limit Hits'), unavailable('OTP Abuse'), metric('Fraud Detection', (snapshot.data.consistency_flags || []).length), unavailable('Device Changes'), unavailable('Login Locations'), metric('Account Lockouts', (snapshot.data.profiles || []).filter((row) => ['suspended', 'banned', 'locked'].includes(row.status)).length)],
    charts: [{ type: 'line', title: 'Security Timeline', series: dailySeries(suspicious, 'created_at') }],
    integrations: ['Protected auth rate-limit telemetry endpoint', 'Authentication sign-in logs', 'Device fingerprint history', 'Geo-IP login enrichment'],
    table: { title: 'Recent Security Events', rows: suspicious.map((row) => ({ ...row, occurred: formatDateTime(row.created_at), detail: row.details ? JSON.stringify(row.details) : '—' })), columns: [{ key: 'action', label: 'Action' }, { key: 'actor_id', label: 'Actor' }, { key: 'detail', label: 'Context' }, { key: 'occurred', label: 'Occurred' }] },
  };
};

const teamModel = () => ({
  description: 'Team delivery workspace. No team, task, sprint, deployment, or calendar tables exist yet, so the module exposes explicit integration points.',
  metrics: [unavailable('Team Members'), unavailable('Assigned Tasks'), unavailable('Completed Tasks'), unavailable('Pending Tasks'), unavailable('Sprint Progress', 'percent'), unavailable('Productivity', 'percent'), unavailable('Bugs Fixed'), unavailable('Deployments')],
  charts: [],
  statuses: [{ label: 'Kanban', status: 'unknown', description: 'Connect a tasks table or Linear/Jira integration.' }, { label: 'Calendar', status: 'unknown', description: 'Connect sprint dates and team availability.' }],
  integrations: ['Team membership and permission tables', 'Task and sprint service', 'Deployment event webhook', 'Calendar integration'],
});

const connectorsModel = (snapshot) => ({
  description: 'Unified server-side connector registry. Credentials stay outside the browser and every integration exposes health, retry, caching, and rate-limit behavior.',
  metrics: [
    metric('Connectors', snapshot.connectorHealth?.length || 0),
    metric('Healthy', (snapshot.connectorHealth || []).filter((item) => item.status === 'healthy').length),
    metric('Needs Configuration', (snapshot.connectorHealth || []).filter((item) => item.status === 'not_configured').length),
    metric('Errors', (snapshot.connectorHealth || []).filter((item) => item.status === 'error').length),
  ],
  connectors: snapshot.connectorHealth || [],
  charts: [],
});

const permissionsModel = () => ({
  description: 'Role-to-module access matrix. Authorization decisions use app metadata or server-controlled staff fields, never editable user metadata.',
  metrics: [metric('Roles', 8), metric('Policy Groups', 11), unavailable('Custom Overrides')],
  charts: [],
  permissions: true,
});

const notificationsModel = () => ({
  description: 'Personal Command Center alert preferences. Persist these settings through a staff-preferences endpoint when available.',
  metrics: [unavailable('Saved Preferences'), unavailable('Scheduled Reports')],
  charts: [],
  notificationPreferences: true,
  integrations: ['Staff notification-preferences endpoint', 'Scheduled report automation endpoint'],
});

const auditModel = (snapshot) => {
  const rows = [
    ...(snapshot.data.admin_audit_logs || []).map((row) => ({ id: row.id, action: row.action_type, actor: row.admin_id || 'System', target: row.target_id || '—', occurred: formatDateTime(row.created_at) })),
    ...(snapshot.data.audit_logs || []).map((row) => ({ id: row.id, action: row.action, actor: row.actor_id || 'System', target: row.target_id || '—', occurred: formatDateTime(row.created_at) })),
  ];
  return {
    description: 'Immutable operational and product audit events available to authorized staff.',
    metrics: [metric('Audit Events', rows.length), metric('Admin Actions', snapshot.data.admin_audit_logs?.length || 0), metric('Product Actions', snapshot.data.audit_logs?.length || 0)],
    charts: [{ type: 'bar', title: 'Action Distribution', series: groupCount(rows, 'action') }],
    table: { title: 'Audit Log', rows, columns: [{ key: 'action', label: 'Action' }, { key: 'actor', label: 'Actor' }, { key: 'target', label: 'Target' }, { key: 'occurred', label: 'Occurred' }] },
  };
};

const executiveModel = (snapshot) => {
  const c = common(snapshot);
  const totalUsers = snapshot.totals.profiles || 0;
  const openJobs = (c.data.jobs || []).filter((row) => !row.is_archived).length;
  const marketplaceHealth = rate(c.completed.length + openJobs, Math.max(c.applications.length + openJobs, 1));
  return {
    description: 'Minimal investor-ready summary of scale, engagement, marketplace throughput, and revenue.',
    metrics: [metric('Users', totalUsers), metric('Revenue', c.commission, 'currency'), metric('GMV', c.gmv, 'currency'), metric('Growth', snapshot.rangeCounts.profiles || 0), unavailable('Burn Rate', 'currency'), unavailable('Runway'), metric('Active Users', uniqueActorsSince(c.data.audit_logs || [], 30)), metric('Marketplace Health', marketplaceHealth, 'percent')],
    charts: [{ type: 'line', title: 'User Growth', series: dailySeries(c.data.profiles || [], 'created_at') }, { type: 'line', title: 'GMV Trend', series: dailySeries(c.paidApplications, 'paid_at', 'bid_amount'), format: 'currency' }, { type: 'bar', title: 'Marketplace Outcomes', series: [{ label: 'Applications', value: c.applications.length }, { label: 'Hires', value: c.hired.length }, { label: 'Completed', value: c.completed.length }] }],
    integrations: ['Operating expense ledger for burn and runway'],
  };
};

const liveModel = (snapshot, liveRows = []) => {
  const c = common(snapshot);
  const rows = [...liveRows.map((row) => ({ ...row, detail: row.record?.title || row.record?.subject || row.event, source: row.type, occurred: formatDateTime(row.created_at) })), ...c.activity].slice(0, 250);
  return {
    description: 'Realtime stream from core Supabase tables with pause, search, and source filtering.',
    metrics: [metric('Stream Events', rows.length), metric('Live Sources', new Set(rows.map((row) => row.source)).size), metric('New Users', rows.filter((row) => /user/i.test(row.event)).length), metric('Payment Events', rows.filter((row) => /payment/i.test(row.event)).length)],
    charts: [{ type: 'bar', title: 'Activity by Source', series: groupCount(rows, 'source') }],
    table: { title: 'Live Activity Stream', rows, columns: tableColumns.activity },
  };
};

const specializeModel = (moduleId, model, snapshot) => {
  const data = snapshot.data || {};
  const withTable = (description, title, rows, columns) => ({ ...model, description, table: { title, rows, columns } });
  const occurred = (value) => formatDateTime(value);

  if (moduleId === 'users') return withTable('Search and monitor all admin-readable user profiles.', 'Users', (data.profiles || []).map((row) => ({ ...row, created: occurred(row.created_at) })), [{ key: 'full_name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'role', label: 'Role' }, { key: 'status', label: 'Status' }, { key: 'created', label: 'Created' }]);
  if (moduleId === 'freelancers') return withTable('Freelancer growth, verification, availability, and quality signals.', 'Freelancers', (data.freelancers || []).map((row) => ({ ...row, created: occurred(row.created_at) })), [{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'kyc_status', label: 'KYC' }, { key: 'completion_rate', label: 'Completion' }, { key: 'created', label: 'Created' }]);
  if (moduleId === 'clients') return withTable('Client acquisition, verification, and marketplace demand.', 'Clients', (data.clients || []).map((row) => ({ ...row, created: occurred(row.created_at) })), [{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'kyc_status', label: 'KYC' }, { key: 'source', label: 'Source' }, { key: 'created', label: 'Created' }]);
  if (moduleId === 'website-analytics') {
    const web = snapshot.externalTelemetry?.web;
    if (!web) return model;
    return {
      ...model,
      description: 'First-party page and product events captured by the Cloudflare Worker and stored in D1.',
      metrics: [metric('Visitors', web.visitors), metric('Page Views', web.pageViews), metric('Tracked Events', web.events), metric('Top Paths', web.topPaths?.length || 0), unavailable('Bounce Rate', 'percent'), unavailable('Session Duration', 'duration')],
      charts: [{ type: 'line', title: 'Website Activity', series: web.dailyEvents || [] }, { type: 'bar', title: 'Top Paths', series: web.topPaths || [] }, { type: 'bar', title: 'Event Distribution', series: web.eventTypes || [] }],
      table: { title: 'Top Website Paths', rows: (web.topPaths || []).map((row) => ({ id: row.label, path: row.label, events: row.value })), columns: [{ key: 'path', label: 'Path' }, { key: 'events', label: 'Events' }] },
      integrations: ['GA4 demographics and sessions', 'Clarity heatmaps and recordings'],
    };
  }
  if (moduleId === 'search-analytics') {
    const search = snapshot.externalTelemetry?.search;
    if (!search) return model;
    return {
      ...model,
      description: 'First-party search volume and zero-result outcomes from the Cloudflare D1 event store.',
      metrics: [metric('Searches', search.searches), metric('Zero-result Searches', search.zeroResultSearches), metric('Success Rate', rate(number(search.searches) - number(search.zeroResultSearches), search.searches), 'percent')],
      charts: [],
      table: undefined,
      integrations: ['Search-term taxonomy and click-through tracking'],
    };
  }
  if (moduleId === 'deployments') {
    const deployments = snapshot.externalTelemetry?.infrastructure?.deployments || [];
    return {
      ...model,
      description: 'Vercel and Cloudflare deployment history synchronized into the Command Center telemetry store.',
      metrics: [metric('Recorded Deployments', deployments.length), metric('Ready', deployments.filter((row) => row.state === 'READY').length), metric('Failed', deployments.filter((row) => /ERROR|FAILED/i.test(row.state || '')).length)],
      charts: [{ type: 'bar', title: 'Deployment State', series: groupCount(deployments, 'state') }],
      table: { title: 'Deployment History', rows: deployments.map((row) => ({ ...row, created: occurred(row.created_at), commit: row.commit_sha?.slice(0, 8) || '—' })), columns: [{ key: 'provider', label: 'Provider' }, { key: 'project_name', label: 'Project' }, { key: 'state', label: 'State' }, { key: 'target', label: 'Target' }, { key: 'commit', label: 'Commit' }, { key: 'created', label: 'Created' }] },
      integrations: [],
    };
  }
  if (moduleId === 'applications') return withTable('Application volume and progress through the hiring funnel.', 'Applications', (data.applications || []).map((row) => ({ ...row, amount: `₹${number(row.bid_amount).toLocaleString('en-IN')}`, created: occurred(row.created_at) })), [{ key: 'id', label: 'Application' }, { key: 'status', label: 'Status' }, { key: 'amount', label: 'Bid' }, { key: 'payment_status', label: 'Payment' }, { key: 'created', label: 'Created' }]);
  if (moduleId === 'orders') return withTable('Order and escrow execution state across marketplace work.', 'Orders', (data.escrow_orders || []).map((row) => ({ ...row, amount: `₹${number(row.bid_amount).toLocaleString('en-IN')}`, created: occurred(row.created_at) })), [{ key: 'id', label: 'Order' }, { key: 'status', label: 'Status' }, { key: 'amount', label: 'Amount' }, { key: 'client_id', label: 'Client' }, { key: 'created', label: 'Created' }]);
  if (['escrow', 'payouts', 'refunds'].includes(moduleId)) {
    const source = moduleId === 'refunds' ? (data.payment_logs || []).filter((row) => /refund/i.test(row.status || '')) : (data.escrow_orders || []).filter((row) => moduleId === 'payouts' ? /released|paid|processing/i.test(row.status || '') : true);
    return { ...model, description: `${moduleId.charAt(0).toUpperCase() + moduleId.slice(1)} ledger and operational state.`, table: moduleId === 'refunds' ? { title: 'Refunds', rows: source.map((row) => ({ ...row, occurred: occurred(row.created_at) })), columns: [{ key: 'id', label: 'ID' }, { key: 'status', label: 'Status' }, { key: 'amount', label: 'Amount' }, { key: 'occurred', label: 'Occurred' }] } : { title: moduleId === 'payouts' ? 'Payouts' : 'Escrow Orders', rows: source.map((row) => ({ ...row, occurred: occurred(row.created_at) })), columns: [{ key: 'id', label: 'Order' }, { key: 'status', label: 'Status' }, { key: 'bid_amount', label: 'Amount' }, { key: 'freelancer_id', label: 'Freelancer' }, { key: 'occurred', label: 'Occurred' }] } };
  }
  if (['kyc', 'verification-queue'].includes(moduleId) && model.table) return { ...model, description: 'Identity verification queue with auditable review actions.', table: { ...model.table, title: 'KYC & Verification Queue', rows: model.table.rows.filter((row) => row.queue === 'KYC') } };
  if (['reports', 'moderation'].includes(moduleId) && model.table) return { ...model, description: 'User reports and moderation workflow.', table: { ...model.table, title: 'Reports & Moderation', rows: model.table.rows.filter((row) => row.queue === 'Report') } };
  if (moduleId === 'fraud-detection') return withTable('Consistency, trust, and fraud signals requiring operations review.', 'Fraud & Consistency Flags', (data.consistency_flags || []).map((row) => ({ ...row, created: occurred(row.created_at) })), [{ key: 'severity', label: 'Severity' }, { key: 'code', label: 'Code' }, { key: 'message', label: 'Message' }, { key: 'status', label: 'Status' }, { key: 'created', label: 'Created' }]);
  return model;
};

export const buildDashboardModel = (dashboardId, snapshot, liveRows = [], moduleId = dashboardId) => {
  const builders = {
    founder: founderModel,
    marketing: marketingModel,
    'user-growth': growthModel,
    marketplace: marketplaceModel,
    revenue: revenueModel,
    payments: paymentsModel,
    operations: operationsModel,
    support: supportModel,
    product: productModel,
    ai: aiModel,
    infrastructure: infrastructureModel,
    security: securityModel,
    team: teamModel,
    executive: executiveModel,
    live: (value) => liveModel(value, liveRows),
    connectors: connectorsModel,
    permissions: permissionsModel,
    notifications: notificationsModel,
    audit: auditModel,
  };
  return specializeModel(moduleId, (builders[dashboardId] || founderModel)(snapshot), snapshot);
};
