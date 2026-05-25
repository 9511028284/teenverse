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
    const plan = user?.current_plan && user.current_plan !== 'Basic' ? user.current_plan : null;

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
    <div className="flex flex-col items-center py-8 animate-fade-in">
      <div className="mb-5 flex w-full max-w-[390px] items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-700 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Instagram ready</p>
          <p className="mt-0.5 text-sm font-bold">Story viewers join through your TeenVerse link</p>
        </div>
        <ExternalLink size={18} className="text-rose-500" />
      </div>

      <div
        ref={ref}
        role="link"
        tabIndex={0}
        aria-label="Open TeenVerseHub"
        onClick={openTeenVerse}
        onKeyDown={onKeyDown}
        className="group relative aspect-[9/16] w-[390px] max-w-[calc(100vw-2rem)] cursor-pointer overflow-hidden rounded-[34px] bg-[#08070c] text-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.85)] outline-none ring-offset-4 ring-offset-slate-950 transition duration-300 hover:-translate-y-1 hover:shadow-[0_36px_100px_-32px_rgba(244,63,94,0.55)] focus-visible:ring-2 focus-visible:ring-rose-300"
      >
        <div className="absolute inset-0">
          {user?.cover_image ? (
            <img
              src={user.cover_image}
              alt=""
              crossOrigin="anonymous"
              className="h-full w-full object-cover opacity-45 saturate-125 transition duration-700 group-hover:scale-105"
            />
          ) : (
            <img
              src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=1200&auto=format&fit=crop"
              alt=""
              crossOrigin="anonymous"
              className="h-full w-full object-cover opacity-35 saturate-125 transition duration-700 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,8,18,0.25)_0%,rgba(6,8,18,0.72)_45%,rgba(6,8,18,0.98)_100%)]" />
          <div className="absolute inset-x-0 top-0 h-48 bg-[linear-gradient(120deg,rgba(244,63,94,0.72),rgba(20,184,166,0.38),rgba(250,204,21,0.42))] opacity-75 mix-blend-screen" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        </div>

        <div className="absolute inset-4 rounded-[28px] border border-white/10" />
        <div className="relative z-10 flex h-full flex-col justify-between p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-md">
              <Rocket size={14} className="text-cyan-200" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/85">TeenVerseHub</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-amber-200/30 bg-amber-300/15 px-3 py-1.5 text-amber-100 backdrop-blur-md">
              <Crown size={13} />
              <span className="text-[10px] font-black uppercase tracking-[0.18em]">{stats.plan || `Level ${userLevel}`}</span>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-3">
              <div className="flex justify-center">
                <div className="grid h-24 w-24 place-items-center rounded-[28px] border border-white/20 bg-white/10 text-4xl font-black uppercase shadow-2xl backdrop-blur-xl">
                  {displayName.charAt(0)}
                </div>
              </div>

              <div className="text-center">
                <h2 className="mx-auto flex max-w-[320px] items-center justify-center gap-2 text-balance text-4xl font-black leading-none tracking-normal">
                  {displayName}
                  {stats.isVerified && <CheckCircle size={23} className="shrink-0 fill-cyan-300/20 text-cyan-200" />}
                </h2>
                <p className="mt-2 text-sm font-black uppercase tracking-[0.18em] text-rose-100">{specialty}</p>
                <p className="mx-auto mt-3 line-clamp-2 max-w-[310px] text-sm font-medium leading-6 text-white/72">{profileLine}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 overflow-hidden rounded-3xl border border-white/10 bg-black/25 backdrop-blur-xl">
              <div className="p-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Work</p>
                <p className="mt-1 text-2xl font-black">{stats.projectCount}</p>
              </div>
              <div className="border-x border-white/10 p-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Rating</p>
                <p className="mt-1 flex items-center justify-center gap-1 text-2xl font-black">
                  {stats.averageRating || '--'} <Star size={13} className="fill-amber-300 text-amber-300" />
                </p>
              </div>
              <div className="p-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Jobs</p>
                <p className="mt-1 text-2xl font-black">{stats.completedJobs}</p>
              </div>
            </div>

            <div className="space-y-3 rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <Briefcase size={18} className="text-teal-200" />
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Featured</p>
                  <p className="truncate text-sm font-black text-white">{stats.topService}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <GraduationCap size={18} className="text-amber-200" />
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Profile detail</p>
                  <p className="truncate text-sm font-black text-white">{user?.qualification || stats.priceLabel}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {(stats.skills.length ? stats.skills : ['Creative', 'Reliable', 'Verified']).slice(0, 4).map((skill, index) => (
                <span key={`${skill}-${index}`} className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/75 backdrop-blur-md">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-3xl border border-white/15 bg-white px-4 py-3 text-slate-950 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-white">
                  <Link2 size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Link sticker</p>
                  <p className="text-sm font-black">Join TeenVerseHub</p>
                </div>
              </div>
              <Sparkles size={20} className="text-rose-500" />
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-center">
              <p className="truncate text-[11px] font-black tracking-wide text-white/80">
                teenversehub.in
              </p>
              <p className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-cyan-100/60">
                Tap the story link to join
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
              <span className="flex items-center gap-2"><BadgeCheck size={13} /> {joinedYear} profile</span>
              <span>{instagramHandle || 'Share-ready card'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex w-full max-w-[390px] gap-3">
        <Button
          className="flex-1 border-none bg-gradient-to-r from-rose-500 via-fuchsia-600 to-cyan-500 text-xs font-black uppercase tracking-widest shadow-[0_18px_40px_-18px_rgba(236,72,153,0.9)] transition-all hover:scale-[1.02]"
          icon={Share2}
          onClick={(event) => stopActionClick(event, handleShareToInstagram)}
        >
          Share
        </Button>

        <Button
          className="border-slate-200 bg-white/80 px-4 text-xs font-black uppercase tracking-widest text-slate-800 backdrop-blur-md hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          variant="outline"
          icon={Link2}
          aria-label="Copy Instagram story link"
          onClick={(event) => stopActionClick(event, copyStoryLink)}
        />

        <Button
          className="flex-1 border-slate-200 bg-white/80 text-xs font-black uppercase tracking-widest text-slate-800 backdrop-blur-md hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
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
