import React, { useMemo, useState, useEffect } from 'react';
import {
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  Code2,
  ExternalLink,
  Layers3,
  Link as LinkIcon,
  Search,
  Star,
  X,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) { return twMerge(clsx(inputs)); }

// --- THEME CONSTANTS ---
const thumbnailStyles = [
  'from-indigo-500 via-violet-500 to-fuchsia-500',
  'from-cyan-500 via-teal-500 to-emerald-500',
  'from-amber-400 via-orange-500 to-rose-500',
  'from-blue-500 via-sky-500 to-indigo-500',
  'from-emerald-500 via-lime-500 to-yellow-400',
  'from-rose-500 via-pink-500 to-purple-500',
];

const statusTone = {
  Paid: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  Completed: 'bg-sky-50/80 text-sky-700 border-sky-200/60 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20',
  Submitted: 'bg-purple-50/80 text-purple-700 border-purple-200/60 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
  Accepted: 'bg-indigo-50/80 text-indigo-700 border-indigo-200/60 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
  Pending: 'bg-slate-50/80 text-slate-600 border-slate-200/60 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20',
  Draft: 'bg-slate-50/80 text-slate-600 border-slate-200/60 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20',
  Live: 'bg-teal-50/80 text-teal-700 border-teal-200/60 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20',
  Rejected: 'bg-rose-50/80 text-rose-700 border-rose-200/60 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
};

// --- NORMALIZATION UTILS ---
const getJobTitle = (app) => app.title || app.job_title || app.job?.title || (Array.isArray(app.jobs) ? app.jobs[0]?.title : app.jobs?.title) || (app.job_id ? `Project #${String(app.job_id).slice(0, 8)}` : 'Project');
const getProjectCategory = (item) => item.category || item.job?.category || item.jobs?.category || item.service_category || item.specialty || 'Project';
const formatDate = (value) => {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not recorded' : new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
};
const toSafeText = (value, fallback = '') => typeof value === 'string' && value.trim() ? value.trim() : fallback;
const toSafeUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.toString() : ''; } catch { return ''; }
};
const formatMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 'Not recorded';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

const normalizeApplicationProject = (app, index) => ({
  id: `app-${app.id || index}`,
  source: app.source || 'Order',
  title: toSafeText(getJobTitle(app), 'Project'),
  category: toSafeText(getProjectCategory(app), 'Project'),
  status: app.status || 'Pending',
  thumbnailClass: thumbnailStyles[index % thumbnailStyles.length],
  date: app.submitted_at || app.completed_at || app.created_at || app.started_at,
  budget: app.bid_amount || app.jobs?.budget || app.job?.budget || app.price || app.starting_price || app.rate,
  clientName: toSafeText(app.client_name),
  freelancerName: toSafeText(app.freelancer_name || app.name),
  workLink: toSafeUrl(app.work_link || app.portfolio_url || app.project_url || app.link),
  workFiles: app.work_files || app.attachments || app.files || [],
  message: app.message || app.submission_message || app.cover_letter || '',
  description: toSafeText(app.work_message || app.content || app.summary || app.project_description || app.description || app.jobs?.description || app.job?.description || '', 'Project details are available from the order history.'),
});

const normalizeJobProject = (job, indexOffset) => ({
  id: `job-${job.id || indexOffset}`,
  source: 'Posted Project',
  title: toSafeText(job.title, 'Posted Project'),
  category: toSafeText(getProjectCategory(job), 'Project'),
  status: job.status || 'Live',
  thumbnailClass: thumbnailStyles[indexOffset % thumbnailStyles.length],
  date: job.created_at,
  budget: job.budget || job.min_budget || job.max_budget,
  clientName: toSafeText(job.client_name),
  freelancerName: '',
  workLink: toSafeUrl(job.project_url || job.reference_url),
  workFiles: job.attachments || job.files || [],
  message: job.requirements || '',
  description: toSafeText(job.description || job.summary, 'No project description added yet.'),
});

const normalizeServiceProject = (service, indexOffset) => ({
  id: `service-${service.id || indexOffset}`,
  source: 'Gig / Service',
  title: toSafeText(service.title || service.name, 'Service'),
  category: toSafeText(getProjectCategory(service), 'Project'),
  status: service.status || 'Live',
  thumbnailClass: thumbnailStyles[indexOffset % thumbnailStyles.length],
  date: service.created_at,
  budget: service.price || service.starting_price || service.rate,
  clientName: '',
  freelancerName: toSafeText(service.freelancer_name),
  workLink: toSafeUrl(service.portfolio_url || service.project_url),
  workFiles: service.attachments || service.files || [],
  message: service.deliverables || '',
  description: toSafeText(service.description || service.summary, 'No service description added yet.'),
});


