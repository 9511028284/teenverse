import { supabase } from '../supabase';

const DEFAULT_LIMIT = 1000;

const TABLE_SPECS = [
  ['profiles', 'id,full_name,email,role,status,onboarding_completed,age_verified,created_at,updated_at', 'created_at'],
  ['freelancers', 'id,name,email,source,status,kyc_status,is_kyc_verified,last_login_date,completion_rate,rating,specialty,created_at', 'created_at'],
  ['clients', 'id,name,email,source,status,kyc_status,is_kyc_verified,created_at', 'created_at'],
  ['jobs', 'id,title,category,budget,client_id,hired_freelancer_id,is_archived,created_at', 'created_at'],
  ['services', 'id,title,category,price,freelancer_id,is_archived,created_at', 'created_at'],
  ['applications', 'id,status,bid_amount,platform_fee,payment_status,is_escrow_held,client_id,freelancer_id,created_at,started_at,submitted_at,completed_at,paid_at', 'created_at'],
  ['escrow_orders', 'id,status,bid_amount,client_id,freelancer_id,created_at,updated_at', 'created_at'],
  ['payment_logs', 'id,status,amount,order_id,raw_data,created_at', 'created_at'],
  ['support_tickets', 'id,user_id,subject,status,created_at,updated_at', 'created_at'],
  ['reports', 'id,reason,status,target_type,target_id,reporter_id,reported_user_id,created_at', 'created_at'],
  ['portfolio_items', 'id,user_id,title,created_at', 'created_at'],
  ['opportunities', 'id,title,type,status,work_mode,stipend_min,stipend_max,business_id,created_at,published_at', 'created_at'],
  ['opportunity_applications', 'id,status,applicant_id,opportunity_id,applied_at,updated_at', 'applied_at'],
  ['ai_usage_logs', 'id,type,category,sub_category,success,created_at', 'created_at'],
  ['audit_logs', 'id,action,actor_id,target_id,details,created_at', 'created_at'],
  ['admin_audit_logs', 'id,action_type,admin_id,target_id,metadata,created_at', 'created_at'],
  ['consistency_flags', 'id,code,message,severity,status,user_id,target_type,target_id,created_at,resolved_at', 'created_at'],
];

const countTable = async (table) => {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count || 0;
};

const fetchRange = async ([table, columns, dateColumn], { from, to, limit }) => {
  let query = supabase
    .from(table)
    .select(columns, { count: 'exact' })
    .order(dateColumn, { ascending: false, nullsFirst: false })
    .limit(limit);

  if (from) query = query.gte(dateColumn, from);
  if (to) query = query.lte(dateColumn, to);

  const { data, count, error } = await query;
  if (error) throw error;
  return { table, rows: data || [], count: count || 0 };
};

const previousPeriod = (from, to) => {
  if (!from || !to) return {};
  const start = new Date(from);
  const end = new Date(to);
  const duration = Math.max(1, end.getTime() - start.getTime());
  return {
    from: new Date(start.getTime() - duration - 1).toISOString(),
    to: new Date(start.getTime() - 1).toISOString(),
  };
};

const countRange = async ([table, , dateColumn], { from, to }) => {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  if (from) query = query.gte(dateColumn, from);
  if (to) query = query.lte(dateColumn, to);
  const { count, error } = await query;
  if (error) throw error;
  return [table, count || 0];
};

export const fetchAdminAnalyticsSnapshot = async ({ from, to, limit = DEFAULT_LIMIT } = {}) => {
  const startedAt = performance.now();
  const issues = [];
  const previousRange = previousPeriod(from, to);

  const [rangeResults, totalResults, previousResults] = await Promise.all([
    Promise.all(TABLE_SPECS.map(async (spec) => {
      try {
        return await fetchRange(spec, { from, to, limit });
      } catch (error) {
        issues.push({ source: spec[0], message: error.message });
        return { table: spec[0], rows: [], count: 0 };
      }
    })),
    Promise.all(['profiles', 'freelancers', 'clients', 'jobs', 'services'].map(async (table) => {
      try {
        return [table, await countTable(table)];
      } catch (error) {
        issues.push({ source: table, message: error.message });
        return [table, 0];
      }
    })),
    Promise.all(TABLE_SPECS.map(async (spec) => {
      try {
        return await countRange(spec, previousRange);
      } catch (error) {
        issues.push({ source: `${spec[0]} previous period`, message: error.message });
        return [spec[0], 0];
      }
    })),
  ]);

  return {
    range: { from, to },
    data: Object.fromEntries(rangeResults.map(({ table, rows }) => [table, rows])),
    rangeCounts: Object.fromEntries(rangeResults.map(({ table, count }) => [table, count])),
    previousRange,
    previousRangeCounts: Object.fromEntries(previousResults),
    totals: Object.fromEntries(totalResults),
    issues,
    measuredAt: new Date().toISOString(),
    apiLatencyMs: Math.round(performance.now() - startedAt),
  };
};

