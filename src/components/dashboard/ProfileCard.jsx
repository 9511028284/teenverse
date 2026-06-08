import React, { forwardRef, useMemo } from 'react';
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
  if (directRate > 0) return `Rs ${directRate.toLocaleString('en-IN')}/hr`;

  const servicePrice = services
    .map((service) => Number(service.price || service.starting_price || service.rate || 0))
    .find((price) => price > 0);

  return servicePrice ? `From Rs ${servicePrice.toLocaleString('en-IN')}` : 'Open to collabs';
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
      topService: topService?.title || topService?.name || user?.specialty || 'Creative services',
      plan,
      priceLabel: getPriceLabel(user, services),
    };
  }, [applications, badges, services, unlockedSkills, user]);

  const displayName = user?.name || 'TeenVerse Creator';
  const storyJoinUrl = shareUrl || buildStoryJoinUrl(user);
  const specialty = user?.specialty || user?.tag_line || 'Digital Creator';
  const profileLine = user?.tag_line || user?.bio || user?.qualification || 'Building verified work on TeenVerseHub.';
  const joinedYear = user?.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear();
  const instagramHandle = user?.social_links?.instagram
    ? user.social_links.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '@').replace(/\/$/, '')
    : null;

  const openTeenVerse = () => {
    window.location.href = storyJoinUrl;
  };

  const stopActionClick = (event, action) => {
    event.stopPropagation();
    action?.();
  };

  const copyStoryLink = async () => {
    try {
      await navigator.clipboard.writeText(storyJoinUrl);
      showToast?.('Story link copied. Add it as the Instagram link sticker.', 'success');
    } catch (_err) {
      showToast?.('Could not copy link automatically.', 'error');
    }
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openTeenVerse();
    }
  };

  return (
    <div className="flex flex-col items-center py-6 animate-fade-in max-w-xl mx-auto">
      
      {/* Top Banner Guide - Glass Pill */}
      <div className="mb-6 flex w-full max-w-[380px] items-center justify-between rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-slate-700 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_0_4px_16px_rgba(0,0,0,0.02)] backdrop-blur-md dark:border-white/[0.05] dark:bg-slate-900/40 dark:text-slate-200">
        <div className="text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Instagram Ready</p>
          <p className="mt-1 text-xs font-bold leading-normal">Story viewers join directly through your sticker link</p>
        </div>
        <ExternalLink size={16} strokeWidth={2.5} className="text-rose-500 shrink-0 ml-3" />
      </div>

      {/* --- RE-ENGINEERED INSTAGRAM FRAME CARD --- */}
      <div
        ref={ref}
        role="link"
        tabIndex={0}
        aria-label="Open TeenVerseHub"
        onClick={openTeenVerse}
        onKeyDown={onKeyDown}
        className="group relative aspect-[9/16] w-[380px] max-w-[calc(100vw-2rem)] cursor-pointer overflow-hidden rounded-[36px] bg-[#070913] text-white shadow-[0_24px_60px_rgba(0,0,0,0.4)] outline-none ring-offset-4 ring-offset-slate-950 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_32px_64px_rgba(244,63,94,0.3)] focus-visible:ring-2 focus-visible:ring-rose-400"
      >
        {/* Background Medias */}
        <div className="absolute inset-0 z-0">
          <img
            src={user?.cover_image || "https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=1200&auto=format&fit=crop"}
            alt=""
            crossOrigin="anonymous"
            className="h-full w-full object-cover opacity-30 saturate-125 transition-transform duration-700 group-hover:scale-102"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/70 to-[#070913]" />
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-br from-rose-500/50 via-purple-500/20 to-transparent opacity-80 mix-blend-screen" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.12] mix-blend-overlay" />
        </div>

        {/* Intrinsic Inner Framing Ring */}
        <div className="absolute inset-4 rounded-[28px] border border-white/5 pointer-events-none z-10" />
        
        {/* Card Body Components */}
        <div className="relative z-10 flex h-full flex-col justify-between p-6 pt-7 text-left">
          
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4">
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]">
              <Rocket size={13} strokeWidth={2.5} className="text-cyan-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/90">TeenVerseHub</span>
            </div>
            
            <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-400/10 px-3 py-1.5 text-amber-300 backdrop-blur-md shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]">
              <Crown size={12} strokeWidth={2.5} className="fill-amber-400/20" />
              <span className="text-[9px] font-black uppercase tracking-[0.18em]">{stats.plan || `Level ${userLevel}`}</span>
            </div>
          </div>

          {/* Central Body Profiling Nodes */}
          <div className="space-y-5 my-auto">
            <div className="space-y-3.5">
              <div className="flex justify-center">
                {/* Claymorphic Central Initials Ring */}
                <div className="grid h-20 w-20 place-items-center rounded-[24px] border border-white/10 bg-white/5 text-3xl font-black uppercase shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),_0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl">
                  {displayName.charAt(0)}
                </div>
              </div>

              <div className="text-center space-y-1">
                <h2 className="mx-auto flex max-w-[280px] items-center justify-center gap-1.5 text-balance text-2xl sm:text-3xl font-black tracking-tight leading-none">
                  {displayName}
                  {stats.isVerified && <CheckCircle size={20} strokeWidth={2.5} className="shrink-0 text-cyan-400" />}
                </h2>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 pt-0.5">{specialty}</p>
                <p className="mx-auto max-w-[280px] text-xs font-medium leading-relaxed text-slate-400 line-clamp-2 pt-1">{profileLine}</p>
              </div>
            </div>

            {/* Micro Stats Grid Box */}
            <div className="grid grid-cols-3 overflow-hidden rounded-[20px] border border-white/[0.04] bg-slate-950/40 backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]">
              <div className="p-3.5 text-center">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Projects</p>
                <p className="mt-0.5 text-xl font-black font-mono">{stats.projectCount}</p>
              </div>
              <div className="border-x border-white/[0.04] p-3.5 text-center">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Rating</p>
                <p className="mt-0.5 flex items-center justify-center gap-0.5 text-xl font-black font-mono">
                  {stats.averageRating || '--'} <Star size={11} className="fill-amber-400 text-amber-400 mb-0.5" />
                </p>
              </div>
              <div className="p-3.5 text-center">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Gigs</p>
                <p className="mt-0.5 text-xl font-black font-mono">{stats.completedJobs}</p>
              </div>
            </div>

            {/* Specialty Field Capsules */}
            <div className="space-y-2.5 rounded-[20px] border border-white/[0.04] bg-white/[0.02] p-4 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-3">
                <Briefcase size={16} strokeWidth={2.5} className="text-teal-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Featured Service</p>
                  <p className="truncate text-xs font-bold text-white mt-0.5">{stats.topService}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <GraduationCap size={16} strokeWidth={2.5} className="text-amber-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Rate Scale</p>
                  <p className="truncate text-xs font-bold text-white mt-0.5">{user?.qualification || stats.priceLabel}</p>
                </div>
              </div>
            </div>

            {/* Skills Pills Row */}
            <div className="flex flex-wrap justify-center gap-1.5">
              {(stats.skills.length ? stats.skills : ['Creative', 'Reliable', 'Verified']).slice(0, 4).map((skill, idx) => (
                <span key={`${skill}-${idx}`} className="rounded-lg border border-white/5 bg-white/[0.04] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-slate-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom Interactive Sticker Target Row */}
          <div className="space-y-3.5 mt-auto">
            {/* Simulated Instagram Link Sticker */}
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white bg-white px-4 py-2.5 text-slate-950 shadow-[0_12px_24px_rgba(0,0,0,0.15)] transition-transform group-hover:scale-[1.01]">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-slate-950 text-white shadow-sm">
                  <Link2 size={14} strokeWidth={2.5} />
                </div>
                <div className="leading-none">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Link Sticker</p>
                  <p className="text-xs font-black tracking-tight mt-0.5">Join TeenVerseHub</p>
                </div>
              </div>
              <Sparkles size={16} className="text-rose-500 animate-pulse" />
            </div>

            <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] px-3 py-1.5 text-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]">
              <p className="truncate text-[10px] font-bold font-mono tracking-wider text-slate-400">
                teenversehub.in
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 text-[9px] font-black uppercase tracking-wider text-slate-500">
              <span className="flex items-center gap-1"><BadgeCheck size={12} strokeWidth={2.5} /> {joinedYear} Profile</span>
              <span>{instagramHandle || 'Share-Ready Template'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Interface Actions Panel */}
      <div className="mt-6 flex w-full max-w-[380px] gap-2.5">
        <Button
          className="flex-1 border-none bg-gradient-to-r from-rose-500 via-fuchsia-600 to-indigo-600 text-white font-black text-xs uppercase tracking-wider py-3 rounded-xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),_0_10px_24px_rgba(236,72,153,0.3)] transition-transform hover:scale-[1.02]"
          icon={Share2}
          onClick={(event) => stopActionClick(event, handleShareToInstagram)}
        >
          Share
        </Button>

        <Button
          className="border-slate-200/80 bg-white text-xs font-black uppercase tracking-wider text-slate-700 rounded-xl px-4 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.6),_0_2px_6px_rgba(0,0,0,0.02)] hover:bg-slate-50 dark:border-white/[0.05] dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
          variant="outline"
          icon={Link2}
          aria-label="Copy Instagram story link sticker"
          onClick={(event) => stopActionClick(event, copyStoryLink)}
        />

        <Button
          className="flex-1 border-slate-200/80 bg-white text-xs font-black uppercase tracking-wider text-slate-700 rounded-xl shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.6),_0_2px_6px_rgba(0,0,0,0.02)] hover:bg-slate-50 dark:border-white/[0.05] dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
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
