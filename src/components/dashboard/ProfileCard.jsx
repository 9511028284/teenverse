import React, { forwardRef, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Share2,
  Download,
  CheckCircle,
  Star,
  Rocket,
  Crown,
  Sparkles,
  ExternalLink,
  BadgeCheck,
  Briefcase,
  GraduationCap,
  Link2,
} from 'lucide-react';
import Button from '../ui/Button';
import { getEffectivePlanName } from '../../utils/subscription';

const TEENVERSE_HOME_URL = 'https://teenversehub.in';

const buildStoryJoinUrl = (user) => {
  const url = new URL(TEENVERSE_HOME_URL);
  url.searchParams.set('utm_source', 'instagram');
  url.searchParams.set('utm_medium', 'story');
  url.searchParams.set('utm_campaign', 'profile_card');

  if (user?.referral_code) {
    url.searchParams.set('ref', user.referral_code);
  } else if (user?.id) {
    url.searchParams.set('creator', user.id);
  }
  return url.toString();
};

const normalizeSkill = (skill) => {
  if (!skill) return null;
  if (typeof skill === 'string') return skill;
  return skill.name || skill.title || skill.skill_name || null;
};

const getPriceLabel = (user, services = []) => {
  const directRate = Number(user?.hourly_rate || 0);
  if (directRate > 0) return `₹${directRate.toLocaleString('en-IN')}/hr`;

  const servicePrice = services
    .map((service) => Number(service.price || service.starting_price || service.rate || 0))
    .find((price) => price > 0);

  return servicePrice ? `From ₹${servicePrice.toLocaleString('en-IN')}` : 'Collabs Open';
};

