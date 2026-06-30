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
const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
const workerUrl = process.env.AUX_WORKER_URL!.replace(/\/$/, '');

const hasColumn = async (table: string, column: string) => {
  const { error } = await supabase
    .from(table)
    .select(column)
    .limit(1);

  return !error;
};

const postArchive = async (row: Record<string, unknown>) => {
  const response = await fetch(`${workerUrl}/v1/archive/notification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': process.env.AUX_WORKER_INTERNAL_SECRET!,
    },
    body: JSON.stringify({
      id: `notification:${row.id}`,
      supabase_notification_id: String(row.id),
      user_id: String(row.user_id),
      title: row.title || null,
      body: row.body || row.message || null,
      type: row.type || null,
      payload: row,
      original_created_at: row.created_at || null,
      archived_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Worker archive failed for notification ${row.id}: ${response.status}`);
  }
};

const main = async () => {
  const supportsArchivedAt = await hasColumn('notifications', 'archived_at');
  const supportsArchivedToD1At = await hasColumn('notifications', 'archived_to_d1_at');
  const markerColumn = supportsArchivedAt ? 'archived_at' : supportsArchivedToD1At ? 'archived_to_d1_at' : null;

  let query = supabase
    .from('notifications')
    .select('*')
    .lt('created_at', cutoff)
    .not('user_id', 'is', null)
    .order('created_at', { ascending: true })
    .limit(batchLimit);

  if (markerColumn) {
    query = query.is(markerColumn, null);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = data || [];
  console.info(JSON.stringify({
    dryRun,
    execute,
    cutoff,
    candidateCount: rows.length,
    markerColumn,
  }, null, 2));

  if (dryRun) return;

  let copied = 0;
  let marked = 0;

  for (const row of rows) {
    await postArchive(row);
    copied += 1;

    if (markerColumn) {
      const { error: updateError } = await supabase
        .from('notifications')
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