export const updateOperationsRecord = async ({ type, id, status }) => {
  if (!id || !type || !status) throw new Error('Missing operation parameters.');

  if (type === 'kyc') {
    const updates = {
      status,
      verified_at: status === 'verified' ? new Date().toISOString() : null,
    };
    const { error } = await supabase.from('kyc_status').update(updates).eq('user_id', id);
    if (error) throw error;
  } else if (type === 'freelancer-kyc' || type === 'client-kyc') {
    const table = type === 'client-kyc' ? 'clients' : 'freelancers';
    const updates = {
      kyc_status: status,
      is_kyc_verified: status === 'verified',
      kyc_reviewed_at: new Date().toISOString(),
    };
    const { error } = await supabase.from(table).update(updates).eq('id', id);
    if (error) throw error;
  } else if (type === 'report') {
    const { error } = await supabase.from('reports').update({ status }).eq('id', id);
    if (error) throw error;
  } else if (type === 'profile') {
    const { error } = await supabase.from('profiles').update({ status }).eq('id', id);
    if (error) throw error;
  } else {
    throw new Error('Unsupported operation type.');
  }

  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('admin_audit_logs').insert({
    admin_id: user?.id || null,
    action_type: `ADMIN_${type.toUpperCase()}_${status.toUpperCase()}`,
    target_id: String(id),
    metadata: { type, status, source: 'analytics_operations_dashboard' },
  });
};

export const searchCommandCenter = async (input) => {
  const term = String(input || '').trim();
  if (term.length < 2) return [];
  const safeTerm = term.replace(/[^\p{L}\p{N}@.\-\s]/gu, ' ').trim();
  if (safeTerm.length < 2) return [];
  const numericId = /^\d+$/.test(safeTerm) ? Number(safeTerm) : null;

  const queries = [
    ['user', supabase.from('profiles').select('id,full_name,email,role,status').or(`full_name.ilike.%${safeTerm}%,email.ilike.%${safeTerm}%`).limit(8), (row) => ({ id: row.id, type: 'user', title: row.full_name || row.email || row.id, detail: `${row.role} · ${row.status}`, module: 'users' })],
    ['job', supabase.from('jobs').select('id,title,category,budget').ilike('title', `%${safeTerm}%`).limit(8), (row) => ({ id: row.id, type: 'job', title: row.title, detail: `${row.category || 'Uncategorized'} · ₹${Number(row.budget || 0).toLocaleString('en-IN')}`, module: 'jobs' })],
    ['order', supabase.from('escrow_orders').select('id,status,bid_amount,client_id').ilike('id', `%${safeTerm}%`).limit(8), (row) => ({ id: row.id, type: 'order', title: `Order ${row.id}`, detail: `${row.status} · ₹${Number(row.bid_amount || 0).toLocaleString('en-IN')}`, module: 'orders' })],
    ['ticket', supabase.from('support_tickets').select('id,subject,status,user_id').ilike('subject', `%${safeTerm}%`).limit(8), (row) => ({ id: row.id, type: 'ticket', title: row.subject, detail: row.status, module: 'tickets' })],
    ['report', supabase.from('reports').select('id,reason,status,target_type,target_id').ilike('reason', `%${safeTerm}%`).limit(8), (row) => ({ id: row.id, type: 'report', title: row.reason, detail: `${row.target_type || 'target'} · ${row.status}`, module: 'reports' })],
    ['payment', supabase.from('payment_logs').select('id,order_id,status,amount').ilike('order_id', `%${safeTerm}%`).limit(8), (row) => ({ id: row.id, type: 'payment', title: `Payment ${row.order_id}`, detail: `${row.status} · ₹${Number(row.amount || 0).toLocaleString('en-IN')}`, module: 'payments' })],
    ['activity', supabase.from('audit_logs').select('id,action,actor_id,created_at').ilike('action', `%${safeTerm}%`).limit(8), (row) => ({ id: row.id, type: 'activity', title: row.action, detail: row.actor_id || 'System', module: 'audit-logs' })],
  ];

  if (numericId !== null) {
    queries.push(['application', supabase.from('applications').select('id,status,bid_amount,freelancer_id').eq('id', numericId).limit(1), (row) => ({ id: row.id, type: 'application', title: `Application #${row.id}`, detail: `${row.status} · ${row.freelancer_id || 'Unknown freelancer'}`, module: 'applications' })]);
  }

  const settled = await Promise.all(queries.map(async ([, query, map]) => {
    const { data, error } = await query;
    if (error) return [];
    return (data || []).map(map);
  }));

  return settled.flat().slice(0, 30);
};

const LIVE_TABLES = [
  ['profiles', 'New user registered'],
  ['jobs', 'Job posted'],
  ['applications', 'Application submitted'],
  ['payment_logs', 'Payment event received'],
  ['freelancers', 'Freelancer profile updated'],
  ['clients', 'Client profile updated'],
  ['support_tickets', 'Support ticket created'],
];

export const subscribeToAdminActivity = (onEvent) => {
  const channel = supabase.channel(`admin-live-activity-${crypto.randomUUID()}`);

  LIVE_TABLES.forEach(([table, label]) => {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
      onEvent({
        id: `${table}-${payload.commit_timestamp || Date.now()}-${payload.new?.id || payload.old?.id || ''}`,
        type: table,
        label,
        event: payload.eventType,
        created_at: payload.commit_timestamp || new Date().toISOString(),
        record: payload.new || payload.old || {},
      });
    });
  });

  channel.subscribe();
  return () => supabase.removeChannel(channel);
};