// --- MAIN PORTFOLIO COMPONENT ---
const Portfolio = ({
  isClient,
  applications = [],
  jobs = [],
  services = [],
  publicProjects = [],
}) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedProject) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [selectedProject]);

  const projects = useMemo(() => {
    if (publicProjects.length) return publicProjects.map((p, i) => ({ ...normalizeApplicationProject(p, i), source: p.source || 'Public Work' }));
    const appProjects = applications.map(normalizeApplicationProject);
    const jobProjects = isClient ? jobs.map((job, index) => normalizeJobProject(job, index + appProjects.length)) : [];
    const serviceProjects = !isClient ? services.map((service, index) => normalizeServiceProject(service, index + appProjects.length + jobProjects.length)) : [];
    return [...appProjects, ...jobProjects, ...serviceProjects];
  }, [applications, isClient, jobs, publicProjects, services]);

  const filteredProjects = projects.filter((project) => {
    const searchBlob = `${project.title} ${project.category} ${project.status} ${project.source} ${project.description}`.toLowerCase();
    const matchesQuery = searchBlob.includes(query.toLowerCase());
    const matchesFilter = filter === 'all' || 
      (filter === 'delivered' && ['Submitted', 'Completed', 'Paid'].includes(project.status)) ||
      (filter === 'listings' && ['Posted Project', 'Gig / Service'].includes(project.source));
    return matchesQuery && matchesFilter;
  });

  const completedCount = projects.filter(p => ['Completed', 'Paid'].includes(p.status)).length;
  const proofCount = projects.filter(p => p.workLink || p.workFiles?.length).length;
  const hasProjects = projects.length > 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12 max-w-7xl mx-auto">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/70 p-6 md:p-10 shadow-sm backdrop-blur-2xl dark:border-white/[0.04] dark:bg-slate-900/60">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(99,102,241,0.1),transparent_40%),radial-gradient(circle_at_100%_100%,rgba(168,85,247,0.08),transparent_40%)]" />
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-xl border border-indigo-100 bg-white/60 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-600 shadow-sm backdrop-blur-md dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
              <Layers3 size={14} />
              Verified Showcase
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-5xl leading-[1.1]">
              Project history & <br className="hidden sm:block"/> delivery proof.
            </h1>
            <p className="mt-4 text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400 sm:text-base">
              Your decentralized database of orders, submitted work, posted frameworks, and active active service listings.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:min-w-[400px]">
            <StatCard label="Total Indexed" value={projects.length} />
            <StatCard label="Delivered" value={completedCount} />
            <StatCard label="Proofs Linked" value={proofCount} />
          </div>
        </div>
      </section>

      {/* GALLERY CONTROLS */}
      <section className="rounded-[32px] border border-slate-200/80 bg-white/60 p-4 md:p-6 shadow-sm backdrop-blur-2xl dark:border-white/[0.04] dark:bg-slate-900/40">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-950 dark:text-white">Project Matrix</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Open cards to inspect validation states and secure links.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative group">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search matrix..."
                className="w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:bg-slate-950/60 dark:text-white dark:focus:border-indigo-500/50 sm:w-72 shadow-sm"
              />
            </div>
            
            {/* Segmented Control */}
            <div className="flex gap-1 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1 dark:border-white/10 dark:bg-slate-950/60 shadow-inner">
              {[
                ['all', 'All State'],
                ['delivered', 'Delivered'],
                ['listings', isClient ? 'Posts' : 'Gigs'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setFilter(id)}
                  className={cn(
                    "relative rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-300",
                    filter === id ? "text-indigo-700 dark:text-indigo-300" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  )}
                >
                  {filter === id && (
                    <motion.div layoutId="activeFilter" className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200/60 dark:border-white/[0.04]" />
                  )}
                  <span className="relative z-10">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* EMPTY STATES */}
        {!hasProjects && (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center dark:border-white/[0.05]">
            <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Briefcase className="text-slate-400 dark:text-slate-500" size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Awaiting Deployment</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              Your environment is clean. Active projects, gigs, and submissions will populate this matrix.
            </p>
          </div>
        )}

        {hasProjects && filteredProjects.length === 0 && (
          <div className="rounded-3xl border border-slate-200 p-10 text-center text-sm font-semibold text-slate-500 dark:border-white/[0.05] dark:text-slate-400 bg-white/50 dark:bg-slate-950/30">
            No environmental items match your current filter parameters.
          </div>
        )}

        {/* MASONRY/GRID LAYOUT WITH ANIMATION */}
        <motion.div layout className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} onOpen={() => setSelectedProject(project)} />
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* MODAL */}
      <AnimatePresence>
        {selectedProject && (
          <ProjectDetailsModal project={selectedProject} onClose={() => setSelectedProject(null)} isClient={isClient} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};


// --- SUBCOMPONENTS ---

const ProjectCard = ({ project, onOpen, compact = false }) => (
  <motion.button
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.25 }}
    onClick={onOpen}
    className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 dark:border-white/[0.05] dark:bg-slate-900/80 dark:hover:border-indigo-500/30"
  >
    {/* Card Header Graphic */}
    <div className={cn("relative p-5 text-white overflow-hidden", compact ? 'h-28' : 'h-36')}>
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-90 transition-transform duration-500 group-hover:scale-110", project.thumbnailClass)} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.2),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(0,0,0,0.1),transparent_40%)]" />
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="rounded-lg bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border border-white/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]">
            {project.source}
          </span>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
            <ArrowUpRight size={16} className="text-white" />
          </div>
        </div>
        <p className="line-clamp-2 text-lg font-extrabold tracking-tight drop-shadow-sm">{project.title}</p>
      </div>
    </div>

    {/* Card Body */}
    <div className="p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className={cn("rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider", statusTone[project.status] || statusTone.Pending)}>
          {project.status}
        </span>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
          <CalendarDays size={14} />
          {formatDate(project.date)}
        </span>
      </div>
      <p className={cn("text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300", compact ? 'line-clamp-2' : 'line-clamp-3')}>
        {project.description}
      </p>
    </div>
  </motion.button>
);

