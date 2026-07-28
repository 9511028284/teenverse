import { supabase } from '../supabase';

const unwrapFunctionData = (payload) => (payload?.success ? payload.data : payload);

const getFunctionErrorMessage = async (error, fallback) => {
  const contextBody = await error?.context?.json?.().catch(() => null);
  return contextBody?.error || contextBody?.message || error?.message || fallback;
};

const invokeFunction = async (name, body, fallback) => {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new Error(await getFunctionErrorMessage(error, fallback));
  const payload = unwrapFunctionData(data);
  if (payload?.error) throw new Error(payload.error);
  return payload;
};

export const createSkillChallenge = ({ userId, category, topic, jobId, jobTitle }) => (
  invokeFunction('trust-engine', {
    action: 'create_challenge',
    userId,
    category,
    topic,
    jobId,
    jobTitle,
  }, 'Could not create skill challenge.')
);

export const autosaveSkillChallenge = ({ userId, challengeId, draft }) => (
  invokeFunction('trust-engine', {
    action: 'autosave_challenge',
    userId,
    challengeId,
    draft,
  }, 'Could not autosave challenge.')
);

export const submitSkillChallenge = ({ userId, challengeId, submission }) => (
  invokeFunction('trust-engine', {
    action: 'submit_challenge',
    userId,
    challengeId,
    submission,
  }, 'Could not evaluate challenge.')
);

export const verifyPortfolio = ({ userId, projects, questions, answers }) => (
  invokeFunction('trust-engine', {
    action: 'verify_portfolio',
    userId,
    projects,
    questions,
    answers,
  }, 'Could not verify portfolio.')
);

export const recalculateTrustScore = (userId) => (
  invokeFunction('trust-engine', {
    action: 'recalculate_trust',
    userId,
  }, 'Could not recalculate trust score.')
);

export const matchApplicantsForJob = (jobId) => (
  invokeFunction('match-applicants', { jobId }, 'Could not rank applicants.')
);

export const createTrial = (payload) => (
  invokeFunction('trial-workflow', { action: 'create_trial', ...payload }, 'Could not create paid trial.')
);

export const acceptTrial = (trialId) => (
  invokeFunction('trial-workflow', { action: 'accept_trial', trialId }, 'Could not accept paid trial.')
);

export const submitTrial = ({ trialId, submission }) => (
  invokeFunction('trial-workflow', { action: 'submit_trial', trialId, submission }, 'Could not submit paid trial.')
);

export const reviewTrial = (trialId) => (
  invokeFunction('trial-workflow', { action: 'review_trial', trialId }, 'Could not review paid trial.')
);

export const approveTrial = ({ trialId, rating, review }) => (
  invokeFunction('trial-workflow', { action: 'approve_trial', trialId, rating, review }, 'Could not approve paid trial.')
);

export const fetchTrustCenterData = async (user) => {
  if (!user?.id) return { history: [], challenges: [], verifications: [], trials: [], matches: [] };
  const isClient = user.type === 'client';

  const historyQuery = isClient
    ? Promise.resolve({ data: [], error: null })
    : supabase
      .from('trust_score_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(24);

  const challengesQuery = isClient
    ? Promise.resolve({ data: [], error: null })
    : supabase
      .from('skill_challenges')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(12);

  const verificationsQuery = isClient
    ? Promise.resolve({ data: [], error: null })
    : supabase
      .from('portfolio_verifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(12);

  const trialsQuery = supabase
    .from('paid_trials')
    .select('*')
    .eq(isClient ? 'client_id' : 'freelancer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(24);

  const matchesQuery = isClient
    ? supabase
      .from('ai_match_reports')
      .select('*')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
      .limit(12)
    : Promise.resolve({ data: [], error: null });

  const [historyRes, challengesRes, verificationsRes, trialsRes, matchesRes] = await Promise.all([
    historyQuery,
    challengesQuery,
    verificationsQuery,
    trialsQuery,
    matchesQuery,
  ]);

  [historyRes, challengesRes, verificationsRes, trialsRes, matchesRes].forEach((result) => {
    if (result.error) console.warn('Trust center query failed:', result.error);
  });

  return {
    history: historyRes.data || [],
    challenges: challengesRes.data || [],
    verifications: verificationsRes.data || [],
    trials: trialsRes.data || [],
    matches: matchesRes.data || [],
  };
};
