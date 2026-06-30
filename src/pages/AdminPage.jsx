import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  LayoutDashboard, Users, Briefcase, CheckCircle, XCircle, 
  Trash2, DollarSign, LogOut, Shield, Flag, Package,
  Clock, AlertTriangle, ShieldCheck, Landmark, Eye, MessageSquare, 
  Activity, Copy, CreditCard, Send, LifeBuoy, BriefcaseBusiness, 
  CalendarDays, Clock3, Loader2, PauseCircle, RefreshCcw, CheckCircle2 
} from 'lucide-react';
import { supabase } from '../supabase'; 
import * as api from '../services/dashboard.api'; 
import {
  approveOpportunityAsAdmin,
  closeOpportunityAsAdmin,
  getAdminBusinessProfiles,
  getAdminOpportunities,
  getOpportunityPublishLabel,
  pauseOpportunityAsAdmin,
  rejectOpportunityAsAdmin,
  reviewBusinessAsAdmin,
  syncOpportunityCacheFromAdmin,
} from '../services/phase1.api';
import Toast from '../components/ui/Toast'; 

// Utility class merger helper
const cx = (...classes) => classes.filter(Boolean).join(' ');

// --- CONSTANTS FROM ADMINPAGE ---
const REVIEW_TABS = [
  { id: 'pending_review', label: 'Pending Review' },
  { id: 'active', label: 'Active' },
  { id: 'archived', label: 'Rejected / Paused / Closed' },
];

const TYPE_LABELS = {
  internship: 'Internship',
  freelance: 'Freelance',
  part_time: 'Part-time',
  campus_ambassador: 'Campus Ambassador',
  entry_level: 'Entry-level',
  startup_collab: 'Startup Collaboration',
};

const STATUS_STYLES = {
  pending_review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
  paused: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  closed: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300',
};

// --- DATA FORMATTERS ---
const formatStatus = (status = '') => (
  String(status || '')
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Pending Review'
);

const formatDate = (value) => {
  if (!value) return 'Rolling';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Rolling';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatMoney = (opportunity) => {
  if (opportunity?.is_paid === false) return 'Unpaid';
  const min = Number(opportunity?.stipend_min);
  const max = Number(opportunity?.stipend_max);
  const hasMin = Number.isFinite(min) && min > 0;
  const hasMax = Number.isFinite(max) && max > 0;
  const prefix = opportunity?.currency === 'INR' ? 'Rs.' : opportunity?.currency || 'Rs.';

  if (hasMin && hasMax) return `${prefix} ${min.toLocaleString()} - ${max.toLocaleString()}`;
  if (hasMin) return `From ${prefix} ${min.toLocaleString()}`;
  if (hasMax) return `Up to ${prefix} ${max.toLocaleString()}`;
  return 'Payment not specified';
};

const getStatusFilter = (tab) => {
  if (tab === 'archived') return 'all';
  return tab;
};

const filterRowsForTab = (rows, tab) => {
  if (tab === 'archived') return rows.filter((row) => ['rejected', 'paused', 'closed'].includes(row.status));
  return rows.filter((row) => row.status === tab);
};

// --- AUDIT LOGGER ---
const logAction = async (action, details) => {
    try {
        const userRes = await supabase.auth.getUser();
        await supabase.from('admin_audit_logs').insert({ 
            admin_id: userRes.data.user?.id,
            action_type: action,
            metadata: details 
        });
    } catch (e) { 
        console.error("Administrative audit log capture failed:", e); 
    }
};

// ==========================================
//   SUB-COMPONENT: ADMIN OPPORTUNITY CARD
// ==========================================
const AdminOpportunityCard = ({
  opportunity,
  loading,
  expanded,
  onToggle,
  onApprove,
  onReject,
  onPause,
  onClose,
  onRetrySync,
}) => (
  <article className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm transition-colors">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cx('rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider', STATUS_STYLES[opportunity.status] || STATUS_STYLES.pending_review)}>
            {formatStatus(opportunity.status)}
          </span>
          <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
            {TYPE_LABELS[opportunity.type] || opportunity.type}
          </span>
          <span className="rounded-full bg-slate-100 dark:bg-gray-700 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-gray-300">
            {getOpportunityPublishLabel(opportunity.publish_to)}
          </span>
        </div>

        <h3 className="mt-4 text-xl font-black tracking-tight text-gray-900 dark:text-white">{opportunity.title}</h3>
        <p className="mt-2 line-clamp-3 max-w-4xl text-sm font-medium leading-6 text-gray-500 dark:text-gray-400">{opportunity.description}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(opportunity.skills_required || []).slice(0, 8).map((skill) => (
            <span key={skill} className="rounded-xl bg-slate-100 dark:bg-gray-700 px-3 py-1 text-xs font-black text-slate-600 dark:text-gray-300">{skill}</span>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 text-xs font-black uppercase tracking-wider text-gray-600 dark:text-gray-200 transition hover:bg-slate-50 dark:hover:bg-gray-600"
        >
          <Eye size={15} />
          Details
        </button>

        {opportunity.status === 'pending_review' && (
          <>
            <button
              type="button"
              disabled={loading}
              onClick={onApprove}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              Approve
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onReject}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 px-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-rose-700 disabled:opacity-60"
            >
              <XCircle size={15} />
              Reject
            </button>
          </>
        )}

        {opportunity.status === 'active' && (
          <>
            <button
              type="button"
              disabled={loading}
              onClick={onRetrySync}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-black dark:bg-gray-900 px-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              <RefreshCcw size={15} className={loading ? 'animate-spin' : ''} />
              Retry Sync
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onPause}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-600 px-3 text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 transition hover:bg-slate-50 dark:hover:bg-gray-700 disabled:opacity-60"
            >
              <PauseCircle size={15} />
              Pause
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-600 px-3 text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 transition hover:bg-slate-50 dark:hover:bg-gray-700 disabled:opacity-60"
            >
              <XCircle size={15} />
              Close
            </button>
          </>
        )}
      </div>
    </div>

    <div className="mt-5 grid gap-3 text-sm font-bold text-gray-500 dark:text-gray-400 md:grid-cols-2 xl:grid-cols-4">
      <span className="flex items-center gap-2"><BriefcaseBusiness size={16} className="text-indigo-500" /> {opportunity.business_name}</span>
      <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-500" /> {opportunity.verification_status || 'Not verified'}</span>
      <span className="flex items-center gap-2"><Clock3 size={16} className="text-violet-500" /> {opportunity.work_mode || 'remote'} / {opportunity.location || 'Flexible'}</span>
      <span className="flex items-center gap-2"><CalendarDays size={16} className="text-amber-500" /> Deadline {formatDate(opportunity.application_deadline)}</span>
    </div>

    {expanded && (
      <div className="mt-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900/50 p-4 animate-in fade-in duration-200">
        <dl className="grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-3">
          <div>
            <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Payment</dt>
            <dd className="mt-1 font-black text-slate-800 dark:text-slate-200">{formatMoney(opportunity)}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Duration</dt>
            <dd className="mt-1 font-black text-slate-800 dark:text-slate-200">{opportunity.duration || 'Flexible'}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Created</dt>
            <dd className="mt-1 font-black text-slate-800 dark:text-slate-200">{formatDate(opportunity.created_at)}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Business type</dt>
            <dd className="mt-1 font-black text-slate-800 dark:text-slate-200">{opportunity.business_type || 'Business'}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Can post</dt>
            <dd className="mt-1 font-black text-slate-800 dark:text-slate-200">{opportunity.can_post ? 'Yes' : 'No / unknown'}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Contact</dt>
            <dd className="mt-1 font-black text-slate-800 dark:text-slate-200">{opportunity.contact_email || 'Not provided'}</dd>
          </div>
        </dl>
        {opportunity.rejection_reason && (
          <div className="mt-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-sm font-bold text-rose-700 dark:text-rose-400">
            Rejection reason: {opportunity.rejection_reason}
          </div>
        )}
      </div>
    )}
  </article>
);

