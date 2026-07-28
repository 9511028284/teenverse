import { supabase } from '../supabase';

const getFunctionErrorMessage = async (error, fallback) => {
  const contextBody = await error?.context?.json?.().catch(() => null);
  return contextBody?.error || contextBody?.message || error?.message || fallback;
};

const invokeMarketingEvents = async (body, fallback = 'Marketing event request failed.') => {
  const { data, error } = await supabase.functions.invoke('marketing-events', { body });
  if (error) throw new Error(await getFunctionErrorMessage(error, fallback));
  if (data?.error) throw new Error(data.error);
  return data;
};

export const fetchActiveMarketingEvent = () => (
  invokeMarketingEvents({ action: 'get_active_event' }, 'Could not load the active event.')
);

export const trackMarketingEvent = ({ viewType, intent, source }) => (
  invokeMarketingEvents({
    action: 'track_event',
    viewType,
    intent,
    source,
  }, 'Could not record event activity.')
);

export const submitMarketingEvent = (payload) => (
  invokeMarketingEvents({
    action: 'submit_event',
    ...payload,
  }, 'Could not submit your event entry.')
);

export const fetchMarketingEventsAdmin = () => (
  invokeMarketingEvents({ action: 'admin_list' }, 'Could not load marketing event admin data.')
);

export const reviewMarketingSubmission = ({ submissionId, reviewAction, reviewNotes, internalNotes }) => (
  invokeMarketingEvents({
    action: 'admin_review',
    submissionId,
    reviewAction,
    reviewNotes,
    internalNotes,
  }, 'Could not update the submission.')
);

export const isMarketingEventJob = (job) => (
  job?.is_marketing_event === true ||
  Boolean(job?.marketing_event_id) ||
  String(job?.job_type || '').toLowerCase() === 'marketing event'
);
