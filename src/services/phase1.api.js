import { supabase } from '../supabase';
import { getPublicCachedOpportunitiesForPortal } from './auxiliary.api';

export const OPPORTUNITY_TYPES = [
  'internship',
  'freelance',
  'part_time',
  'campus_ambassador',
  'entry_level',
  'startup_collab',
];

export const APPLICATION_STATUSES = ['applied', 'shortlisted', 'selected', 'rejected', 'withdrawn', 'completed'];
export const PUBLISH_TARGETS = ['intern', 'app'];

const PROFILE_SELECT = 'id,email,full_name,avatar_url,role,onboarding_completed,age_verified,status,created_at,updated_at';
const BUSINESS_PROFILE_SELECT = 'user_id,business_name,business_type,website,contact_email,contact_phone,verification_status,can_post';
export const PORTAL_MODES = {
  APP: 'APP_PORTAL',
  INTERN: 'INTERN_PORTAL',
  BUSINESS: 'BUSINESS_PORTAL',
};

export const PORTAL_URLS = {
  app: 'https://app.teenversehub.in',
  intern: 'https://intern.teenversehub.in',
  business: 'https://business.teenversehub.in',
  parent: 'https://parent.teenversehub.in',
};

const PORTAL_MODE_ALIASES = {
  APP: PORTAL_MODES.APP,
  APP_PORTAL: PORTAL_MODES.APP,
  INTERN: PORTAL_MODES.INTERN,
  INTERN_PORTAL: PORTAL_MODES.INTERN,
  BUSINESS: PORTAL_MODES.BUSINESS,
  BUSINESS_PORTAL: PORTAL_MODES.BUSINESS,
};

const maybeSingleOrNull = async (query) => {
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data || null;
};

const safeMaybeSingle = async (query) => {
  try {
    return await maybeSingleOrNull(query);
  } catch (error) {
    console.warn('Optional profile lookup failed:', error);
    return null;
  }
};

const getAuthUserName = (authUser) => (
  authUser?.user_metadata?.full_name ||
  authUser?.user_metadata?.name ||
  authUser?.email?.split('@')?.[0] ||
  'TeenVerse user'
);

const getAuthUserAvatar = (authUser) => (
  authUser?.user_metadata?.avatar_url ||
  authUser?.user_metadata?.picture ||
  null
);

const normalizeSafeProfileRole = (role) => {
  if (role === 'guardian' || role === 'parent') return 'guardian';
  return 'student';
};

export const getPortalMode = () => {
  const envMode = import.meta.env.VITE_PORTAL_MODE?.trim()?.toUpperCase();
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocalhost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname);

  if (isLocalhost && PORTAL_MODE_ALIASES[envMode]) return PORTAL_MODE_ALIASES[envMode];
  if (hostname === 'business.teenversehub.in') return PORTAL_MODES.BUSINESS;
  if (hostname === 'intern.teenversehub.in') return PORTAL_MODES.INTERN;
  return PORTAL_MODES.APP;
};

export const isBusinessPortal = () => getPortalMode() === PORTAL_MODES.BUSINESS;
export const isInternPortal = () => getPortalMode() === PORTAL_MODES.INTERN;
export const isAppPortal = () => getPortalMode() === PORTAL_MODES.APP;

const isAdminIdentity = (profile, legacy = {}) => profile?.role === 'admin' || Boolean(legacy.admin);
const isGuardianIdentity = (profile) => profile?.role === 'guardian' || profile?.role === 'parent';
const isClientIdentity = (_profile, legacy = {}) => Boolean(legacy.client);
const isIndividualIdentity = (profile, legacy = {}) => (
  ['student', 'freelancer', 'intern'].includes(profile?.role) ||
  Boolean(legacy.freelancer) ||
  !isClientIdentity(profile, legacy)
);

export const getStudentDashboardPath = () => '/dashboard';

export const getDashboardPathForRole = (role) => {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'guardian') return '/';
  if (role === 'student' || role === 'intern') return getStudentDashboardPath();
  return '/dashboard';
};