// ==========================================
//          MAIN SYSTEM COMPONENT
// ==========================================
const AdminDashboard = ({ user, onLogout }) => {
  // --- LAYOUT NAVIGATION ---
  const [tab, setTab] = useState('overview');
  const [reportFilter, setReportFilter] = useState('pending');
  const [oppTab, setOppTab] = useState('pending_review');

  // --- COMPREHENSIVE REPOSITORIES ---
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [services, setServices] = useState([]);
  const [reports, setReports] = useState([]);
  const [escrowOrders, setEscrowOrders] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]); 
  const [oppRows, setOppRows] = useState([]);
  const [businessRows, setBusinessRows] = useState([]);

  // --- LIVE CHAT ENGINE STATES ---
  const [supportTickets, setSupportTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const messagesEndRef = useRef(null);

  // --- PAGE CONTROLLER STATES ---
  const [page, setPage] = useState(0);          
  const [totalPages, setTotalPages] = useState(0);
  const [logsPage, setLogsPage] = useState(0);  
  const [totalLogsPages, setTotalLogsPages] = useState(0);
  const ITEMS_PER_PAGE = 20;

  // --- CRITICAL PROCESSING INDICATORS ---
  const [globalLoading, setGlobalLoading] = useState(true);
  const [actingId, setActingId] = useState('');
  const [expandedId, setExpandedId] = useState('');
  const [oppError, setOppError] = useState('');
  const [businessError, setBusinessError] = useState('');

  // --- AGGREGATED TELEMETRY STATS ---
  const [stats, setStats] = useState({ 
    totalUsers: 0, totalJobs: 0, totalServices: 0, 
    totalRevenue: 0, activeReports: 0, heldInEscrow: 0,
    pendingKyc: 0, activeTickets: 0, pendingOpportunities: 0
  });

  // --- OPERATIONAL MODAL STATES ---
  const [selectedReport, setSelectedReport] = useState(null); 
  const [evidence, setEvidence] = useState(null); 
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutData, setPayoutData] = useState(null); 
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [utrInput, setUtrInput] = useState('');

  // --- RUNTIME NOTIFICATIONS ---
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // --- OPPORTUNITIES COMPUTED SELECTOR ---
  const visibleOppRows = useMemo(() => filterRowsForTab(oppRows, oppTab), [oppTab, oppRows]);

  // --- ASYNC ROUTING RESOLVER ---
  const loadTabData = useCallback(async () => {
    setGlobalLoading(true);
    setOppError('');
    try {
      if (tab === 'overview') await fetchOverviewData();
      else if (tab === 'businesses') await fetchBusinessReviewData();
      else if (tab === 'opportunities') await fetchOpportunitiesData();
      else if (tab === 'users') await fetchUsersPaginated(page);
      else if (tab === 'jobs') await fetchJobs();
      else if (tab === 'services') await fetchServices();
      else if (tab === 'reports') await fetchReports();
      else if (tab === 'financials') await fetchFinancials();
      else if (tab === 'logs') await fetchLogsPaginated(logsPage);
      else if (tab === 'support') await fetchSupportTickets();
    } catch (err) {
      console.error("Tab runtime initialization failed:", err);
    } finally {
      setGlobalLoading(false);
    }
  }, [tab, reportFilter, page, logsPage, oppTab]);

  useEffect(() => {
    if (tab !== 'users') setPage(0);
    if (tab !== 'logs') setLogsPage(0);
    loadTabData();
  }, [tab, reportFilter, page, logsPage, oppTab, loadTabData]);

  // --- TELEMETRY CALCULATOR ENGINE ---
  const fetchOverviewData = async () => {
    const [
        clientsCount, freelancersCount, jobsCount, servicesCount, 
        pendingReports, paymentsRes, escrowsRes, pendingKycRes, activeTicketsRes, pendingOppsRes
    ] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }),
        supabase.from('freelancers').select('id', { count: 'exact', head: true }),
        supabase.from('jobs').select('id', { count: 'exact', head: true }),
        supabase.from('services').select('id', { count: 'exact', head: true }),
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('applications').select('bid_amount').eq('status', 'Paid'),
        api.fetchAdminEscrowOrders(0, 100), 
        Promise.all([
             supabase.from('clients').select('id', { count: 'exact', head: true }).eq('kyc_status', 'pending'),
             supabase.from('freelancers').select('id', { count: 'exact', head: true }).eq('kyc_status', 'pending')
        ]),
        supabase.from('support_tickets').select('id', { count: 'exact', head: true }).neq('status', 'resolved'),
        supabase.from('opportunities').select('id', { count: 'exact', head: true }).eq('status', 'pending_review')
    ]);

    const totalRevenue = (paymentsRes.data || []).reduce((acc, curr) => acc + (Number(curr.bid_amount) * 0.05), 0);
    const heldOrders = (escrowsRes.data || []).filter(order => order.status === 'Funded');
    const totalHeld = heldOrders.reduce((acc, curr) => acc + (Number(curr.bid_amount) || 0), 0);
    const totalPendingKyc = (pendingKycRes[0].count || 0) + (pendingKycRes[1].count || 0);

    setStats({
        totalUsers: (clientsCount.count || 0) + (freelancersCount.count || 0),
        totalJobs: jobsCount.count || 0,
        totalServices: servicesCount.count || 0,
        totalRevenue,
        activeReports: pendingReports.count || 0,
        heldInEscrow: totalHeld,
        pendingKyc: totalPendingKyc,
        activeTickets: activeTicketsRes.count || 0,
        pendingOpportunities: pendingOppsRes.count || 0
    });
  };

  const fetchBusinessReviewData = async () => {
    setBusinessError('');
    try {
      setBusinessRows(await getAdminBusinessProfiles('all'));
    } catch (error) {
      console.error('Business verification queue failed:', error);
      setBusinessRows([]);
      setBusinessError(error?.message || 'Unable to load business verification records.');
    }
  };

  const runBusinessReview = async (business, action) => {
    const reason = ['reject', 'suspend'].includes(action)
      ? window.prompt(`${action === 'reject' ? 'Reject' : 'Suspend'} ${business.business_name}. Provide a reason:`, '')
      : '';
    if (reason === null) return;
    if (['reject', 'suspend'].includes(action) && !reason.trim()) {
      showToast('A reason is required.', 'error');
      return;
    }

    setActingId(business.user_id);
    try {
      await reviewBusinessAsAdmin(business.user_id, action, reason);
      showToast(`Business ${action === 'verify' ? 'verified' : `${action}ed`}.`, 'success');
      await fetchBusinessReviewData();
    } catch (error) {
      setBusinessError(error?.message || 'Business review failed.');
      showToast(error?.message || 'Business review failed.', 'error');
    } finally {
      setActingId('');
    }
  };

  // --- OPPORTUNITY PIPELINE ACTIONS ---
  const fetchOpportunitiesData = async () => {
    try {
      const data = await getAdminOpportunities(getStatusFilter(oppTab));
      setOppRows(data || []);
    } catch (loadError) {
      console.error('Core review queue deployment interface malfunction:', loadError);
      setOppError(loadError?.message || 'Unable to download platform pipeline architecture queues.');
    }
  };

  const runOpportunityAction = async (opportunity, action, message) => {
    setActingId(opportunity.id);
    setOppError('');
    try {
      const result = await action();
      const warning = result?.cache_sync_warning;
      const finalMessage = warning || message;
      showToast(finalMessage, warning ? 'error' : 'success');
      await logAction('OPPORTUNITY_MUTATION', { opportunityId: opportunity.id, title: opportunity.title, statusChange: opportunity.status });
      await fetchOpportunitiesData();
    } catch (actionError) {
      console.error('Edge pipeline action trigger aborted:', actionError);
      const actionMessage = actionError?.message || 'Action processing error. Rollback executed.';
      setOppError(actionMessage);
      showToast(actionMessage, 'error');
    } finally {
      setActingId('');
    }
  };

  const approveOpp = (opportunity) => {
    if (!window.confirm(`Approve "${opportunity.title}" and sync to Cloudflare edge networks?`)) return;
    runOpportunityAction(opportunity, () => approveOpportunityAsAdmin(opportunity.id), 'Opportunity state committed. Cloudflare edge pipeline synced.');
  };

  const rejectOpp = (opportunity) => {
    const reason = window.prompt(`Reject "${opportunity.title}"? Provide context explanation metrics:`, '');
    if (reason === null) return;
    runOpportunityAction(opportunity, () => rejectOpportunityAsAdmin(opportunity.id, reason), 'Submission rejected. Cache purge signals transmitted.');
  };

  const pauseOpp = (opportunity) => {
    if (!window.confirm(`Suspend listing context for "${opportunity.title}" across global networks?`)) return;
    runOpportunityAction(opportunity, () => pauseOpportunityAsAdmin(opportunity.id), 'Listing suspended. Cloudflare edge metrics purged.');
  };

  const closeOpp = (opportunity) => {
    if (!window.confirm(`Permanently flag "${opportunity.title}" as closed?`)) return;
    runOpportunityAction(opportunity, () => closeOpportunityAsAdmin(opportunity.id), 'Pipeline asset closed. Purge request finalized.');
  };

  const retrySyncOpp = (opportunity) => {
    if (!window.confirm(`Force cache reconstruction array synchronization parameters for "${opportunity.title}"?`)) return;
    runOpportunityAction(opportunity, () => syncOpportunityCacheFromAdmin(opportunity.id, 'upsert'), 'Global cache mapping records synchronized completely.');
  };

  // --- LIVE ENGINE ENGINE ENGINE ---
  const fetchSupportTickets = async () => {
      const { data, error } = await supabase
          .from('support_tickets')
          .select('*')
          .order('updated_at', { ascending: false });
          
      if (!error && data) {
          setSupportTickets(data);
          setStats(prev => ({ ...prev, activeTickets: data.filter(t => t.status !== 'resolved').length }));
      }
  };

  const openTicketChat = async (ticket) => {
      setActiveTicket(ticket);
      const { data } = await supabase
          .from('support_messages')
          .select('*')
          .eq('ticket_id', ticket.id)
          .order('created_at', { ascending: true });
      
      setTicketMessages(data || []);
  };

  const handleSendAdminReply = async (e) => {
      e.preventDefault();
      if (!replyText.trim() || !activeTicket) return;

      const text = replyText.trim();
      setReplyText(''); 

      const adminUser = (await supabase.auth.getUser()).data.user;

      await supabase.from('support_messages').insert({
          ticket_id: activeTicket.id,
          sender_id: adminUser.id,
          is_admin: true,
          message: text
      });

      await supabase.from('support_tickets').update({ 
          updated_at: new Date().toISOString(),
          status: 'in_progress' 
      }).eq('id', activeTicket.id);

      fetchSupportTickets(); 
  };

  const handleResolveTicket = async () => {
      if (!activeTicket) return;
      
      await supabase.from('support_tickets').update({ status: 'resolved' }).eq('id', activeTicket.id);
      
      let userEmail = '';
      let userName = 'User';
      
      const { data: fData } = await supabase.from('freelancers').select('email, name').eq('id', activeTicket.user_id).maybeSingle();
      if (fData) {
          userEmail = fData.email;
          userName = fData.name;
      } else {
          const { data: cData } = await supabase.from('clients').select('email, name').eq('id', activeTicket.user_id).maybeSingle();
          if (cData) {
              userEmail = cData.email;
              userName = cData.name;
          }
      }

      if (userEmail) {
          supabase.functions.invoke('send-parent-otp', {
              body: {
                  type: "ticket",
                  action: "resolved",
                  userEmail: userEmail,
                  userName: userName,
                  ticketId: activeTicket.id,
                  subject: activeTicket.subject
              }
          }).catch(err => console.error("Automated template routing dispatch failed:", err));
      }

      showToast("Session resolution successfully finalized.");
      setActiveTicket(null);
      fetchSupportTickets();
  };

  // REALTIME REALTIME SUBSCRIPTION BINDING
  useEffect(() => {
      if (!activeTicket) return;

      const channel = supabase
          .channel(`admin_ticket_${activeTicket.id}`)
          .on('postgres_changes', { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'support_messages', 
              filter: `ticket_id=eq.${activeTicket.id}` 
          }, (payload) => {
              setTicketMessages(prev => [...prev, payload.new]);
          })
          .subscribe();

      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

      return () => { supabase.removeChannel(channel); };
  }, [activeTicket]);

  // --- CORE SYSTEM MODERATION ---
  const fetchUsersPaginated = async (pageNumber) => {
    const from = pageNumber * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    const [clientsRes, freelancersRes] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact' }).range(from, to),
        supabase.from('freelancers').select('*', { count: 'exact' }).range(from, to)
    ]);
    const allUsers = [
        ...(clientsRes.data || []).map(u => ({...u, role: 'client'})), 
        ...(freelancersRes.data || []).map(u => ({...u, role: 'freelancer'}))
    ];
    setUsers(allUsers);
    const maxCount = Math.max(clientsRes.count || 0, freelancersRes.count || 0);
    setTotalPages(Math.ceil(maxCount / ITEMS_PER_PAGE));
  };

  const fetchLogsPaginated = async (pageNumber) => {
    const LOGS_PER_PAGE = 50;
    const from = pageNumber * LOGS_PER_PAGE;
    const to = from + LOGS_PER_PAGE - 1;
    const [adminLogs, userLogs, paymentLogs] = await Promise.all([
        supabase.from('admin_audit_logs').select('*', { count: 'exact' }).range(from, to).order('created_at', { ascending: false }),
        supabase.from('audit_logs').select('*', { count: 'exact' }).range(from, to).order('created_at', { ascending: false }),
        supabase.from('payment_logs').select('*', { count: 'exact' }).range(from, to).order('created_at', { ascending: false })
    ]);
    const combined = [
        ...(adminLogs.data || []).map(l => ({ ...l, type: 'ADMIN', action: l.action_type, details: l.metadata, user_id: l.admin_id })),
        ...(userLogs.data || []).map(l => ({ ...l, type: 'USER', user_id: l.actor_id })),
        ...(paymentLogs.data || []).map(l => ({
            id: l.id,
            created_at: l.created_at,
            type: 'FINANCE',
            action: `MONEY_${l.status}`,
            details: { amount: l.amount, ...l.raw_data },
            user_id: l.raw_data?.action_by || 'SYSTEM'
        }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setAuditLogs(combined.slice(0, LOGS_PER_PAGE));
    const maxCount = Math.max(adminLogs.count || 0, userLogs.count || 0, paymentLogs.count || 0);
    setTotalLogsPages(Math.ceil(maxCount / LOGS_PER_PAGE));
  };
  
  const fetchJobs = async () => {
    const { data } = await supabase.from('jobs').select('*').limit(50);
    setJobs(data || []);
  };
  const fetchServices = async () => {
    const { data } = await supabase.from('services').select('*').limit(50);
    setServices(data || []);
  };
  const fetchReports = async () => {
    const { data } = await supabase.from('reports').select('*').eq('status', reportFilter).order('created_at', { ascending: false }).limit(50);
    setReports(data || []);
  };
  const fetchFinancials = async () => {
    const { data } = await api.fetchAdminEscrowOrders(0, 100);
    setEscrowOrders(data || []);
  };

  const handleKycAction = async (userId, role, status) => {
    const table = role === 'client' ? 'clients' : 'freelancers';
    let reason = null;
    if (status === 'rejected') {
        reason = prompt("Specify user structural documentation failure reason parameters:");
        if (!reason) return; 
    }
    if (!window.confirm(`Update state validation metric matrices parameter alignment to: ${status.toUpperCase()}?`)) return;
    const { error } = await supabase.from(table).update({ 
        kyc_status: status, kyc_reviewed_at: new Date().toISOString(), kyc_rejection_reason: reason 
    }).eq('id', userId);
    
    if (error) {
        showToast(`Verification parameters sync failed: ${error.message}`, 'error');
    } else {
        showToast(`User KYC verification matrix updated successfully.`);
        await logAction(`KYC_${status.toUpperCase()}`, { userId, role, reason });
        setUsers(users.map(u => u.id === userId ? { ...u, kyc_status: status } : u));
        if (status !== 'pending' && tab === 'users') setStats(prev => ({ ...prev, pendingKyc: Math.max(0, prev.pendingKyc - 1) }));
    }
  };

  const handleResolveReport = async (id, newStatus) => {
      const { error } = await supabase.from('reports').update({ status: newStatus }).eq('id', id);
      if(error) showToast("Error executing reporting resolution matrices protocol", "error");
      else {
          showToast(`Incident flagged record context updated.`);
          await logAction('RESOLVE_REPORT', { reportId: id, status: newStatus });
          if (selectedReport?.id === id) setSelectedReport(null);
          if (reportFilter !== newStatus) setReports(reports.filter(r => r.id !== id));
          if (reportFilter === 'pending' && newStatus !== 'pending') setStats(prev => ({...prev, activeReports: prev.activeReports - 1}));
      }
  };
  
  const handleBanUser = async (id, table) => {
    if(!window.confirm("⚠️ INSTANTIATE PLATFORM BAN ISOLATION PROTOCOLS: Process target?")) return;
    const { error } = await supabase.from(table).update({ status: 'banned' }).eq('id', id);
    if (error) showToast(error.message, 'error');
    else {
        showToast("Banning process sequences executed successfully.");
        await logAction('BAN_USER', { targetId: id, table });
        if (selectedReport) handleResolveReport(selectedReport.id, 'resolved');
        else loadTabData();
    }
  };

  const handleDeleteJob = async (id) => {
       if(!window.confirm("Purge job schema instance from cloud nodes?")) return;
       const { error } = await supabase.from('jobs').delete().eq('id', id);
       if (error) showToast(error.message, 'error');
       else { 
         showToast("Job parsed from schema node elements."); 
         await logAction('DELETE_JOB', { jobId: id });
         loadTabData(); 
       }
  };

  const handleDeleteService = async (id) => {
       if(!window.confirm("Wipe gig node matrix record configuration?")) return;
       const { error } = await supabase.from('services').delete().eq('id', id);
       if (error) showToast(error.message, 'error');
       else { 
         showToast("Service instance dissolved."); 
         await logAction('DELETE_SERVICE', { serviceId: id });
         loadTabData(); 
       }
  };

  const initiatePayout = async (order) => {
    setPayoutLoading(true);
    setPayoutModalOpen(true);
    try {
        const { data: bankData, error } = await supabase
            .from('user_banking')
            .select('*')
            .eq('user_id', order.freelancer_id)
            .maybeSingle(); 
        
        if (error) {
            setPayoutData({ order, bankDetails: null });
            showToast("Failed loading beneficiary structural endpoints.", "error");
        } else if (!bankData) {
            setPayoutData({ order, bankDetails: null });
            showToast("Beneficiary banking array missing allocation records.", "error");
        } else {
            setPayoutData({ order, bankDetails: bankData });
        }
    } catch (_err) {
        setPayoutData({ order, bankDetails: null });
    }
    setPayoutLoading(false);
  };

  const confirmManualPayout = async () => {
    if (!utrInput || !payoutData?.order) return;
    const { order } = payoutData;
    
    const { error } = await api.adminForceRelease(order.id, order.bid_amount, order.freelancer_id, utrInput);
    
    if(error) {
        showToast(error.message, 'error');
    } else { 
        showToast("Payout recorded securely into ledger arrays.");
        await logAction('MANUAL_PAYOUT', { appId: order.id, amount: order.bid_amount, utr: utrInput });

        const netPayable = (order.bid_amount * 0.95).toFixed(0);
        const { data: freelancerData } = await supabase
            .from('freelancers')
            .select('email')
            .eq('id', order.freelancer_id)
            .single();

        if (freelancerData?.email) {
            supabase.functions.invoke('send-parent-otp', {
                body: {
                    type: "payout_released",
                    freelancerName: order.freelancer_name,
                    freelancerEmail: freelancerData.email,
                    amount: netPayable,
                    jobTitle: order.jobs?.title || "Freelance Gig",
                    utr: utrInput
                }
            }).catch(e => console.error("Asynchronous microservice execution tracking failure:", e));
        }

        setPayoutModalOpen(false);
        setUtrInput('');
        setPayoutData(null);
        loadTabData(); 
    }
  };

  const openCaseFile = async (report) => {
    setSelectedReport(report);
    setEvidenceLoading(true);
    try {
        let jobData = null;
        if (report.target_type === 'job' && report.target_id) {
             const { data } = await supabase.from('jobs').select('*').eq('id', report.target_id).single();
             jobData = data;
        }
        const { data: chats } = await supabase
            .from('messages')
            .select('*')
            .or(`sender_id.eq.${report.reporter_id},receiver_id.eq.${report.reporter_id}`)
            .order('created_at', { ascending: false })
            .limit(20);
        const relevantChats = chats?.filter(msg => 
            (msg.sender_id === report.reporter_id && msg.receiver_id === report.reported_user_id) ||
            (msg.sender_id === report.reported_user_id && msg.receiver_id === report.reporter_id)
        ) || [];
        setEvidence({ job: jobData, chats: relevantChats });
    } catch (_err) {
        showToast("Forensic case file compilation failure", "error");
    } finally {
        setEvidenceLoading(false);
    }
  };

  const handleViewId = async (pathOrUrl) => {
    if (!pathOrUrl) return;
    showToast("Constructing cryptographically signed asset token arrays...", "info");
    if (pathOrUrl.startsWith('http')) {
        const match = pathOrUrl.split('/id_proofs/')[1];
        if (match) {
             const { data, error } = await supabase.storage.from('id_proofs').createSignedUrl(match, 60);
             if (error) return showToast("Legacy target path mapping resolution failed", "error");
             await logAction('VIEW_ID_PROOF_LEGACY', { path: match });
             window.open(data.signedUrl, '_blank');
        } else {
             window.open(pathOrUrl, '_blank');
        }
    } else {
        const { data, error } = await supabase.storage.from('id_proofs').createSignedUrl(pathOrUrl, 60);
        if (error || !data) return showToast("Storage access authorization denied.", "error"); 
        await logAction('VIEW_ID_PROOF', { path: pathOrUrl });
        window.open(data.signedUrl, '_blank');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to transaction stack data layers!", "success");
  };

  // --- RENDERING PAGINATION LAYOUT WRAPPERS ---
  const PaginationControls = ({ currentPage, totalPages, onPageChange }) => (
    <div className="flex justify-center gap-4 mt-6 items-center pb-8">
        <button disabled={currentPage === 0} onClick={() => onPageChange(Math.max(0, currentPage - 1))} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Previous</button>
        <span className="text-sm font-mono text-gray-500">Page {currentPage + 1} of {totalPages || 1}</span>
        <button disabled={currentPage >= totalPages - 1} onClick={() => onPageChange(currentPage + 1)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-indigo-700 transition-colors">Next</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex font-sans text-gray-950 dark:text-gray-50 antialiased selection:bg-red-500 selection:text-white transition-colors duration-200">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* ==========================================
                    SIDEBAR SYSTEM
         ========================================== */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col fixed h-full z-10 transition-colors">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 font-black text-xl text-red-600 tracking-tight">
          <Shield size={24} className="animate-pulse" /> TeenVerse Admin
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {[
            { id: 'overview', icon: <LayoutDashboard size={18} /> },
            { id: 'businesses', icon: <ShieldCheck size={18} /> },
            { id: 'opportunities', icon: <BriefcaseBusiness size={18} />, count: stats.pendingOpportunities, color: 'bg-amber-500' },
            { id: 'support', icon: <LifeBuoy size={18} />, count: stats.activeTickets, color: 'bg-indigo-500' },
            { id: 'financials', icon: <Landmark size={18} />, count: stats.heldInEscrow > 0 ? '₹' : null, color: 'bg-emerald-500' },
            { id: 'reports', icon: <Flag size={18} />, count: stats.activeReports, color: 'bg-red-500' },
            { id: 'users', icon: <Users size={18} />, count: stats.pendingKyc, color: 'bg-blue-500' },
            { id: 'jobs', icon: <Briefcase size={18} /> },
            { id: 'services', icon: <Package size={18} /> },
            { id: 'logs', icon: <Activity size={18} /> }
          ].map((item) => (
             <button 
               key={item.id} 
               onClick={() => setTab(item.id)} 
               className={cx(
                 "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all capitalize",
                 tab === item.id 
                   ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border-l-4 border-red-600 rounded-l-none' 
                   : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
               )}
             >
                {item.icon}
                <span className="flex-1 text-left">{item.id}</span>
                {item.count ? (
                  <span className={cx("text-[10px] px-2 py-0.5 rounded-full font-black text-white", item.color || "bg-gray-500")}>
                    {item.count}
                  </span>
                ) : null}
             </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-xl text-[11px] font-mono text-center text-gray-400 border border-gray-100 dark:border-gray-800 truncate">
             {user?.email || 'Secured Core Session'}
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"><LogOut size={18} /> System Egress</button>
        </div>
      </aside>

      {/* ==========================================
                  MAIN GRID ARCHITECTURE
         ========================================== */}
      <main className="flex-1 p-4 md:p-8 md:ml-64 overflow-y-auto min-h-screen">
        <header className="mb-8 flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-600">Administrative Orchestration Deck</p>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white capitalize mt-1">{tab === 'opportunities' ? 'Opportunity Engine' : tab}</h1>
          </div>
        </header>

        {/* --- GLOBAL LOADING PLACEHOLDER --- */}
        {globalLoading && tab !== 'opportunities' && (
          <div className="flex min-h-80 items-center justify-center rounded-[32px] bg-white dark:bg-gray-800 text-slate-500">
            <Loader2 size={36} className="animate-spin text-red-600" />
          </div>
        )}

        {/* ==========================================
                        TAB: OVERVIEW
           ========================================== */}
        {!globalLoading && tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700">
                 <div className="flex justify-between mb-2"><h3 className="text-gray-400 font-black text-xs uppercase tracking-wider">Gross Platform Cut</h3><DollarSign className="text-emerald-500"/></div>
                 <p className="text-3xl font-black tracking-tight">₹{stats.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700">
                 <div className="flex justify-between mb-2"><h3 className="text-gray-400 font-black text-xs uppercase tracking-wider">Escrow Holds</h3><Landmark className="text-blue-500"/></div>
                 <p className="text-3xl font-black tracking-tight text-blue-600 dark:text-blue-400">₹{stats.heldInEscrow}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700">
                 <div className="flex justify-between mb-2"><h3 className="text-gray-400 font-black text-xs uppercase tracking-wider">Pending KYC</h3><ShieldCheck className="text-amber-500"/></div>
                 <p className="text-3xl font-black tracking-tight text-amber-500">{stats.pendingKyc}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700">
                 <div className="flex justify-between mb-2"><h3 className="text-gray-400 font-black text-xs uppercase tracking-wider">Support Inbox</h3><LifeBuoy className="text-indigo-500"/></div>
                 <p className="text-3xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">{stats.activeTickets}</p>
              </div>
            </div>

            <div className="rounded-[32px] bg-gradient-to-br from-gray-900 to-slate-800 p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                    <span className="bg-red-500 text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full">System Broadcast Node</span>
                    <h2 className="text-2xl font-black tracking-tight">V3 Cache Synchronization Engine Ready</h2>
                    <p className="text-xs text-gray-400 max-w-xl font-medium">Platform opportunities are securely mutations into Supabase storage layers before pushing direct cache structures into Cloudflare D1 databases globally.</p>
                </div>
                <button onClick={() => setTab('opportunities')} className="px-6 py-3 bg-white text-gray-900 font-black rounded-2xl text-xs uppercase tracking-wider hover:bg-gray-100 transition shadow-lg shrink-0">Manage Gateways</button>
            </div>
          </div>
        )}

        {!globalLoading && tab === 'businesses' && (
          <section className="space-y-4">
            <div className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-black">Business Verification</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Verify, reject, or suspend business workspaces. Posting is enabled only for verified businesses.</p>
                </div>
                <button type="button" onClick={fetchBusinessReviewData} className="h-10 rounded-xl bg-indigo-600 px-4 text-xs font-black uppercase text-white">Refresh</button>
              </div>
              {businessError && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{businessError}</p>}
            </div>

            {businessRows.length ? businessRows.map((business) => (
              <article key={business.user_id} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase text-slate-700 dark:bg-gray-700 dark:text-gray-200">{business.verification_status}</span>
                    <h3 className="mt-3 text-lg font-black">{business.business_name}</h3>
                    <p className="mt-1 text-sm font-bold text-slate-500">{business.business_type} · {business.contact_email || 'No contact email'}</p>
                    {business.description && <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-500">{business.description}</p>}
                    {business.rejection_reason && <p className="mt-3 text-sm font-bold text-rose-600">Reason: {business.rejection_reason}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {business.verification_status !== 'verified' && <button disabled={actingId === business.user_id} onClick={() => runBusinessReview(business, 'verify')} className="h-10 rounded-xl bg-emerald-600 px-4 text-xs font-black uppercase text-white disabled:opacity-60">Verify</button>}
                    {business.verification_status !== 'rejected' && <button disabled={actingId === business.user_id} onClick={() => runBusinessReview(business, 'reject')} className="h-10 rounded-xl bg-rose-600 px-4 text-xs font-black uppercase text-white disabled:opacity-60">Reject</button>}
                    {business.verification_status !== 'suspended' && <button disabled={actingId === business.user_id} onClick={() => runBusinessReview(business, 'suspend')} className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-black uppercase disabled:opacity-60">Suspend</button>}
                  </div>
                </div>
              </article>
            )) : (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm font-bold text-slate-500 dark:border-gray-700 dark:bg-gray-800">No business profiles found.</div>
            )}
          </section>
        )}

        {/* ==========================================
                     TAB: OPPORTUNITIES
           ========================================== */}
        {tab === 'opportunities' && (
          <div className="space-y-5">
            <section className="rounded-[32px] bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-xl font-black tracking-tight">Pipeline Processing Validation Gate</h2>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                    Approve business deployments into active states, initiating atomic replication updates directly into edge nodes.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2 items-center">
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-full border border-gray-200/50 dark:border-gray-700">
                  {REVIEW_TABS.map((tabInstance) => (
                    <button
                      key={tabInstance.id}
                      type="button"
                      onClick={() => setOppTab(tabInstance.id)}
                      className={cx(
                        'h-9 px-4 text-xs font-black rounded-full transition-all tracking-tight',
                        oppTab === tabInstance.id ? 'bg-black text-white dark:bg-gray-700' : 'text-slate-600 dark:text-gray-400 hover:text-black dark:hover:text-white',
                      )}
                    >
                      {tabInstance.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={fetchOpportunitiesData}
                  className="ml-auto inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-black text-white transition hover:bg-indigo-700 shadow-md"
                >
                  <RefreshCcw size={14} className={globalLoading ? 'animate-spin' : ''} />
                  Force Array Reload
                </button>
              </div>
            </section>

            {oppError && (
              <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 p-4 text-sm font-bold text-rose-800 dark:text-rose-400">
                <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                {oppError}
              </div>
            )}

            {globalLoading ? (
              <div className="flex min-h-60 items-center justify-center rounded-[32px] bg-white dark:bg-gray-800 text-slate-500">
                <Loader2 size={24} className="animate-spin text-indigo-600" />
              </div>
            ) : visibleOppRows.length ? (
              <div className="space-y-4">
                {visibleOppRows.map((opp) => (
                  <AdminOpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    loading={actingId === opp.id}
                    expanded={expandedId === opp.id}
                    onToggle={() => setExpandedId((curr) => curr === opp.id ? '' : opp.id)}
                    onApprove={() => approveOpp(opp)}
                    onReject={() => rejectOpp(opp)}
                    onPause={() => pauseOpp(opp)}
                    onClose={() => closeOpp(opp)}
                    onRetrySync={() => retrySyncOpp(opp)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[32px] border border-dashed border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-10 text-center">
                <ShieldCheck size={32} className="mx-auto text-indigo-600 mb-2" />
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Queue Empty</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">No active structures matched the current pipeline parameters context matrix.</p>
              </div>
            )}
          </div>
        )}

        {/* ==========================================
                        TAB: SUPPORT
           ========================================== */}
        {!globalLoading && tab === 'support' && (
            <div className="bg-white dark:bg-gray-800 rounded-[32px] shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 uppercase text-[10px] font-black tracking-wider text-gray-400 border-b border-gray-100 dark:border-gray-700">
                        <tr>
                            <th className="p-4">Incident User Node</th>
                            <th className="p-4">Subject Context</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Last Event Tick</th>
                            <th className="p-4 text-right">Interfacing</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-medium">
                        {supportTickets.map(ticket => (
                            <tr key={ticket.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                                <td className="p-4 font-mono text-xs text-gray-400">{ticket.user_id.slice(0,12)}...</td>
                                <td className="p-4 font-bold text-gray-900 dark:text-gray-100">{ticket.subject}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wide ${
                                        ticket.status === 'open' ? 'bg-red-100 text-red-600 animate-pulse' : 
                                        ticket.status === 'in_progress' ? 'bg-amber-100 text-amber-600' : 
                                        'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
                                    }`}>
                                        {ticket.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="p-4 text-xs text-gray-400">{new Date(ticket.updated_at).toLocaleString()}</td>
                                <td className="p-4 text-right">
                                    <button 
                                        onClick={() => openTicketChat(ticket)} 
                                        className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                                    >
                                        Establish Link
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {supportTickets.length === 0 && <div className="p-10 text-center text-gray-400 text-xs font-bold">Communications stack structural array empty.</div>}
            </div>
        )}

        {/* ==========================================
                       TAB: FINANCIALS
           ========================================== */}
        {!globalLoading && tab === 'financials' && (
          <div className="space-y-6">
            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-900 flex items-center gap-3">
                <AlertTriangle className="text-amber-600" size={24} />
                <div>
                    <h3 className="font-black text-sm text-amber-800 dark:text-amber-400 uppercase tracking-wide">Manual Escrow Verification Parameters</h3>
                    <p className="text-xs text-amber-700 dark:text-amber-300 font-medium mt-0.5">
                        Liquidity is locked inside structural holding accounts. Process traditional payment nodes manually before capturing transaction hash logs below.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-[32px] shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 uppercase text-[10px] font-black tracking-wider text-gray-400 border-b border-gray-100 dark:border-gray-700">
                        <tr>
                            <th className="p-4">Transaction ID</th>
                            <th className="p-4">Asset Metric</th>
                            <th className="p-4">Client Mapping Target</th>
                            <th className="p-4">Pipeline Phase</th>
                            <th className="p-4 text-right">Mutation</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-medium">
                        {escrowOrders.map(order => (
                            <tr key={order.escrow_order_id || order.id} className={`hover:bg-gray-50/50 dark:hover:bg-gray-700/30 ${order.status === 'Processing' ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''}`}>
                                <td className="p-4 font-mono text-xs text-gray-400">{(order.escrow_order_id || String(order.id)).split('-')[0]}...</td>
                                <td className="p-4 font-black text-emerald-600 dark:text-emerald-400 text-base">₹{order.bid_amount}</td>
                                <td className="p-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 px-2 py-0.5 rounded w-fit">Client: {order.client_name}</span>
                                        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400 px-2 py-0.5 rounded w-fit">Teen: {order.freelancer_name}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                     <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                                        order.status === 'Disputed' ? 'bg-red-100 text-red-700' : 
                                        order.status === 'Paid' || order.status === 'Released' ? 'bg-green-100 text-green-700' :
                                        order.status === 'Processing' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                                        'bg-blue-100 text-blue-700'}`}>
                                        {order.status === 'Processing' ? '⚠️ Execution Mandate Passed' : order.status}
                                     </span>
                                </td>
                                <td className="p-4 text-right">
                                     <button 
                                         onClick={() => initiatePayout(order)} 
                                         className={cx(
                                             "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm",
                                             order.status === 'Processing' 
                                             ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200' 
                                             : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50'
                                         )} 
                                     >
                                         {order.status === 'Processing' ? 'Release Escrow' : 'Override Pay'}
                                     </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        )}

        {/* ==========================================
                        TAB: REPORTS
           ========================================== */}
        {!globalLoading && tab === 'reports' && (
            <div className="space-y-6">
                <div className="flex bg-white dark:bg-gray-800 p-1 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 w-fit">
                  {['pending', 'resolved', 'dismissed'].map((status) => (
                    <button key={status} onClick={() => setReportFilter(status)} className={cx("px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all", reportFilter === status ? 'bg-red-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white')}>
                      {status}
                    </button>
                  ))}
                </div>

                {reports.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-[32px] border border-dashed border-gray-300 dark:border-gray-700">
                        <CheckCircle size={40} className="mx-auto text-green-500 mb-2 opacity-60" />
                        <h3 className="text-base font-black">Incident Matrices Resolved</h3>
                        <p className="text-xs text-gray-400">All network metrics tracking at nominal baseline levels.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {reports.map(report => (
                            <div key={report.id} className="bg-white dark:bg-gray-800 rounded-[32px] p-5 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between gap-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                         <div className="flex items-center gap-2">
                                            <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wide bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">
                                                {report.reason}
                                            </span>
                                            <span className="text-xs text-gray-400 flex items-center gap-1 font-medium">
                                                <Clock size={12} /> {new Date(report.created_at).toLocaleDateString()}
                                            </span>
                                         </div>
                                         {reportFilter === 'pending' && (
                                             <button onClick={() => openCaseFile(report)} className="text-[10px] flex items-center gap-1 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl font-black uppercase tracking-wider hover:bg-indigo-100 transition-colors">
                                                  <Eye size={12} /> Analyze Forensics
                                             </button>
                                         )}
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 text-sm font-medium italic text-gray-600 dark:text-gray-300">
                                        "{report.details || 'No structural commentary provided'}"
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4 text-[11px] font-medium text-gray-400">
                                         <div><span className="font-black uppercase tracking-wider text-[9px] block mb-1">Reporter Reference</span><span className="font-mono bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded border border-gray-100 dark:border-gray-800 select-all block text-gray-600 dark:text-gray-300">{report.reporter_id}</span></div>
                                         <div><span className="font-black uppercase tracking-wider text-[9px] block mb-1">Target Subject Node</span><span className="font-mono bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded border border-gray-100 dark:border-gray-800 select-all block text-gray-600 dark:text-gray-300">{report.reported_user_id}</span></div>
                                    </div>
                                     {reportFilter === 'pending' && (
                                        <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                                            <button onClick={() => handleResolveReport(report.id, 'dismissed')} className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 text-gray-600 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all"><XCircle size={14}/> Clear Node</button>
                                            <button onClick={() => handleBanUser(report.reported_user_id, 'freelancers')} className="flex-1 py-2.5 bg-red-600 text-white font-black uppercase tracking-wider rounded-xl hover:bg-red-700 transition-colors shadow-sm text-xs flex items-center justify-center gap-2"><Trash2 size={14}/> Detach Account</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                      ))}
                    </div>
                )}
            </div>
        )}

        {/* ==========================================
                        TAB: USERS
           ========================================== */}
        {!globalLoading && tab === 'users' && (
          <div className="flex flex-col gap-4">
             <div className="bg-white dark:bg-gray-800 rounded-[32px] shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-left min-w-[600px] text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-400 text-[10px] uppercase font-black tracking-wider border-b border-gray-100 dark:border-gray-700">
                    <tr>
                      <th className="p-4">Profile Meta</th>
                      <th className="p-4">Role Classification</th>
                      <th className="p-4">Verification State</th>
                      <th className="p-4">Identity File</th>
                      <th className="p-4 text-right">Moderation Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-medium">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="p-4">
                            <span className="font-bold text-gray-900 dark:text-white block">{u.name}</span>
                            <span className="text-xs text-gray-400 font-mono block">{u.email}</span>
                        </td>
                        <td className="p-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${u.role === 'client' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400'}`}>{u.role}</span>
                        </td>
                        <td className="p-4">
                             <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                                u.kyc_status === 'approved' ? 'bg-green-100 text-green-700' :
                                u.kyc_status === 'rejected' ? 'bg-red-100 text-red-700' :
                                u.kyc_status === 'pending' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                                'bg-gray-100 text-gray-500'
                            }`}>
                                {u.kyc_status || 'Not Started'}
                             </span>
                        </td>
                        <td className="p-4">
                          {u.id_proof_url ? 
                            <button onClick={() => handleViewId(u.id_proof_url)} className="text-indigo-600 dark:text-indigo-400 hover:underline text-xs font-bold flex items-center gap-1">
                                 <Eye size={14}/> Signed Asset
                            </button> : 
                            <span className="text-gray-400 text-xs">Unsubmitted</span>
                          }
                          </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            {u.kyc_status === 'pending' && (
                                <>
                                  <button onClick={() => handleKycAction(u.id, u.role, 'approved')} className="p-2 bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-400 rounded-xl transition-colors" title="Approve Verification Matrix">
                                      <CheckCircle size={16} />
                                  </button>
                                  <button onClick={() => handleKycAction(u.id, u.role, 'rejected')} className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 rounded-xl transition-colors" title="Reject Documents Array">
                                      <XCircle size={16} />
                                  </button>
                                </>
                            )}
                            <button onClick={() => handleBanUser(u.id, u.role === 'client' ? 'clients' : 'freelancers')} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors" title="Isolate System Object">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
             <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
        
        {/* ==========================================
                     TAB: JOBS & SERVICES
           ========================================== */}
        {!globalLoading && (tab === 'jobs' || tab === 'services') && (
          <div className="grid gap-4">
             {(tab === 'jobs' ? jobs : services).map(item => (
              <div key={item.id} className="bg-white dark:bg-gray-800 p-6 rounded-[32px] border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm transition-colors">
                <div>
                  <h3 className="font-black text-lg text-gray-900 dark:text-white tracking-tight">{item.title}</h3>
                  <p className="text-xs font-medium text-gray-400 mt-1">
                    {tab === 'jobs' ? `Entity Owner: ${item.client_name}` : `Provider: ${item.freelancer_name}`} • 
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1 text-sm">
                        {tab === 'jobs' ? `Budget allocation: ${item.budget}` : `Rate: ₹${item.price}`}
                    </span>
                  </p>
                </div>
                <button onClick={() => tab === 'jobs' ? handleDeleteJob(item.id) : handleDeleteService(item.id)} className="w-full sm:w-auto px-4 py-2 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                  Purge Schema Row
                </button>
              </div>
            ))}
             {(tab === 'jobs' ? jobs : services).length === 0 && (
                 <div className="p-12 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[32px] text-sm font-bold">
                     No instances deployed matching current system operational context schemas.
                 </div>
             )}
          </div>
        )}

        {/* ==========================================
                        TAB: LOGS
           ========================================== */}
        {!globalLoading && tab === 'logs' && (
             <div className="flex flex-col gap-4">
                 <div className="bg-white dark:bg-gray-800 rounded-[32px] shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40">
                        <h3 className="font-black text-lg dark:text-white flex items-center gap-2"><Activity className="text-blue-500"/> Consolidated Core Audit Logs</h3>
                        <p className="text-xs text-gray-400 mt-0.5 font-medium">Immutable sequence log of cross-network data changes and admin operations.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-400 text-[10px] uppercase font-black tracking-wider border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="p-4">Timestamp Reference</th>
                                    <th className="p-4">Type Domain</th>
                                    <th className="p-4">Actor Node Reference</th>
                                    <th className="p-4">Action Parameters</th>
                                    <th className="p-4">Data Metadata Schema Payload</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-mono text-xs text-gray-600 dark:text-gray-300">
                                {auditLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-700/30">
                                        <td className="p-4 text-gray-400 text-[11px] whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                                log.type === 'ADMIN' ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400' :
                                                log.type === 'FINANCE' ? 'bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400' :
                                                'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                                            }`}>{log.type}</span>
                                        </td>
                                        <td className="p-4 font-bold text-gray-900 dark:text-white">{log.user_id ? log.user_id.slice(0,12) : 'SYSTEM'}</td>
                                        <td className="p-4 font-bold text-[11px] uppercase tracking-wide text-gray-700 dark:text-gray-300">{log.action}</td>
                                        <td className="p-4 max-w-xs truncate text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-help" title={JSON.stringify(log.details)}>{JSON.stringify(log.details)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {auditLogs.length === 0 && <div className="p-8 text-center text-gray-400 text-xs font-bold">Logger cache registers currently reading empty values.</div>}
                    </div>
                 </div>
                 <PaginationControls currentPage={logsPage} totalPages={totalLogsPages} onPageChange={setLogsPage} />
             </div>
        )}
      </main>

      {/* ==========================================
                REAL-TIME LIVE CHAT ENGINE MODAL
         ========================================== */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[80vh] border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 shrink-0">
                    <div>
                        <h2 className="font-black text-lg dark:text-white flex items-center gap-2 tracking-tight">
                           <MessageSquare className="text-indigo-600" size={20}/> Active Communication Matrix Tunnel
                        </h2>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">Target Node Routing Hash ID: {activeTicket.user_id}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleResolveTicket} className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all">Mark Resolved</button>
                        <button onClick={() => setActiveTicket(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"><XCircle className="text-gray-400" /></button>
                    </div>
                </div>

                {/* Secure Message Buffer Canvas */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50 dark:bg-black/10 custom-scrollbar">
                    {ticketMessages.map((msg, idx) => {
                        const isAdmin = msg.is_admin;
                        return (
                            <div key={idx} className={cx("flex", isAdmin ? 'justify-end' : 'justify-start')}>
                                <div className={cx(
                                    "max-w-[75%] p-3.5 rounded-2xl text-sm shadow-sm font-medium leading-relaxed",
                                    isAdmin 
                                    ? 'bg-indigo-600 text-white rounded-tr-sm shadow-indigo-100 dark:shadow-none' 
                                    : 'bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-tl-sm border border-slate-200/60 dark:border-gray-700'
                                )}>
                                    {!isAdmin && <span className="block text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Incoming Pipeline Endpoint</span>}
                                    <p className="whitespace-pre-wrap">{msg.message}</p>
                                    <span className="block text-right text-[8px] mt-1.5 opacity-50 font-mono">
                                        {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Messaging Pipeline Terminal */}
                <form onSubmit={handleSendAdminReply} className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
                    <div className="relative flex items-center">
                        <input 
                            type="text" 
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Type administrative dispatch message metrics..."
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl py-3.5 pl-4 pr-14 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-sm dark:text-white font-medium transition-all"
                        />
                        <button 
                            type="submit" 
                            disabled={!replyText.trim() || activeTicket.status === 'resolved'}
                            className="absolute right-2 p-2.5 bg-indigo-600 text-white rounded-xl disabled:opacity-50 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 dark:shadow-none"
                        >
                            <Send size={15} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* ==========================================
                     CASE EVIDENCE MODAL
         ========================================== */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <div>
                        <h2 className="font-black text-xl dark:text-white flex items-center gap-2 tracking-tight">
                           <Shield className="text-red-600" size={20}/> Incident Investigation Docket File
                        </h2>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">Parse user interaction message arrays and logs before committing isolation mutations.</p>
                    </div>
                    <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <XCircle className="text-gray-400" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                    {evidenceLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Loader2 className="animate-spin text-indigo-600 mb-2" size={24} />
                            <p className="text-xs font-bold font-mono">Compiling channel memory arrays...</p>
                        </div>
                    ) : (
                        <>
                            {evidence?.job && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50 font-medium">
                                    <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-2"><Briefcase size={13}/> Deployment Node Target Context</h4>
                                    <p className="font-black text-base text-gray-900 dark:text-white tracking-tight">{evidence.job.title}</p>
                                    <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        <span>Budget Mapping: <strong>₹{evidence.job.budget}</strong></span>
                                        <span>Type Attribute: {evidence.job.job_type}</span>
                                    </div>
                                </div>
                            )}
                            <div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2"><MessageSquare size={13}/> Message Pipeline Trace Buffer</h4>
                                <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-2xl h-64 overflow-y-auto space-y-3 border border-gray-100 dark:border-gray-800 custom-scrollbar">
                                    {evidence?.chats && evidence.chats.length > 0 ? (
                                        evidence.chats.map(msg => (
                                            <div key={msg.id} className={cx("flex flex-col", msg.sender_id === selectedReport.reporter_id ? 'items-end' : 'items-start')}>
                                                <div className={cx(
                                                    "px-3.5 py-2 rounded-2xl text-xs max-w-[80%] font-medium leading-relaxed shadow-sm",
                                                    msg.sender_id === selectedReport.reporter_id 
                                                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                                                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-tl-none'
                                                )}>
                                                    {msg.content}
                                                </div>
                                                <span className="text-[9px] font-mono text-gray-400 mt-1 px-1">
                                                    {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-400/60 text-xs font-bold">
                                            <MessageSquare size={28} className="mb-2 opacity-50"/>
                                            <p>No communications log elements trace discovered.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex gap-3">
                    <button onClick={() => handleResolveReport(selectedReport.id, 'dismissed')} className="flex-1 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-black uppercase tracking-wider rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 text-xs transition-colors">Dismiss Incident</button>
                    <button onClick={() => handleBanUser(selectedReport.reported_user_id, 'freelancers')} className="flex-1 py-3 bg-red-600 text-white font-black uppercase tracking-wider rounded-xl hover:bg-red-700 transition-colors text-xs flex items-center justify-center gap-2 shadow-md"><Trash2 size={15}/> Terminate Source Access</button>
                </div>
            </div>
        </div>
      )}

      {/* ==========================================
                      MANUAL PAYOUT MODAL
         ========================================== */}
      {payoutModalOpen && payoutData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/30">
                    <h2 className="font-black text-lg text-emerald-800 dark:text-emerald-400 flex items-center gap-2 tracking-tight">
                        <DollarSign size={20}/> Escrow Settlement Processing Terminal
                    </h2>
                    <button onClick={() => setPayoutModalOpen(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"><XCircle className="text-gray-400" /></button>
                </div>
                
                <div className="p-6 space-y-5">
                    {payoutLoading ? (
                        <div className="text-center py-8"><Loader2 className="animate-spin text-emerald-500 mx-auto mb-2" size={24}/><p className="text-xs font-bold font-mono text-gray-400">Interrogating beneficiary nodes...</p></div>
                    ) : (
                        <>
                            <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 text-sm font-medium">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Liquidity Verification Split Summary</h3>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-gray-500">Gross Contract Allocation Value:</span>
                                    <span className="font-mono font-bold text-gray-900 dark:text-white">₹{payoutData.order.bid_amount}</span>
                                </div>
                                <div className="flex justify-between items-center mb-1 text-red-500 font-bold text-xs">
                                    <span>Platform Infrastructure Cut (5%):</span>
                                    <span className="font-mono">- ₹{(payoutData.order.bid_amount * 0.05).toFixed(2)}</span>
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-700 my-2 pt-2 flex justify-between items-center text-base font-black text-emerald-600 dark:text-emerald-400">
                                    <span>Net Beneficiary Payable:</span>
                                    <span className="font-mono">₹{(payoutData.order.bid_amount * 0.95).toFixed(2)}</span>
                                </div>
                            </div>

                            {payoutData.bankDetails ? (
                                <div className="space-y-2">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Target Beneficiary Banking Routing Coordinates</h3>
                                    <div className="grid gap-2">
                                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl flex justify-between items-center border border-blue-100/40 dark:border-blue-900/30">
                                            <div><span className="block text-[9px] text-blue-600 font-black uppercase tracking-wider">Account Holder Matrix Name</span><span className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200">{payoutData.bankDetails.account_holder_name}</span></div>
                                            <button onClick={() => copyToClipboard(payoutData.bankDetails.account_holder_name)} className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900 rounded text-blue-500"><Copy size={13}/></button>
                                        </div>
                                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl flex justify-between items-center border border-blue-100/40 dark:border-blue-900/30">
                                            <div>
                                                <span className="block text-[9px] text-blue-600 font-black uppercase tracking-wider">Account Routing Parameter Link</span>
                                                <span className="font-mono text-xs font-bold tracking-widest text-gray-800 dark:text-gray-200">
                                                    ****{String(payoutData.bankDetails.account_number || '').slice(-4)}
                                                </span>
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded-md">MASKED ARRAY</span>
                                        </div>
                                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl flex justify-between items-center border border-blue-100/40 dark:border-blue-900/30">
                                            <div><span className="block text-[9px] text-blue-600 font-black uppercase tracking-wider">System IFSC Transit Routing Code</span><span className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200">{payoutData.bankDetails.ifsc_code}</span></div>
                                            <button onClick={() => copyToClipboard(payoutData.bankDetails.ifsc_code)} className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900 rounded text-blue-500"><Copy size={13}/></button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold text-center">
                                    ⚠️ Beneficiary routing tables unallocated. Establish structural manual communications array immediately.
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Record Unique Transaction Registry Code (UTR / Hash)</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. UPI839201928301" 
                                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 font-mono text-sm uppercase outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 font-bold transition-all"
                                    value={utrInput}
                                    onChange={(e) => setUtrInput(e.target.value)}
                                />
                                <p className="text-[9px] text-gray-400 font-medium leading-relaxed">Commit the verified bank structural transfer token here to execute atomic updates across platform ledgers.</p>
                            </div>
                        </>
                    )}
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-800 flex gap-3">
                    <button onClick={confirmManualPayout} disabled={!utrInput} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md">
                        Authorize Ledger State Commit
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
