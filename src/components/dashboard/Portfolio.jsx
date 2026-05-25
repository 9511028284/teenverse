import React, { useMemo, useState } from 'react';
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
} from 'lucide-react';

const thumbnailStyles = [
  'from-indigo-500 via-violet-500 to-fuchsia-500',
  'from-cyan-500 via-teal-500 to-emerald-500',
  'from-amber-400 via-orange-500 to-rose-500',
  'from-blue-500 via-sky-500 to-indigo-500',
  'from-emerald-500 via-lime-500 to-yellow-400',
  'from-rose-500 via-pink-500 to-purple-500',
];

const statusTone = {
  Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-400/20',
  Completed: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-400/20',
  Submitted: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-400/20',
  Accepted: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-400/20',
  Pending: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-300 dark:border-white/10',
  Draft: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-300 dark:border-white/10',
  Live: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-400/20',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-400/20',
};

const getJobTitle = (app) => {
  if (app.title) return app.title;
  if (app.job_title) return app.job_title;
  if (app.job?.title) return app.job.title;
  if (Array.isArray(app.jobs)) return app.jobs[0]?.title || 'Project';
  if (app.jobs?.title) return app.jobs.title;
  return app.job_id ? `Project #${String(app.job_id).slice(0, 8)}` : 'Project';
};

const getProjectCategory = (item) => (
  item.category ||
  item.job?.category ||
  item.jobs?.category ||
  item.service_category ||
  item.specialty ||
  'Project'
);

const formatDate = (value) => {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const toSafeText = (value, fallback = '') => (
  typeof value === 'string' && value.trim() ? value.trim() : fallback
);

const toSafeUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
};

const formatMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 'Not recorded';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
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
  description: toSafeText(
    app.work_message ||
    app.content ||
    app.summary ||
    app.project_description ||
    app.description ||
    app.jobs?.description ||
    app.job?.description ||
    '',
    'Project details are available from the order history.'
  ),
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

  const projects = useMemo(() => {
    if (publicProjects.length) {
      return publicProjects.map((project, index) => ({
        ...normalizeApplicationProject(project, index),
        source: project.source || 'Public Work',
      }));
    }

    const appProjects = applications.map(normalizeApplicationProject);
    const jobProjects = isClient
      ? jobs.map((job, index) => normalizeJobProject(job, index + appProjects.length))
      : [];
    const serviceProjects = !isClient
      ? services.map((service, index) => normalizeServiceProject(service, index + appProjects.length + jobProjects.length))
      : [];

    return [...appProjects, ...jobProjects, ...serviceProjects];
  }, [applications, isClient, jobs, publicProjects, services]);

  const filteredProjects = projects.filter((project) => {
    const searchBlob = `${project.title} ${project.category} ${project.status} ${project.source} ${project.description}`.toLowerCase();
    const matchesQuery = searchBlob.includes(query.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'delivered' && ['Submitted', 'Completed', 'Paid'].includes(project.status)) ||
      (filter === 'listings' && ['Posted Project', 'Gig / Service'].includes(project.source));

    return matchesQuery && matchesFilter;
  });

  const completedCount = projects.filter((project) => ['Completed', 'Paid'].includes(project.status)).length;
  const proofCount = projects.filter((project) => project.workLink || project.workFiles?.length).length;
  const hasProjects = projects.length > 0;

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/75 bg-white/70 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-3xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)] md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(99,102,241,0.18),transparent_34%),radial-gradient(circle_at_92%_18%,rgba(15,118,110,0.16),transparent_30%)]" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/70 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-indigo-600 shadow-sm backdrop-blur-xl dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-300">
              <Layers3 size={14} />
              Project Portfolio
            </div>
            <h1 className="text-3xl font-black tracking-[-0.045em] text-slate-950 dark:text-white sm:text-5xl">
              Project history, proof, and delivery data.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300 sm:text-base">
              A database-backed portfolio built from orders, submitted work, posted projects, and active services.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
            <StatCard label="Items" value={projects.length} />
            <StatCard label="Delivered" value={completedCount} />
            <StatCard label="Proof" value={proofCount} />
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200/80 bg-white/78 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0f172a]/72 dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-5">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">Project Gallery</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Open any card to inspect safe project details, delivery status, and proof links.</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects"
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white sm:w-64"
              />
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-black/25">
              {[
                ['all', 'All'],
                ['delivered', 'Delivered'],
                ['listings', isClient ? 'Posts' : 'Gigs'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                    filter === id
                      ? 'bg-white text-indigo-600 shadow-sm dark:bg-white/10 dark:text-indigo-300'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!hasProjects && (
          <div className="rounded-[1.5rem] border-2 border-dashed border-slate-200 p-10 text-center dark:border-white/10">
            <Briefcase className="mx-auto text-slate-300 dark:text-slate-600" size={42} />
            <h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">No project data yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              Orders, work submissions, posted jobs, and services will appear here as soon as they exist in the database.
            </p>
          </div>
        )}

        {hasProjects && filteredProjects.length === 0 && (
          <div className="rounded-[1.5rem] border border-slate-200 p-8 text-center text-sm font-semibold text-slate-500 dark:border-white/10 dark:text-slate-400">
            No portfolio items match your filters.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} onOpen={() => setSelectedProject(project)} />
          ))}
        </div>
      </section>

      {selectedProject && (
        <ProjectDetailsModal project={selectedProject} onClose={() => setSelectedProject(null)} isClient={isClient} />
      )}
    </div>
  );
};