const StatCard = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200/60 bg-white/50 p-4 text-center shadow-sm backdrop-blur-xl dark:border-white/[0.04] dark:bg-slate-950/40">
    <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</div>
    <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</div>
  </div>
);

const DetailRow = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 dark:border-white/[0.03] dark:bg-slate-950/40 shadow-inner">
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
    <p className="mt-1 break-words text-sm font-bold text-slate-900 dark:text-slate-100">{value || 'Not configured'}</p>
  </div>
);

// --- MODAL COMPONENT (Framer Motion Enhanced) ---
export const ProjectDetailsModal = ({ project, onClose, isClient }) => (
  <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 sm:p-6">
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
    />
    
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[32px] border border-white/20 bg-white shadow-2xl dark:bg-slate-900 dark:border-white/10"
    >
      {/* Modal Header */}
      <div className={cn("relative shrink-0 p-6 sm:p-8 text-white", project.thumbnailClass, "bg-gradient-to-br")}>
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <span className="rounded-lg bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border border-white/10 shadow-sm">
              {project.source}
            </span>
            <h3 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-md leading-tight">{project.title}</h3>
            <p className="mt-2 text-sm font-semibold text-white/80">{project.category}</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="rounded-full bg-white/10 p-2.5 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-105 active:scale-95 border border-white/10"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Modal Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <DetailRow label="Pipeline Status" value={project.status} />
          <DetailRow label="Budget Allocation" value={formatMoney(project.budget)} />
          <DetailRow label="Timestamp" value={formatDate(project.date)} />
          <DetailRow label={isClient ? 'Freelancer Identity' : 'Client Identity'} value={isClient ? project.freelancerName : project.clientName} />
          <DetailRow label="Framework Type" value={project.category} />
          <DetailRow label="Assets" value={project.workFiles?.length ? `${project.workFiles.length} file(s) logged` : 'No direct assets attached'} />
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200/80 bg-white p-5 dark:border-white/[0.04] dark:bg-slate-950 shadow-sm">
          <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Code2 size={16} />
            Structural Blueprint
          </p>
          <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">{project.description}</p>
        </div>

        {project.message && (
          <div className="mt-4 rounded-3xl border border-indigo-100 bg-indigo-50/50 p-5 dark:border-indigo-500/10 dark:bg-indigo-500/5">
            <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
              <FileText size={16} />
              Attached Transmission
            </p>
            <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">{project.message}</p>
          </div>
        )}

        {/* Actions Footer */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end border-t border-slate-100 dark:border-white/5 pt-6">
          {project.workLink && (
            <a
              href={project.workLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition-all hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <ExternalLink size={16} />
              Launch Work Link
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <LinkIcon size={16} />
            Collapse View
          </button>
        </div>
      </div>
    </motion.div>
  </div>
);

// --- PUBLIC SHOWCASE COMPONENT ---
export const PublicProjectShowcase = ({ projects = [], onOpenProject }) => {
  const normalizedProjects = projects.map((project, index) => ({ ...normalizeApplicationProject(project, index), source: project.source || 'Verified Work' }));
  if (!normalizedProjects.length) return null;

  return (
    <div className="mt-10 pt-10 border-t border-slate-200/60 dark:border-white/10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
            <Star size={18} className="text-indigo-600 dark:text-indigo-400 fill-indigo-600/20" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Verified Showcase</h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Cryptographically logged project history.</p>
          </div>
        </div>
        <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
          {normalizedProjects.length} Index items
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {normalizedProjects.slice(0, 6).map((project) => (
          <ProjectCard key={project.id} project={project} compact onOpen={() => onOpenProject?.(project)} />
        ))}
      </div>
    </div>
  );
};

export default Portfolio;