export const getLegacyAccountContext = async (authUser) => {
  const email = authUser?.email || '';

  const [adminById, adminByEmail, client, freelancer] = await Promise.all([
    safeMaybeSingle(supabase.from('admins').select('*').eq('id', authUser.id)),
    email ? safeMaybeSingle(supabase.from('admins').select('*').eq('email', email)) : Promise.resolve(null),
    safeMaybeSingle(supabase.from('clients').select('*').eq('id', authUser.id)),
    safeMaybeSingle(supabase.from('freelancers').select('*').eq('id', authUser.id)),
  ]);

  return {
    admin: adminById || adminByEmail,
    client,
    freelancer,
  };
};

const buildProfileInsert = (authUser, legacy) => {
  const metadataRole = authUser?.app_metadata?.role || authUser?.user_metadata?.role;
  const role = legacy.admin
    ? 'admin'
    : legacy.freelancer
      ? 'student'
      : normalizeSafeProfileRole(metadataRole);

  return {
    id: authUser.id,
    email: authUser.email || legacy.client?.email || legacy.freelancer?.email || legacy.admin?.email || null,
    full_name: legacy.client?.name || legacy.freelancer?.name || getAuthUserName(authUser),
    avatar_url: authUser?.user_metadata?.avatar_url || legacy.freelancer?.avatar_url || getAuthUserAvatar(authUser),
    role,
  };
};

export const getOrCreateProfileForUser = async (authUser) => {
  if (!authUser?.id) throw new Error('Missing authenticated user.');

  const legacy = await getLegacyAccountContext(authUser);
  const existing = await maybeSingleOrNull(
    supabase
      .from('profiles')
      .select(PROFILE_SELECT)
      .eq('id', authUser.id)
  );

  if (existing) {
    return { profile: existing, legacy, created: false };
  }

  const insertPayload = buildProfileInsert(authUser, legacy);
  const { data, error } = await supabase
    .from('profiles')
    .insert(insertPayload)
    .select(PROFILE_SELECT)
    .single();

  if (error) {
    if (error.code === '23505') {
      const profile = await maybeSingleOrNull(
        supabase
          .from('profiles')
          .select(PROFILE_SELECT)
          .eq('id', authUser.id)
      );
      return { profile, legacy, created: false };
    }

    throw error;
  }

  return { profile: data, legacy, created: true };
};

export const getIndividualProfile = async (user) => {
  if (!user?.id) return null;

  return maybeSingleOrNull(
    supabase
      .from('profiles')
      .select(PROFILE_SELECT)
      .eq('id', user.id)
  );
};

export const ensureIndividualProfile = (user) => getOrCreateProfileForUser(user);

export const getRedirectPathForPortal = ({
  portalMode = getPortalMode(),
  profile,
  businessProfile = null,
  legacy = {},
} = {}) => {
  if (isGuardianIdentity(profile)) return PORTAL_URLS.parent;

  if (portalMode === PORTAL_MODES.BUSINESS) {
    if (isAdminIdentity(profile, legacy)) return '/admin/dashboard';
    return businessProfile ? '/dashboard' : '/onboarding';
  }

  if (portalMode === PORTAL_MODES.INTERN) {
    if (isAdminIdentity(profile, legacy)) return '/admin/dashboard';
    if (isClientIdentity(profile, legacy)) return `${PORTAL_URLS.app}/client-dashboard`;
    if (isIndividualIdentity(profile, legacy)) return '/dashboard';
    return '/dashboard';
  }

  if (isAdminIdentity(profile, legacy)) return '/admin/dashboard';
  if (isClientIdentity(profile, legacy)) return '/client-dashboard';
  return '/dashboard';
};

export const getPortalHomePath = (portalMode, profile, businessProfile, legacy = {}) => (
  getRedirectPathForPortal({ portalMode, profile, businessProfile, legacy })
);

const normalizeOpportunityType = (type) => (
  OPPORTUNITY_TYPES.includes(type) ? type : 'internship'
);

const normalizePublishTo = (publishTo, type) => {
  const rawTargets = Array.isArray(publishTo)
    ? publishTo
    : typeof publishTo === 'string'
      ? publishTo.split(',').map((item) => item.trim())
      : [];

  const cleanTargets = [...new Set(rawTargets.filter((target) => PUBLISH_TARGETS.includes(target)))];
  const fallbackTargets = normalizeOpportunityType(type) === 'freelance' ? ['app'] : ['intern'];

  return cleanTargets.length ? cleanTargets : fallbackTargets;
};

