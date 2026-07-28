import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  clientIp,
  corsHeaders,
  getAuthenticatedUser,
  getSupabaseAdmin,
  json,
} from "../_shared/auth-security.ts";

type Action =
  | "get_active_event"
  | "track_event"
  | "submit_event"
  | "admin_list"
  | "admin_review";

type Platform = "instagram" | "youtube" | "facebook" | "other";
type SubmissionStatus = "pending" | "approved" | "rejected" | "needs_changes" | "reward_credited";
type ReviewAction = "approve" | "reject" | "needs_changes" | "credit_reward";

type MarketingEvent = {
  id: string;
  slug: string;
  title: string;
  description: string;
  event_version: string;
  reward_amount: number;
  reward_label: string;
  official_client_id: string | null;
  official_client_name: string;
  category: string;
  hero_image_url: string | null;
  timeline: unknown[];
  requirements: unknown[];
  rules: unknown[];
  faq: unknown[];
};

type MarketingSubmission = {
  id: string;
  event_id: string;
  event_version: string;
  user_id: string;
  platform: Platform;
  video_url: string;
  username: string;
  caption: string;
  screenshot_url: string | null;
  status: SubmissionStatus;
  review_notes: string | null;
  internal_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  reward_amount: number;
  wallet_transaction_id: string | null;
  reward_credited_at: string | null;
  created_at: string;
  updated_at: string;
  resubmitted_at: string | null;
};

type Payload = Record<string, unknown>;

const TRACK_TYPES = new Set([
  "impression",
  "modal_open",
  "seen",
  "dismiss",
  "join",
  "page_visit",
  "sticky_cta",
  "submission_start",
]);

const REVIEW_ACTIONS = new Set<ReviewAction>(["approve", "reject", "needs_changes", "credit_reward"]);

const clean = (value: unknown, maxLength = 1000) => String(value || "").trim().slice(0, maxLength);

const toBool = (value: unknown) => value === true || value === "true";

class HttpError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function normalizePlatform(value: unknown): Platform {
  const platform = clean(value, 32).toLowerCase();
  if (platform === "instagram" || platform === "youtube" || platform === "facebook" || platform === "other") {
    return platform;
  }
  throw new HttpError("Select a valid platform.");
}

function normalizeUrl(raw: unknown, field = "Video URL") {
  const value = clean(raw, 600);
  if (!value) throw new HttpError(`${field} is required.`);
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new HttpError(`${field} must be a valid public link.`);
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new HttpError(`${field} must start with http or https.`);
  }
  parsed.hash = "";
  return parsed.toString();
}

function validateVideoUrl(rawUrl: unknown, platform: Platform) {
  const url = normalizeUrl(rawUrl);
  const parsed = new URL(url);
  const hostname = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  const pathname = parsed.pathname.toLowerCase();

  if (platform === "instagram") {
    if (!hostname.endsWith("instagram.com") || !pathname.includes("/reel/")) {
      throw new HttpError("Submit a public Instagram Reel link.");
    }
  }

  if (platform === "youtube") {
    const isShorts = hostname.endsWith("youtube.com") && pathname.startsWith("/shorts/");
    const isShortLink = hostname === "youtu.be" && pathname.length > 1;
    if (!isShorts && !isShortLink) {
      throw new HttpError("Submit a public YouTube Shorts link.");
    }
  }

  if (platform === "facebook") {
    const isFacebook = hostname.endsWith("facebook.com") || hostname.endsWith("fb.watch");
    const looksLikeReel = pathname.includes("/reel/") || pathname.includes("/share/r/") || hostname.endsWith("fb.watch");
    if (!isFacebook || !looksLikeReel) {
      throw new HttpError("Submit a public Facebook Reel link.");
    }
  }

  return url;
}

async function getActiveEvent(admin: ReturnType<typeof getSupabaseAdmin>) {
  const { data, error } = await admin
    .from("marketing_events")
    .select("*")
    .eq("status", "active")
    .lte("starts_at", new Date().toISOString())
    .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data || null) as MarketingEvent | null;
}

async function assertAdmin(admin: ReturnType<typeof getSupabaseAdmin>, userId: string) {
  const [{ data: profile, error: profileError }, { data: legacyAdmin, error: adminError }] = await Promise.all([
    admin.from("profiles").select("id,role,status").eq("id", userId).maybeSingle(),
    admin.from("admins").select("id").eq("id", userId).maybeSingle(),
  ]);

  if (profileError) throw profileError;
  if (adminError) throw adminError;
  if (profile?.role !== "admin" && !legacyAdmin) throw new HttpError("Forbidden.", 403);
  if (profile?.status && profile.status !== "active") throw new HttpError("Forbidden.", 403);
}

