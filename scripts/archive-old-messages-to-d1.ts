import { createClient } from '@supabase/supabase-js';

const REQUIRED_ENV = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'AUX_WORKER_INTERNAL_SECRET',
  'AUX_WORKER_URL',
] as const;

const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Missing required env: ${missing.join(', ')}`);
}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

const execute = process.argv.includes('--execute');
const dryRun = !execute;
const batchLimit = Number(process.env.ARCHIVE_BATCH_LIMIT || 250);
const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
const workerUrl = process.env.AUX_WORKER_URL!.replace(/\/$/, '');
const ARCHIVABLE_APPLICATION_STATUSES = new Set([
  'Completed',
  'completed',
  'Paid',
  'paid',
  'Rejected',
  'rejected',
  'Cancelled',
  'cancelled',
  'Canceled',
  'canceled',
  'Closed',
  'closed',
  'Refunded',
  'refunded',
  'Completed & Paid',
  'completed_paid',
]);

const hasColumn = async (table: string, column: string) => {
  const { error } = await supabase
    .from(table)
    .select(column)
    .limit(1);

  return !error;
};

const postArchive = async (row: Record<string, unknown>) => {
  const response = await fetch(`${workerUrl}/v1/archive/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': process.env.AUX_WORKER_INTERNAL_SECRET!,
    },
    body: JSON.stringify({
      id: `message:${row.id}`,
      supabase_message_id: String(row.id),
      application_id: row.application_id ? String(row.application_id) : null,
      sender_id: String(row.sender_id),
      receiver_id: String(row.receiver_id),
      body: row.content || row.body || null,
      metadata: {
        client_temp_id: row.client_temp_id || null,
        file_name: row.file_name || null,
        has_file: Boolean(row.file_url),
      },
      original_created_at: row.created_at || null,
      archived_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Worker archive failed for message ${row.id}: ${response.status}`);
  }
};

const getClosedApplicationIds = async (applicationIds: string[]) => {
  if (!applicationIds.length) return new Set<string>();

  const { data, error } = await supabase
    .from('applications')
    .select('id,status')
    .in('id', applicationIds);

  if (error) throw error;

  return new Set(
    (data || [])
      .filter((row) => ARCHIVABLE_APPLICATION_STATUSES.has(String(row.status || '')))
      .map((row) => String(row.id)),
  );
};

const main = async () => {
  const supportsArchivedAt = await hasColumn('messages', 'archived_at');
  const supportsArchivedToD1At = await hasColumn('messages', 'archived_to_d1_at');
  const markerColumn = supportsArchivedAt ? 'archived_at' : supportsArchivedToD1At ? 'archived_to_d1_at' : null;

  let query = supabase
    .from('messages')
    .select('*')
    .lt('created_at', cutoff)
    .order('created_at', { ascending: true })
    .limit(batchLimit);

  if (markerColumn) {
    query = query.is(markerColumn, null);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = data || [];
  const applicationIds = [
    ...new Set(rows.map((row) => row.application_id).filter(Boolean).map(String)),
  ];
  const closedApplicationIds = await getClosedApplicationIds(applicationIds);
  const archivableRows = rows.filter((row) => {
    if (!row.application_id) return true;
    return closedApplicationIds.has(String(row.application_id));
  });

  console.info(JSON.stringify({
    dryRun,
    execute,
    cutoff,
    candidateCount: rows.length,
    archivableCount: archivableRows.length,
    skippedOpenApplicationCount: rows.length - archivableRows.length,
    markerColumn,
  }, null, 2));

  if (dryRun) return;

  let copied = 0;
  let marked = 0;

  for (const row of archivableRows) {
    await postArchive(row);
    copied += 1;

    if (markerColumn) {
      const { error: updateError } = await supabase
        .from('messages')
        .update({ [markerColumn]: new Date().toISOString() })
        .eq('id', row.id);

      if (updateError) throw updateError;
      marked += 1;
    }
  }

  console.info(JSON.stringify({
    dryRun,
    execute,
    copied,
    marked,
    deletedFromSupabase: 0,
  }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