const buildBusinessProfileMap = async (opportunities) => {
  const businessIds = [
    ...new Set((opportunities || [])
      .map((opportunity) => opportunity.business_id)
      .filter(Boolean)),
  ];

  if (!businessIds.length) return new Map();

  const { data, error } = await supabase
    .from('business_profiles')
    .select(BUSINESS_PROFILE_SELECT)
    .in('user_id', businessIds);

  if (error) throw error;

  return new Map((data || []).map((profile) => [profile.user_id, profile]));
};

const normalizeAdminOpportunity = (opportunity, businessProfilesById = new Map()) => {
  const businessProfile = businessProfilesById.get(opportunity.business_id) || {};

  return {
    ...opportunity,
    type: normalizeOpportunityType(opportunity.type),
    publish_to: normalizePublishTo(opportunity.publish_to, opportunity.type),
    business_name: businessProfile.business_name || opportunity.business_name || 'Unknown business',
    business_type: businessProfile.business_type || opportunity.business_type || 'Business',
    website: businessProfile.website || opportunity.website || null,
    contact_email: businessProfile.contact_email || opportunity.contact_email || null,
    contact_phone: businessProfile.contact_phone || opportunity.contact_phone || null,
    verification_status: businessProfile.verification_status || opportunity.verification_status || 'not_started',
    can_post: businessProfile.can_post ?? opportunity.can_post ?? false,
  };
};

const invokeAdminFunction = async (body) => {
  const { data, error } = await supabase.functions.invoke('admin-review-actions', { body });
  if (error) throw new Error(error.message || 'Admin review action failed.');
  if (data?.success === false) throw new Error(data.error || 'Admin review action failed.');
  return data;
};

export const getOpportunityPublishLabel = (publishTo = []) => {
  const targets = normalizePublishTo(publishTo);
  if (targets.includes('intern') && targets.includes('app')) return 'Intern + App';
  if (targets.includes('app')) return 'App Portal';
  return 'Intern Portal';
};

export const getAdminOpportunities = async (status = 'pending_review') => {
  let query = supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;

  const businessProfilesById = await buildBusinessProfileMap(data || []);
  return (data || []).map((opportunity) => normalizeAdminOpportunity(opportunity, businessProfilesById));
};