async function notify(admin: ReturnType<typeof getSupabaseAdmin>, userId: string, message: string) {
  const { error } = await admin.from("notifications").insert({ user_id: userId, message });
  if (error) console.warn("marketing notification failed", error);
}

async function track(
  admin: ReturnType<typeof getSupabaseAdmin>,
  event: MarketingEvent,
  userId: string,
  viewType: string,
  source: unknown,
  metadata: Record<string, unknown>,
) {
  if (!TRACK_TYPES.has(viewType) && !["approved", "rejected", "needs_changes", "reward_credited", "submission_created", "submission_resubmitted"].includes(viewType)) {
    throw new HttpError("Invalid analytics event.");
  }

  const payload = {
    event_id: event.id,
    event_version: event.event_version,
    user_id: userId,
    view_type: viewType,
    source: clean(source, 80) || null,
    metadata,
  };

  const { error } = await admin.from("marketing_event_views").insert(payload);
  if (error && !(viewType === "seen" && error.code === "23505")) throw error;
}

async function buildEventPayload(admin: ReturnType<typeof getSupabaseAdmin>, event: MarketingEvent, userId: string) {
  const [{ data: seen }, { data: submission }, { data: reward }] = await Promise.all([
    admin
      .from("marketing_event_views")
      .select("id,metadata,created_at")
      .eq("event_id", event.id)
      .eq("event_version", event.event_version)
      .eq("user_id", userId)
      .eq("view_type", "seen")
      .maybeSingle(),
    admin
      .from("marketing_event_submissions")
      .select("*")
      .eq("event_id", event.id)
      .eq("user_id", userId)
      .maybeSingle(),
    admin
      .from("marketing_rewards")
      .select("*")
      .eq("event_id", event.id)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  return {
    event,
    hasSeenModal: Boolean(seen),
    seen,
    submission,
    reward,
  };
}

async function getActiveEventResponse(admin: ReturnType<typeof getSupabaseAdmin>, userId: string) {
  const event = await getActiveEvent(admin);
  if (!event) return { event: null, hasSeenModal: true, submission: null, reward: null };
  return buildEventPayload(admin, event, userId);
}

async function submitEvent(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  payload: Payload,
) {
  const event = await getActiveEvent(admin);
  if (!event) throw new HttpError("This event is not active right now.", 404);

  if (!toBool(payload.agreementAccepted)) {
    throw new HttpError("Confirm the originality and public-link agreement.");
  }

  const platform = normalizePlatform(payload.platform);
  const videoUrl = validateVideoUrl(payload.videoUrl, platform);
  const username = clean(payload.username, 80).replace(/^@+/, "");
  const caption = clean(payload.caption, 500);
  const screenshotUrl = clean(payload.screenshotUrl, 600) ? normalizeUrl(payload.screenshotUrl, "Screenshot URL") : null;
  const jobId = Number(payload.jobId || 0);

  if (username.length < 2) throw new HttpError("Enter the account username used for the post.");
  if (caption.length < 12) throw new HttpError("Add a short caption so reviewers can match your post.");

  const { data: urlDuplicate, error: duplicateError } = await admin
    .from("marketing_event_submissions")
    .select("id,user_id,status")
    .eq("event_id", event.id)
    .eq("video_url", videoUrl)
    .in("status", ["pending", "approved", "reward_credited"])
    .maybeSingle();
  if (duplicateError) throw duplicateError;
  if (urlDuplicate && urlDuplicate.user_id !== userId) {
    throw new HttpError("This video link was already submitted for review.");
  }

  const { data: existing, error: existingError } = await admin
    .from("marketing_event_submissions")
    .select("*")
    .eq("event_id", event.id)
    .eq("user_id", userId)
    .maybeSingle();
  if (existingError) throw existingError;

  let submission: MarketingSubmission;
  const submissionPayload = {
    event_id: event.id,
    event_version: event.event_version,
    user_id: userId,
    platform,
    video_url: videoUrl,
    username,
    caption,
    screenshot_url: screenshotUrl,
    status: "pending" as SubmissionStatus,
    review_notes: null,
    internal_notes: null,
    approved_by: null,
    approved_at: null,
    reward_amount: event.reward_amount,
  };

  if (existing) {
    if (!["rejected", "needs_changes"].includes(existing.status)) {
      throw new HttpError("Your submission is already in review or approved.");
    }

    const { data, error } = await admin
      .from("marketing_event_submissions")
      .update({ ...submissionPayload, resubmitted_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw error;
    submission = data as MarketingSubmission;
    await track(admin, event, userId, "submission_resubmitted", payload.source, { submissionId: submission.id });
  } else {
    const { data, error } = await admin
      .from("marketing_event_submissions")
      .insert(submissionPayload)
      .select("*")
      .single();
    if (error) throw error;
    submission = data as MarketingSubmission;
    await track(admin, event, userId, "submission_created", payload.source, { submissionId: submission.id });
  }

  if (Number.isFinite(jobId) && jobId > 0) {
    const { data: existingApp } = await admin
      .from("applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("freelancer_id", userId)
      .maybeSingle();

    if (!existingApp) {
      await admin.from("applications").insert({
        job_id: jobId,
        freelancer_id: userId,
        freelancer_name: clean(payload.displayName, 120) || "TeenVerseHub creator",
        client_id: event.official_client_id,
        cover_letter: `Marketing event video submission: ${videoUrl}`,
        bid_amount: event.reward_amount,
        is_educational_waiver_signed: true,
        status: "Pending",
      });
    }
  }

  await notify(admin, userId, "Your TeenVerseHub video event submission was received for review.");
  return { success: true, submission };
}

async function adminList(admin: ReturnType<typeof getSupabaseAdmin>) {
  const event = await getActiveEvent(admin);

  const [
    { data: events, error: eventsError },
    { data: submissions, error: submissionsError },
    { data: rewards, error: rewardsError },
  ] = await Promise.all([
    admin.from("marketing_events").select("*").order("created_at", { ascending: false }).limit(12),
    admin.from("marketing_event_submissions").select("*").order("created_at", { ascending: false }).limit(100),
    admin.from("marketing_rewards").select("*").order("created_at", { ascending: false }).limit(100),
  ]);

  if (eventsError) throw eventsError;
  if (submissionsError) throw submissionsError;
  if (rewardsError) throw rewardsError;

  const userIds = [...new Set((submissions || []).map((row) => row.user_id).filter(Boolean))];
  const { data: freelancers } = userIds.length
    ? await admin.from("freelancers").select("id,name,email,cover_image").in("id", userIds)
    : { data: [] };
  const profileById = new Map((freelancers || []).map((row) => [row.id, row]));
  const enrichedSubmissions = (submissions || []).map((row) => ({ ...row, user: profileById.get(row.user_id) || null }));

  const eventIds = (events || []).map((row) => row.id);
  const analytics = eventIds.length ? await aggregateAnalytics(admin, eventIds) : {};

  return {
    event,
    events,
    submissions: enrichedSubmissions,
    rewards,
    analytics,
  };
}

async function aggregateAnalytics(admin: ReturnType<typeof getSupabaseAdmin>, eventIds: string[]) {
  const { data: views, error: viewsError } = await admin
    .from("marketing_event_views")
    .select("event_id,view_type")
    .in("event_id", eventIds)
    .limit(10000);
  if (viewsError) throw viewsError;

  const { data: submissions, error: submissionsError } = await admin
    .from("marketing_event_submissions")
    .select("event_id,status")
    .in("event_id", eventIds)
    .limit(10000);
  if (submissionsError) throw submissionsError;

  const byEvent: Record<string, Record<string, number>> = {};
  for (const id of eventIds) byEvent[id] = {};

  for (const row of views || []) {
    const bucket = byEvent[row.event_id] || {};
    bucket[row.view_type] = (bucket[row.view_type] || 0) + 1;
    byEvent[row.event_id] = bucket;
  }

  for (const row of submissions || []) {
    const bucket = byEvent[row.event_id] || {};
    bucket.submissions = (bucket.submissions || 0) + 1;
    bucket[`status_${row.status}`] = (bucket[`status_${row.status}`] || 0) + 1;
    byEvent[row.event_id] = bucket;
  }

  return byEvent;
}

async function writeAudit(
  admin: ReturnType<typeof getSupabaseAdmin>,
  req: Request,
  adminId: string,
  action: string,
  targetId: string,
  details: Record<string, unknown>,
) {
  const { error } = await admin.from("admin_audit_logs").insert({
    admin_id: adminId,
    action_type: action,
    target_id: targetId,
    ip_address: clientIp(req),
    metadata: details,
  });

  if (!error) return;
  await admin.from("audit_logs").insert({
    action,
    actor_id: adminId,
    details: { target_id: targetId, ...details },
  });
}

async function adminReview(
  admin: ReturnType<typeof getSupabaseAdmin>,
  req: Request,
  adminId: string,
  payload: Payload,
) {
  const submissionId = clean(payload.submissionId, 80);
  const action = clean(payload.reviewAction, 32) as ReviewAction;
  const reviewNotes = clean(payload.reviewNotes, 1200);
  const internalNotes = clean(payload.internalNotes, 1200);

  if (!submissionId) throw new HttpError("Submission ID is required.");
  if (!REVIEW_ACTIONS.has(action)) throw new HttpError("Invalid review action.");
  if ((action === "reject" || action === "needs_changes") && !reviewNotes) {
    throw new HttpError("A reviewer note is required.");
  }

  const { data: existing, error: existingError } = await admin
    .from("marketing_event_submissions")
    .select("*, marketing_events(*)")
    .eq("id", submissionId)
    .single();
  if (existingError) throw existingError;

  const submission = existing as MarketingSubmission & { marketing_events?: MarketingEvent };
  const event = submission.marketing_events;
  if (!event) throw new HttpError("Event not found.", 404);

  if (action === "credit_reward") {
    const { data, error } = await admin.rpc("tvh_credit_marketing_reward", {
      p_submission_id: submissionId,
      p_admin_id: adminId,
    });
    if (error) throw error;
    await track(admin, event, submission.user_id, "reward_credited", "admin", { submissionId });
    await notify(admin, submission.user_id, "Your ₹300 TeenVerseHub video reward was credited to your wallet.");
    await writeAudit(admin, req, adminId, "MARKETING_REWARD_CREDITED", submissionId, { result: data });
    return { success: true, reward: data };
  }

  const status = action === "approve"
    ? "approved"
    : action === "reject"
      ? "rejected"
      : "needs_changes";

  if (submission.status === "reward_credited") {
    throw new HttpError("Rewarded submissions cannot be changed.");
  }

  const patch = {
    status,
    review_notes: reviewNotes || (status === "approved" ? "Approved." : null),
    internal_notes: internalNotes || null,
    approved_by: status === "approved" ? adminId : null,
    approved_at: status === "approved" ? new Date().toISOString() : null,
  };

  const { data: updated, error } = await admin
    .from("marketing_event_submissions")
    .update(patch)
    .eq("id", submissionId)
    .select("*")
    .single();
  if (error) throw error;

  await track(admin, event, submission.user_id, status, "admin", { submissionId, reviewNotes });
  await writeAudit(admin, req, adminId, `MARKETING_SUBMISSION_${status.toUpperCase()}`, submissionId, {
    previousStatus: submission.status,
    status,
    reviewNotes,
  });

  const message = status === "approved"
    ? "Your TeenVerseHub video was approved. Reward credit is ready for admin confirmation."
    : status === "needs_changes"
      ? `TeenVerseHub requested changes on your video submission: ${reviewNotes}`
      : `Your TeenVerseHub video submission was rejected: ${reviewNotes}`;
  await notify(admin, submission.user_id, message);

  return { success: true, submission: updated };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed." }, 405);

  try {
    const admin = getSupabaseAdmin();
    const user = await getAuthenticatedUser(req);
    const body = await req.json().catch(() => ({})) as Payload;
    const action = clean(body.action, 60) as Action;

    if (action === "get_active_event") {
      return json({ success: true, ...(await getActiveEventResponse(admin, user.id)) });
    }

    if (action === "track_event") {
      const event = await getActiveEvent(admin);
      if (!event) return json({ success: true, tracked: false });
      const viewType = clean(body.viewType, 60);
      await track(admin, event, user.id, viewType, body.source, {
        action: clean(body.intent, 80) || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      });
      return json({ success: true, tracked: true });
    }

    if (action === "submit_event") {
      return json(await submitEvent(admin, user.id, body));
    }

    if (action === "admin_list") {
      await assertAdmin(admin, user.id);
      return json({ success: true, ...(await adminList(admin)) });
    }

    if (action === "admin_review") {
      await assertAdmin(admin, user.id);
      return json(await adminReview(admin, req, user.id, body));
    }

    throw new HttpError("Unknown marketing event action.");
  } catch (error) {
    const status = error instanceof HttpError ? error.status : /unauthorized/i.test(error instanceof Error ? error.message : "") ? 401 : 500;
    const message = error instanceof Error ? error.message : "Marketing event request failed.";
    console.error("marketing-events error", { status, message });
    return json({ success: false, error: message }, status);
  }
});