export const PublicProjectShowcase = ({ projects = [], onOpenProject }) => {
  const normalizedProjects = projects.map((project, index) => ({
    ...normalizeApplicationProject(project, index),
    source: project.source || 'Verified Work',
  }));

  if (!normalizedProjects.length) return null;

  return (
    <div className="mt-8 pt-8 border-t border-gray-200/60 dark:border-white/10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
            <SparkleIcon />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Project Portfolio</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Verified work and submitted project history.</p>
          </div>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
          {normalizedProjects.length} items
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

const SparkleIcon = () => (
  <Star size={18} className="text-indigo-600 dark:text-indigo-400" />
);

const ProjectCard = ({ project, onOpen, compact = false }) => (
  <button
    type="button"
    onClick={onOpen}
    className="group overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 dark:border-white/10 dark:bg-white/[0.04]"
  >
    <div className={`relative ${compact ? 'h-28' : 'h-36'} bg-gradient-to-br ${project.thumbnailClass} p-4 text-white`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.32),transparent_30%),radial-gradient(circle_at_80%_90%,rgba(255,255,255,0.22),transparent_28%)]" />
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-white/18 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] backdrop-blur-xl">
            {project.source}
          </span>
          <ArrowUpRight size={18} className="opacity-70 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
        </div>
        <p className="line-clamp-2 text-lg font-black tracking-[-0.03em]">{project.title}</p>
      </div>
    </div>

    <div className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${statusTone[project.status] || statusTone.Pending}`}>
          {project.status}
        </span>
        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
          <CalendarDays size={12} />
          {formatDate(project.date)}
        </span>
      </div>
      <p className={`${compact ? 'line-clamp-2' : 'line-clamp-3'} text-sm leading-6 text-slate-600 dark:text-slate-300`}>
        {project.description}
      </p>
    </div>
  </button>
);

const StatCard = ({ label, value }) => (
  <div className="rounded-2xl border border-white/70 bg-white/65 p-4 text-center shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]">
    <div className="text-2xl font-black text-slate-950 dark:text-white">{value}</div>
    <div className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</div>
  </div>
);

const DetailRow = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
    <p className="mt-1 break-words text-sm font-bold text-slate-800 dark:text-slate-100">{value || 'Not provided'}</p>
  </div>
);

export const ProjectDetailsModal = ({ project, onClose, isClient }) => (
  <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
    <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl dark:bg-[#0f172a]">
      <div className={`relative bg-gradient-to-br ${project.thumbnailClass} p-6 text-white`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <span className="rounded-full bg-white/18 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] backdrop-blur-xl">
              {project.source}
            </span>
            <h3 className="mt-4 text-3xl font-black tracking-[-0.04em]">{project.title}</h3>
            <p className="mt-2 text-sm font-semibold text-white/78">{project.category}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-white/15 p-2 text-white backdrop-blur-xl transition hover:bg-white/25">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="custom-scrollbar max-h-[calc(90vh-180px)] overflow-y-auto p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <DetailRow label="Status" value={project.status} />
          <DetailRow label="Budget" value={formatMoney(project.budget)} />
          <DetailRow label="Date" value={formatDate(project.date)} />
          <DetailRow label={isClient ? 'Freelancer' : 'Client'} value={isClient ? project.freelancerName : project.clientName} />
          <DetailRow label="Project Type" value={project.category} />
          <DetailRow label="Files" value={project.workFiles?.length ? `${project.workFiles.length} file(s)` : 'No files attached'} />
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
            <Code2 size={14} />
            Project Details
          </p>
          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">{project.description}</p>
        </div>

        {project.message && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Submitted Note</p>
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">{project.message}</p>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {project.workLink && (
            <a
              href={project.workLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700"
            >
              <ExternalLink size={16} />
              Open Work Link
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
          >
            <LinkIcon size={16} />
            Close Details
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default Portfolio;