export const getAdminBusinessProfiles = async (status = 'pending') => {
  let query = supabase
    .from('business_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') query = query.eq('verification_status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const reviewBusinessAsAdmin = async (businessId, action, reason = '') => {
  if (!businessId) throw new Error('Missing business id.');
  if (!['verify', 'reject', 'suspend'].includes(action)) throw new Error('Choose a valid business review action.');
  if (['reject', 'suspend'].includes(action) && !String(reason || '').trim()) {
    throw new Error('A reason is required for this action.');
  }

  const result = await invokeAdminFunction({ resource: 'business', resourceId: businessId, action, reason });
  return result.business;
};

export const getRecentAdminAuditLogs = async (limit = 50) => {
  const safeLimit = Math.max(1, Math.min(50, Number(limit) || 50));
  const { data, error } = await supabase
    .from('admin_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(safeLimit);
  if (error) throw error;
  return data || [];
};

export const syncOpportunityCacheFromAdmin = async (opportunityId, mode = 'upsert') => {
  if (!opportunityId) throw new Error('Missing opportunity id.');
  if (!['upsert', 'delete'].includes(mode)) throw new Error('Choose a valid cache action.');

  const { data, error } = await supabase.functions.invoke('sync-opportunity-cache', {
    body: { opportunityId, action: mode },
  });
  if (error) throw new Error(error.message || 'Cloudflare cache sync failed.');
  if (data?.success === false) throw new Error(data.error || 'Cloudflare cache sync failed.');
  return data || { success: true };
};

const reviewOpportunityAsAdmin = async (opportunityId, action, reason = '') => {
  if (!opportunityId) throw new Error('Missing opportunity id.');
  const result = await invokeAdminFunction({ resource: 'opportunity', resourceId: opportunityId, action, reason });
  const cacheAction = action === 'approve' ? 'upsert' : 'delete';

  try {
    await syncOpportunityCacheFromAdmin(opportunityId, cacheAction);
    return result.opportunity;
  } catch (_cacheError) {
    return {
      ...result.opportunity,
      cache_sync_warning: `${action === 'approve' ? 'Opportunity approved' : 'Opportunity updated'}, but Cloudflare cache sync failed. Retry from the admin panel.`,
    };
  }
};

export const approveOpportunityAsAdmin = (opportunityId) => reviewOpportunityAsAdmin(opportunityId, 'approve');
export const rejectOpportunityAsAdmin = (opportunityId, reason = '') => reviewOpportunityAsAdmin(opportunityId, 'reject', reason);
export const pauseOpportunityAsAdmin = (opportunityId) => reviewOpportunityAsAdmin(opportunityId, 'pause');
export const closeOpportunityAsAdmin = (opportunityId) => reviewOpportunityAsAdmin(opportunityId, 'close');

const getPortalPublishTarget = (portalMode) => {
  if (portalMode === PORTAL_MODES.APP) return 'app';
  if (portalMode === PORTAL_MODES.INTERN) return 'intern';
  return null;
};

export const getPortalTarget = (portalMode = getPortalMode()) => getPortalPublishTarget(portalMode);

export const getPublicOpportunitiesForPortal = async (portalMode = getPortalMode()) => {
  const target = getPortalPublishTarget(portalMode);
  if (!target) return [];

  const cachedRows = await getPublicCachedOpportunitiesForPortal(portalMode);
  if (Array.isArray(cachedRows) && cachedRows.length > 0) {
    return cachedRows;
  }

  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('status', 'active')
    .contains('publish_to', [target])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((opportunity) => ({
    ...opportunity,
    type: normalizeOpportunityType(opportunity.type),
    publish_to: normalizePublishTo(opportunity.publish_to, opportunity.type),
  }));
};

export const getOpportunityDetail = async (opportunityId, portalMode = getPortalMode()) => {
  if (!opportunityId) throw new Error('Missing opportunity id.');
  const target = getPortalPublishTarget(portalMode);
  if (!target) throw new Error('This portal does not publish public opportunities.');

  const cachedRows = await getPublicCachedOpportunitiesForPortal(portalMode);
  const cached = Array.isArray(cachedRows)
    ? cachedRows.find((row) => row.id === opportunityId && row.status === 'active' && normalizePublishTo(row.publish_to, row.type).includes(target))
    : null;
  if (cached) return cached;

  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('id', opportunityId)
    .eq('status', 'active')
    .contains('publish_to', [target])
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('This opportunity is not available on this portal.');
  return {
    ...data,
    business_name: data.business_name || 'TeenVerseHub business',
    publish_to: normalizePublishTo(data.publish_to, data.type),
  };
};

export const getUserResumeFiles = async (userId) => {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('uploaded_files')
    .select('id,original_file_name,mime_type,size_bytes,created_at,visibility')
    .eq('owner_id', userId)
    .eq('related_type', 'resume')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const hasUserAppliedToOpportunity = async (userId, opportunityId) => {
  if (!userId || !opportunityId) return { applied: false, application: null };
  const { data, error } = await supabase
    .from('opportunity_applications')
    .select('*')
    .eq('applicant_id', userId)
    .eq('opportunity_id', opportunityId)
    .order('applied_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  const application = data?.[0] || null;
  return { applied: Boolean(application && application.status !== 'withdrawn'), application };
};

export const getUserOpportunityApplications = async (userId) => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('opportunity_applications')
    .select('*, opportunities(*)')
    .eq('applicant_id', userId)
    .order('applied_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getMyOpportunityApplications = getUserOpportunityApplications;

const normalizeApplyArgs = (firstArg, secondArg, thirdArg = {}) => {
  if (typeof firstArg === 'object' && firstArg !== null) {
    return {
      userId: firstArg.applicantId,
      opportunityId: firstArg.opportunityId,
      coverLetter: firstArg.coverLetter ?? firstArg.cover_letter,
      resumeFileId: firstArg.resumeFileId ?? firstArg.resume_file_id,
    };
  }
  return {
    userId: firstArg,
    opportunityId: secondArg,
    coverLetter: thirdArg.coverLetter ?? thirdArg.cover_letter,
    resumeFileId: thirdArg.resumeFileId ?? thirdArg.resume_file_id,
  };
};

export const applyToOpportunity = async (firstArg, secondArg, thirdArg = {}) => {
  const { userId, opportunityId, coverLetter, resumeFileId } = normalizeApplyArgs(firstArg, secondArg, thirdArg);
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user?.id) throw new Error('Please sign in before applying.');
  if (userId && userId !== authData.user.id) throw new Error('You can only submit your own application.');
  if (!opportunityId) throw new Error('Missing opportunity id.');

  const cleanCoverLetter = String(coverLetter || '').trim();
  if (cleanCoverLetter.length < 20) throw new Error('Please write at least 20 characters in your cover letter.');

  const { data: opportunity, error: opportunityError } = await supabase
    .from('opportunities')
    .select('id,status,application_deadline')
    .eq('id', opportunityId)
    .eq('status', 'active')
    .maybeSingle();
  if (opportunityError) throw opportunityError;
  if (!opportunity) throw new Error('This opportunity is no longer active.');

  if (opportunity.application_deadline) {
    const deadline = new Date(`${opportunity.application_deadline}T23:59:59`);
    if (Number.isFinite(deadline.getTime()) && deadline.getTime() < Date.now()) {
      throw new Error('The application deadline has passed.');
    }
  }

  const existing = await hasUserAppliedToOpportunity(authData.user.id, opportunityId);
  if (existing.applied) {
    const duplicateError = new Error('You have already applied to this opportunity.');
    duplicateError.code = '23505';
    throw duplicateError;
  }

  if (resumeFileId) {
    const { data: resume, error: resumeError } = await supabase
      .from('uploaded_files')
      .select('id')
      .eq('id', resumeFileId)
      .eq('owner_id', authData.user.id)
      .eq('related_type', 'resume')
      .eq('status', 'active')
      .maybeSingle();
    if (resumeError) throw resumeError;
    if (!resume) throw new Error('The selected resume is unavailable.');
  }

  const insertPayload = {
    opportunity_id: opportunityId,
    applicant_id: authData.user.id,
    cover_letter: cleanCoverLetter,
    resume_file_id: resumeFileId || null,
    status: 'applied',
  };

  const { data, error } = await supabase
    .from('opportunity_applications')
    .insert(insertPayload)
    .select('*, opportunities(*)')
    .single();

  if (error) throw error;
  return data;
};

export const withdrawOpportunityApplication = async (applicationId, userId) => {
  if (!applicationId) throw new Error('Missing application id.');
  if (!userId) throw new Error('Missing applicant user id.');

  const { data: existing, error: existingError } = await supabase
    .from('opportunity_applications')
    .select('id,status')
    .eq('id', applicationId)
    .eq('applicant_id', userId)
    .maybeSingle();
  if (existingError) throw existingError;
  if (!existing) throw new Error('Application not found.');
  if (!['applied', 'shortlisted'].includes(existing.status)) {
    throw new Error('Only applied or shortlisted applications can be withdrawn.');
  }

  const { data, error } = await supabase
    .from('opportunity_applications')
    .update({ status: 'withdrawn' })
    .eq('id', applicationId)
    .eq('applicant_id', userId)
    .select('*, opportunities(*)')
    .single();

  if (error) throw error;
  return data;
};

export const withdrawMyOpportunityApplication = async (applicationId) => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user?.id) throw new Error('Please sign in before withdrawing.');
  return withdrawOpportunityApplication(applicationId, data.user.id);
};

export const getApplicationStatusLabel = (status = 'applied') => (
  String(status).split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
);

export const getOpportunityErrorMessage = (error) => {
  if (error?.code === '23505') return 'You have already applied to this opportunity.';
  return error?.message || 'Something went wrong. Please try again.';
};