const ProfileCard = forwardRef(({
  user,
  unlockedSkills = [],
  badges = [],
  userLevel = 1,
  applications = [],
  services = [],
  handleDownloadCard,
  handleShareToInstagram,
  shareUrl,
  showToast,
}, ref) => {
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    const isVerified = badges.some((badge) => ['Verified Teen', 'Verified'].includes(badge.name));
    const paidOrCompleted = applications.filter((app) => ['Paid', 'Completed', 'Submitted'].includes(app.status));
    const ratings = applications
      .map((app) => Number(app.client_rating || app.rating || 0))
      .filter((rating) => rating > 0);

    const averageRating = ratings.length
      ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1)
      : null;

    const projectCount = paidOrCompleted.length + services.length;
    const skills = (unlockedSkills.length ? unlockedSkills : user?.unlocked_skills || [])
      .map(normalizeSkill)
      .filter(Boolean);

    const topService = services.find((service) => service.title || service.name);
    const effectivePlan = getEffectivePlanName(user);
    const plan = effectivePlan !== 'Basic' ? effectivePlan : null;

    return {
      isVerified,
      completedJobs: paidOrCompleted.length,
      projectCount,
      averageRating,
      skills,
      topService: topService?.title || topService?.name || user?.specialty || 'Digital Art & Dev',
      plan,
      priceLabel: getPriceLabel(user, services),
    };
  }, [applications, badges, services, unlockedSkills, user]);

  const displayName = user?.name || 'TeenVerse Creator';
  const storyJoinUrl = shareUrl || buildStoryJoinUrl(user);
  const specialty = user?.specialty || user?.tag_line || 'Creative Identity';
  const profileLine = user?.tag_line || user?.bio || user?.qualification || 'Building cross-chain proof of work protocols.';
  const joinedYear = user?.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear();
  const instagramHandle = user?.social_links?.instagram
    ? user.social_links.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '@').replace(/\/$/, '')
    : null;

  const openTeenVerse = () => { window.location.href = storyJoinUrl; };
  const stopActionClick = (event, action) => { event.stopPropagation(); action?.(); };

  const copyStoryLink = async () => {
    try {
      await navigator.clipboard.writeText(storyJoinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast?.('Sticker link copied! Add it to your Instagram Story.', 'success');
    } catch (_err) {
      showToast?.('Failed to capture framework links.', 'error');
    }
  };

  return (
    <div className="flex flex-col items-center py-4 max-w-xl mx-auto select-none font-sans">
      
      {/* Dynamic Upper Tip Capsule */}
      <div className="mb-6 flex w-full max-w-[360px] items-center justify-between rounded-2xl border border-slate-200/60 bg-white/70 px-4 py-2.5 shadow-sm backdrop-blur-xl dark:border-white/[0.03] dark:bg-slate-900/40">
        <div className="text-left">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Instagram optimized</p>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Viewers hit the link sticker to tap in.</p>
        </div>
        <ExternalLink size={14} className="text-indigo-500 shrink-0 ml-3" />
      </div>

      {/* ── HIGH-FIDELITY SMART INSTAGRAM FRAME CARD ── */}
      <div
        ref={ref}
        role="link"
        tabIndex={0}
        onClick={openTeenVerse}
        className="group relative aspect-[9/16] w-[360px] max-w-[calc(100vw-2rem)] cursor-pointer overflow-hidden rounded-[32px] bg-slate-950 text-white shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-indigo-500/10 border border-slate-900 dark:border-white/10"
      >
        {/* Generative Visual Layers & Radial Scrims */}
        <div className="absolute inset-0 z-0">
          <img
            src={user?.cover_image || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop"}
            alt=""
            crossOrigin="anonymous"
            className="h-full w-full object-cover opacity-25 saturate-150 transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/80 to-slate-950" />
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute top-1/3 -right-20 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-[100px] pointer-events-none" />
        </div>
        
        {/* Core Layout Content */}
        <div className="relative z-10 flex h-full flex-col justify-between p-6">
          
          {/* Header Data Track */}
          <div className="flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/5 px-3 py-1.5 backdrop-blur-md">
              <Rocket size={12} className="text-indigo-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">TeenVerse</span>
            </div>
            
            <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-400/5 px-3 py-1.5 text-amber-400 backdrop-blur-md">
              <Crown size={12} className="fill-amber-400/10" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{stats.plan || `Tier ${userLevel}`}</span>
            </div>
          </div>

          {/* Identity Hub Zone */}
          <div className="space-y-6 my-auto pt-4">
            <div className="space-y-3 text-center">
              <div className="flex justify-center">
                {/* Micro Silhouette Profile Ring */}
                <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-600 to-purple-600 text-xl font-extrabold uppercase shadow-md shadow-indigo-500/20">
                  {displayName.charAt(0)}
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="mx-auto flex items-center justify-center gap-1.5 text-2xl font-extrabold tracking-tight text-white leading-tight">
                  {displayName}
                  {stats.isVerified && <CheckCircle size={18} className="shrink-0 text-indigo-400 fill-indigo-400/10" />}
                </h2>
                <p className="text-[11px] font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">{specialty}</p>
                <p className="mx-auto max-w-[260px] text-xs font-medium leading-relaxed text-slate-400 line-clamp-2 pt-1">{profileLine}</p>
              </div>
            </div>

            {/* Micro Parameter Matrix Display */}
            <div className="grid grid-cols-3 rounded-2xl border border-white/[0.04] bg-slate-900/50 backdrop-blur-md divide-x divide-white/[0.04] p-1 shadow-sm">
              <div className="py-2.5 text-center">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Missions</p>
                <p className="text-base font-extrabold font-mono text-white mt-0.5">{stats.projectCount}</p>
              </div>
              <div className="py-2.5 text-center">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Rating</p>
                <p className="text-base font-extrabold font-mono text-white mt-0.5 flex items-center justify-center gap-0.5">
                  {stats.averageRating || '--'} <Star size={10} className="fill-amber-400 text-amber-400 mb-0.5" />
                </p>
              </div>
              <div className="py-2.5 text-center">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Guild Gigs</p>
                <p className="text-base font-extrabold font-mono text-white mt-0.5">{stats.completedJobs}</p>
              </div>
            </div>

            {/* Core Capability Specifications */}
            <div className="rounded-2xl border border-white/[0.03] bg-white/[0.01] p-4 space-y-3 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                  <Briefcase size={12} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Primary Allocation</p>
                  <p className="truncate text-xs font-semibold text-slate-200 mt-0.5">{stats.topService}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                  <GraduationCap size={12} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Rate Parameter</p>
                  <p className="truncate text-xs font-semibold text-slate-200 mt-0.5">{user?.qualification || stats.priceLabel}</p>
                </div>
              </div>
            </div>

            {/* Horizontal Pill Stream */}
            <div className="flex flex-wrap justify-center gap-1.5 pt-1">
              {(stats.skills.length ? stats.skills : ['Creative Design', 'Verification Loops', 'Ecosystem Active']).slice(0, 3).map((skill, idx) => (
                <span key={`${skill}-${idx}`} className="rounded-lg border border-white/[0.04] bg-white/[0.03] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 shadow-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom Action Sticker Base */}
          <div className="space-y-3 mt-auto">
            
            {/* Ultra-Modern Simulated Instagram Link Sticker */}
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 text-slate-950 shadow-lg">
              <div className="flex items-center gap-2.5">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-slate-950 text-white shadow-sm">
                  <Link2 size={12} strokeWidth={2.5} />
                </div>
                <div className="leading-none">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Instagram Sticker</p>
                  <p className="text-xs font-extrabold tracking-tight mt-0.5">Explore TeenVerseHub</p>
                </div>
              </div>
              <Sparkles size={14} className="text-indigo-600 animate-pulse" />
            </div>

            <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] py-1.5 text-center shadow-inner">
              <p className="truncate text-[10px] font-mono font-medium tracking-wider text-slate-500">
                teenversehub.in
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 text-[9px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              <span className="flex items-center gap-1"><BadgeCheck size={11} /> {joinedYear} Ledger Matrix</span>
              <span className="truncate max-w-[140px] text-right">{instagramHandle || 'Share Blueprint Active'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE CONTROLS INTERFACE PANEL ── */}
      <div className="mt-6 flex w-full max-w-[360px] gap-2">
        <Button
          className="flex-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl shadow-md transition-all hover:opacity-95"
          icon={Share2}
          onClick={(event) => stopActionClick(event, handleShareToInstagram)}
        >
          Share Deck
        </Button>

        <Button
          className="border-slate-200 bg-white text-xs font-bold uppercase tracking-wider text-slate-600 rounded-xl px-4 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-all shadow-sm"
          variant="outline"
          icon={Link2}
          aria-label="Copy access link"
          onClick={(event) => stopActionClick(event, copyStoryLink)}
        >
          {copied ? 'Copied' : ''}
        </Button>

        <Button
          className="flex-1 border-slate-200 bg-white text-xs font-bold uppercase tracking-wider text-slate-600 rounded-xl hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-all shadow-sm"
          variant="outline"
          icon={Download}
          onClick={(event) => stopActionClick(event, handleDownloadCard)}
        >
          Save HD
        </Button>
      </div>
    </div>
  );
});

ProfileCard.displayName = 'ProfileCard';

export default ProfileCard;