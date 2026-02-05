import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Briefcase, CheckCircle, XCircle, 
  Trash2, DollarSign, LogOut, Shield, Flag, Package,
  Clock, AlertTriangle, ShieldCheck, Landmark, Eye, MessageSquare, 
  Activity, Copy, CreditCard 
} from 'lucide-react';
import { supabase } from '../supabase'; 
import * as api from '../services/dashboard.api'; 
import Toast from '../components/ui/Toast'; 

// LOGGER HELPER
const logAction = async (actor, action, details) => {
    try {
        await supabase.from('admin_audit_logs').insert({ 
            admin_id: (await supabase.auth.getUser()).data.user?.id,
            action_type: action,
            metadata: details 
        });
    } catch (e) { console.error("Log failed", e); }
};

const AdminDashboard = ({ onLogout }) => {
  // --- STATE ---
  const [tab, setTab] = useState('overview');
  const [reportFilter, setReportFilter] = useState('pending');
  
  // Data States
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [services, setServices] = useState([]);
  const [reports, setReports] = useState([]);
  const [escrowOrders, setEscrowOrders] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]); 
  
  // PAGINATION STATES
  const [page, setPage] = useState(0);          
  const [totalPages, setTotalPages] = useState(0);
  const [logsPage, setLogsPage] = useState(0);  
  const [totalLogsPages, setTotalLogsPages] = useState(0);
  const ITEMS_PER_PAGE = 20;

  const [stats, setStats] = useState({ 
    totalUsers: 0, totalJobs: 0, totalServices: 0, 
    totalRevenue: 0, activeReports: 0, heldInEscrow: 0,
    pendingKyc: 0 
  });
  
  // MODAL STATES
  const [selectedReport, setSelectedReport] = useState(null); 
  const [evidence, setEvidence] = useState(null); 
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  
  // 🆕 PAYOUT MODAL STATE
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutData, setPayoutData] = useState(null); // { order, bankDetails }
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [utrInput, setUtrInput] = useState('');

  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- MAIN EFFECT ROUTER ---
  useEffect(() => {
    if (tab !== 'users') setPage(0);
    if (tab !== 'logs') setLogsPage(0);
    loadTabData();
  }, [tab, reportFilter, page, logsPage]); 

  const loadTabData = async () => {
    if (tab === 'overview') await fetchOverviewData();
    else if (tab === 'users') await fetchUsersPaginated(page);
    else if (tab === 'jobs') await fetchJobs();
    else if (tab === 'services') await fetchServices();
    else if (tab === 'reports') await fetchReports();
    else if (tab === 'financials') await fetchFinancials();
    else if (tab === 'logs') await fetchLogsPaginated(logsPage);
  };

  // --- 1. OPTIMIZED OVERVIEW FETCH ---
  const fetchOverviewData = async () => {
    const [
        clientsCount, freelancersCount, jobsCount, servicesCount, 
        pendingReports, paymentsRes, escrowsRes, pendingKycRes
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
        ])
    ]);

    // 5% Platform Fee Calculation
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
        pendingKyc: totalPendingKyc
    });
  };

  // --- 2. PAGINATED USERS FETCH ---
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

  // --- 3. PAGINATED LOGS FETCH ---
  const fetchLogsPaginated = async (pageNumber) => {
    const from = pageNumber * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
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
    setAuditLogs(combined.slice(0, ITEMS_PER_PAGE));
    const maxCount = Math.max(adminLogs.count || 0, userLogs.count || 0, paymentLogs.count || 0);
    setTotalLogsPages(Math.ceil(maxCount / ITEMS_PER_PAGE));
  };
  
  // --- OTHER DATA FETCHERS ---
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

  // --- SECURE FILE VIEWING ---
  const handleViewId = async (pathOrUrl) => {
    if (!pathOrUrl) return;
    showToast("Generating secure link...", "info");
    if (pathOrUrl.startsWith('http')) {
        const match = pathOrUrl.split('/id_proofs/')[1];
        if (match) {
             const { data, error } = await supabase.storage.from('id_proofs').createSignedUrl(match, 60);
             if (error) { showToast("Error signing legacy URL", "error"); return; }
             await logAction('ADMIN', 'VIEW_ID_PROOF_LEGACY', { path: match });
             window.open(data.signedUrl, '_blank');
        } else {
             window.open(pathOrUrl, '_blank');
        }
    } else {
        const { data, error } = await supabase.storage.from('id_proofs').createSignedUrl(pathOrUrl, 60);
        if (error || !data) { 
            showToast("Could not access file. Check bucket permissions.", "error"); 
            return; 
        }
        await logAction('ADMIN', 'VIEW_ID_PROOF', { path: pathOrUrl });
        window.open(data.signedUrl, '_blank');
    }
  };

  // --- ACTION HANDLERS ---
  const handleKycAction = async (userId, role, status) => {
    const table = role === 'client' ? 'clients' : 'freelancers';
    let reason = null;
    if (status === 'rejected') {
        reason = prompt("Enter rejection reason:");
        if (!reason) return; 
    }
    if (!window.confirm(`Are you sure you want to mark this user as ${status.toUpperCase()}?`)) return;
    const { error } = await supabase.from(table).update({ 
        kyc_status: status, kyc_reviewed_at: new Date().toISOString(), kyc_rejection_reason: reason 
    }).eq('id', userId);
    if (error) showToast(`Error: ${error.message}`, 'error');
    else {
        showToast(`User KYC ${status.toUpperCase()}`, 'success');
        await logAction('ADMIN', `KYC_${status.toUpperCase()}`, { userId, role, reason });
        setUsers(users.map(u => u.id === userId ? { ...u, kyc_status: status } : u));
        if (status !== 'pending' && tab === 'users') setStats(prev => ({ ...prev, pendingKyc: Math.max(0, prev.pendingKyc - 1) }));
    }
  };

  const handleResolveReport = async (id, newStatus) => {
      const { error } = await supabase.from('reports').update({ status: newStatus }).eq('id', id);
      if(error) showToast("Error updating report", "error");
      else {
          showToast(`Report marked as ${newStatus}`);
          await logAction('ADMIN', 'RESOLVE_REPORT', { reportId: id, status: newStatus });
          if (selectedReport?.id === id) setSelectedReport(null);
          if (reportFilter !== newStatus) setReports(reports.filter(r => r.id !== id));
          if (reportFilter === 'pending' && newStatus !== 'pending') setStats(prev => ({...prev, activeReports: prev.activeReports - 1}));
      }
  };
  
  const handleBanUser = async (id, table) => {
    if(!window.confirm("⚠️ BAN USER: Are you sure?")) return;
    const { error } = await supabase.from(table).update({ status: 'banned' }).eq('id', id);
    if (error) showToast(error.message, 'error');
    else {
        showToast("User banned successfully");
        await logAction('ADMIN', 'BAN_USER', { targetId: id, table });
        if (selectedReport) handleResolveReport(selectedReport.id, 'resolved');
        else loadTabData();
    }
  };
  
  const handleDeleteJob = async (id) => {
       if(!window.confirm("Admin: Delete this job?")) return;
       const { error } = await supabase.from('jobs').delete().eq('id', id);
       if (error) showToast(error.message, 'error');
       else { 
         showToast("Job deleted"); 
         await logAction('ADMIN', 'DELETE_JOB', { jobId: id });
         loadTabData(); 
       }
  };

  const handleDeleteService = async (id) => {
       if(!window.confirm("Admin: Delete this gig?")) return;
       const { error } = await supabase.from('services').delete().eq('id', id);
       if (error) showToast(error.message, 'error');
       else { 
         showToast("Service deleted"); 
         await logAction('ADMIN', 'DELETE_SERVICE', { serviceId: id });
         loadTabData(); 
       }
  };

  // --- 🆕 PREPARE PAYOUT MODAL ---
  const initiatePayout = async (order) => {
    setPayoutLoading(true);
    setPayoutModalOpen(true);
    
    // 🛠️ FIX: Direct DB Query instead of API wrapper to avoid context errors
    // We check for user banking details in the 'user_banking' table
    try {
        const { data: bankData, error } = await supabase
            .from('user_banking')
            .select('*')
            .eq('user_id', order.freelancer_id)
            .maybeSingle(); // Use maybeSingle to avoid 0 row errors
        
        if (error) {
            console.error("Bank Fetch Error:", error);
            setPayoutData({ order, bankDetails: null });
            showToast("Error fetching bank details.", "error");
        } else if (!bankData) {
            setPayoutData({ order, bankDetails: null });
            showToast("Warning: No bank details found for this user.", "error");
        } else {
            setPayoutData({ order, bankDetails: bankData });
        }
    } catch (err) {
        console.error("Critical Bank Fetch Error:", err);
        setPayoutData({ order, bankDetails: null });
    }
    
    setPayoutLoading(false);
  };

  // --- 🆕 SUBMIT PAYOUT (Manual UTR) ---
  const confirmManualPayout = async () => {
    if (!utrInput) {
        showToast("Please enter the UTR/Transaction ID", "error");
        return;
    }
    if (!payoutData?.order) return;

    const { order } = payoutData;

    // Call API with UTR
    const { error } = await api.adminForceRelease(order.id, order.bid_amount, order.freelancer_id, utrInput);
    
    if(error) {
        showToast(error.message, 'error');
    } else { 
        showToast("Payout Recorded Successfully");
        await logAction('ADMIN', 'MANUAL_PAYOUT', { 
            appId: order.id, 
            amount: order.bid_amount,
            utr: utrInput 
        });
        
        // Close Modal & Refresh
        setPayoutModalOpen(false);
        setUtrInput('');
        setPayoutData(null);
        loadTabData(); 
    }
  };

  const handleForceRefund = async (app) => {
    if(!window.confirm(`⚠️ ADMIN OVERRIDE:\n\nForce refund ₹${app.bid_amount} to Client (${app.client_name})?`)) return;
    const { error } = await api.adminForceRefund(app.id, app.client_id);
    if(error) showToast(error.message, 'error');
    else { 
        showToast("Order Refunded Successfully"); 
        await logAction('ADMIN', 'FORCE_REFUND_FUNDS', { appId: app.id, amount: app.bid_amount });
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
    } catch (err) {
        console.error("Evidence Error:", err);
        showToast("Failed to load case context", "error");
    } finally {
        setEvidenceLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Copied!", "success");
  };

  const PaginationControls = ({ currentPage, totalPages, onPageChange }) => (
    <div className="flex justify-center gap-4 mt-6 items-center pb-8">
        <button disabled={currentPage === 0} onClick={() => onPageChange(Math.max(0, currentPage - 1))} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Previous</button>
        <span className="text-sm font-mono text-gray-500">Page {currentPage + 1} of {totalPages || 1}</span>
        <button disabled={currentPage >= totalPages - 1} onClick={() => onPageChange(currentPage + 1)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-indigo-700 transition-colors">Next</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col fixed h-full z-10">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 font-bold text-xl text-red-600">
          <Shield size={24} /> Admin Panel
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {['overview', 'financials', 'reports', 'users', 'jobs', 'services', 'logs'].map((t) => (
             <button key={t} onClick={() => setTab(t)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                {t === 'overview' && <LayoutDashboard size={18} />}
                {t === 'financials' && <Landmark size={18} />}
                {t === 'reports' && <Flag size={18} />}
                {t === 'users' && <Users size={18} />}
                {t === 'jobs' && <Briefcase size={18} />}
                {t === 'services' && <Package size={18} />}
                {t === 'logs' && <Activity size={18} />} 
                {t}
                {t === 'reports' && stats.activeReports > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{stats.activeReports}</span>}
                {t === 'financials' && stats.heldInEscrow > 0 && <span className="ml-auto bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full">₹</span>}
                {t === 'users' && stats.pendingKyc > 0 && <span className="ml-auto bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full">{stats.pendingKyc}</span>}
             </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><LogOut size={18} /> Logout</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 md:ml-64 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{tab}</h1>
        </header>

        {tab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
               <div className="flex justify-between mb-2"><h3 className="text-gray-500 font-bold text-xs uppercase">Revenue</h3><DollarSign className="text-emerald-500"/></div>
               <p className="text-3xl font-black">₹{stats.totalRevenue.toFixed(2)}</p>
            </div>
             <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
               <div className="flex justify-between mb-2"><h3 className="text-gray-500 font-bold text-xs uppercase">Held in Escrow</h3><Landmark className="text-blue-500"/></div>
               <p className="text-3xl font-black text-blue-600">₹{stats.heldInEscrow}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
               <div className="flex justify-between mb-2"><h3 className="text-gray-500 font-bold text-xs uppercase">Pending KYC</h3><ShieldCheck className="text-amber-500"/></div>
               <p className="text-3xl font-black text-amber-500">{stats.pendingKyc}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
               <div className="flex justify-between mb-2"><h3 className="text-gray-500 font-bold text-xs uppercase">Total Users</h3><Users className="text-purple-500"/></div>
               <p className="text-3xl font-black">{stats.totalUsers}</p>
            </div>
          </div>
        )}

        {tab === 'financials' && (
          <div className="space-y-6">
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-700 flex items-center gap-3">
                <AlertTriangle className="text-amber-600" size={24} />
                <div>
                    <h3 className="font-bold text-amber-800 dark:text-amber-200">Manual Payout Required</h3>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                        Funds are held in your Current Account. Manually transfer to Freelancer via Netbanking, then record UTR below.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 uppercase text-xs font-bold text-gray-500">
                        <tr>
                            <th className="p-4">Order ID</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Client vs Freelancer</th>
                            <th className="p-4">Stage</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {escrowOrders.map(order => (
                            <tr key={order.escrow_order_id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 ${order.status === 'Processing' ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                                <td className="p-4 font-mono text-xs text-gray-400">{(order.escrow_order_id || String(order.id)).split('-')[0]}...</td>
                                <td className="p-4 font-bold text-emerald-600 text-lg">₹{order.bid_amount}</td>
                                <td className="p-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded w-fit">Client: {order.client_name}</span>
                                        <span className="text-xs text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded w-fit">Teen: {order.freelancer_name}</span>
                                        <span className="text-[10px] text-gray-400 mt-1 italic">{order.jobs?.title}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                     <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                                        order.status === 'Disputed' ? 'bg-red-100 text-red-700' : 
                                        order.status === 'Paid' || order.status === 'Released' ? 'bg-green-100 text-green-700' :
                                        order.status === 'Processing' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                                        'bg-blue-100 text-blue-700'}`}>
                                        {order.status === 'Processing' ? '⚠️ Client Approved' : order.status}
                                     </span>
                                     {order.status === 'Processing' && (
                                         <div className="text-[10px] text-amber-600 font-bold mt-1">Action Required</div>
                                     )}
                                </td>
                                <td className="p-4 text-right">
                                     <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => initiatePayout(order)} 
                                            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ml-auto shadow-md ${
                                                order.status === 'Processing' 
                                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 ring-2 ring-emerald-400 ring-offset-1' 
                                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`} 
                                            title="Process Payout"
                                        >
                                            <CreditCard size={14}/> 
                                            {order.status === 'Processing' ? 'Approve Payout' : 'Force Pay'}
                                        </button>
                                        <button onClick={() => handleForceRefund(order)} className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1" title="Refund Client">
                                             <XCircle size={14}/>
                                        </button>
                                     </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {escrowOrders.length === 0 && <div className="p-10 text-center text-gray-400">No active funds held in escrow. System Clear.</div>}
            </div>
          </div>
        )}
        
        {/* ... Reports Tab, Users Tab, etc. (No changes needed, kept for context) ... */}
        {tab === 'reports' && (
            <div className="space-y-6">
                <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 w-fit">
                  {['pending', 'resolved', 'dismissed'].map((status) => (
                    <button key={status} onClick={() => setReportFilter(status)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${ reportFilter === status ? 'bg-red-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700' }`}>
                      {status}
                    </button>
                  ))}
                </div>

                {reports.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                        <CheckCircle size={48} className="mx-auto text-green-500 mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">All Clear!</h3>
                        <p className="text-gray-500">No {reportFilter} reports found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {reports.map(report => (
                            <div key={report.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                     <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${
                                            report.reason === 'Harassment/Bullying' ? 'bg-red-100 text-red-700' :
                                            report.reason === 'Spam/Scam' ? 'bg-orange-100 text-orange-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                            {report.reason}
                                        </span>
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Clock size={12} /> {new Date(report.created_at).toLocaleDateString()}
                                        </span>
                                     </div>
                                     {reportFilter === 'pending' && (
                                         <button onClick={() => openCaseFile(report)} className="text-xs flex items-center gap-1 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100 transition-colors">
                                              <Eye size={12} /> Review Evidence
                                         </button>
                                     )}
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 text-sm italic text-gray-600 dark:text-gray-300">
                                    "{report.details || 'No details provided'}"
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                                     <div><span className="font-bold uppercase block mb-1">Reporter</span><span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded select-all">{report.reporter_id.slice(0,8)}...</span></div>
                                     <div><span className="font-bold uppercase block mb-1">Reported</span><span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded select-all">{report.reported_user_id.slice(0,8)}...</span></div>
                                </div>
                                 {reportFilter === 'pending' && (
                                    <div className="flex gap-2 mt-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <button onClick={() => handleResolveReport(report.id, 'dismissed')} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2"><XCircle size={16}/> Dismiss</button>
                                        <button onClick={() => handleBanUser(report.reported_user_id, 'freelancers')} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"><Trash2 size={18}/> Ban User & Resolve</button>
                                    </div>
                                )}
                            </div>
                      ))}
                    </div>
                )}
            </div>
        )}

        {/* --- USERS TAB --- */}
        {tab === 'users' && (
          <div className="flex flex-col gap-4">
             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 text-sm">
                    <tr>
                      <th className="p-4">Name</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">KYC Status</th>
                      <th className="p-4">ID Proof</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="p-4 font-medium text-gray-900 dark:text-white">
                            {user.name}
                            <div className="text-xs text-gray-400">{user.email}</div>
                        </td>
                        <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.role === 'client' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{user.role}</span>
                        </td>
                        <td className="p-4">
                             <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                user.kyc_status === 'approved' ? 'bg-green-100 text-green-700' :
                                user.kyc_status === 'rejected' ? 'bg-red-100 text-red-700' :
                                user.kyc_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                'bg-gray-100 text-gray-500'
                            }`}>
                                {user.kyc_status || 'Not Started'}
                            </span>
                        </td>
                        <td className="p-4">
                          {user.id_proof_url ? 
                            <button onClick={() => handleViewId(user.id_proof_url)} className="text-indigo-600 hover:underline text-sm font-bold flex items-center gap-1">
                                 <Eye size={14}/> View ID
                            </button> : 
                            <span className="text-gray-400 text-sm">None</span>
                          }
                          </td>
                        <td className="p-4 text-right flex justify-end gap-2">
                          {user.kyc_status === 'pending' && (
                              <>
                                <button onClick={() => handleKycAction(user.id, user.role, 'approved')} className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors" title="Approve KYC">
                                    <CheckCircle size={18} />
                                </button>
                                <button onClick={() => handleKycAction(user.id, user.role, 'rejected')} className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors" title="Reject KYC">
                                    <XCircle size={18} />
                                </button>
                             </>
                          )}
                          <button onClick={() => handleBanUser(user.id, user.role === 'client' ? 'clients' : 'freelancers')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Ban User">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
             <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
        
        {(tab === 'jobs' || tab === 'services') && (
          <div className="grid gap-4">
             {(tab === 'jobs' ? jobs : services).map(item => (
              <div key={item.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{item.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {tab === 'jobs' ? `Posted by: ${item.client_name}` : `Freelancer: ${item.freelancer_name}`} • 
                    <span className="text-emerald-600 font-medium ml-1">
                        {tab === 'jobs' ? `Budget: ${item.budget}` : `Price: ₹${item.price}`}
                    </span>
                  </p>
                </div>
                <button onClick={() => tab === 'jobs' ? handleDeleteJob(item.id) : handleDeleteService(item.id)} className="w-full sm:w-auto px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors">
                  Delete {tab === 'jobs' ? 'Job' : 'Service'}
                </button>
              </div>
            ))}
             {(tab === 'jobs' ? jobs : services).length === 0 && (
                 <div className="p-8 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                     No {tab} found.
                 </div>
             )}
          </div>
        )}

        {/* LOGS WITH PAGINATION */}
        {tab === 'logs' && (
             <div className="flex flex-col gap-4">
                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-bold text-lg dark:text-white flex items-center gap-2"><Activity className="text-blue-500"/> System Audit Trail</h3>
                        <p className="text-xs text-gray-500">Immutable record of all admin, user, and financial actions.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="p-4">Timestamp</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">User/Actor</th>
                                    <th className="p-4">Action</th>
                                    <th className="p-4">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {auditLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                        <td className="p-4 text-gray-400 font-mono text-xs">{new Date(log.created_at).toLocaleString()}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                log.type === 'ADMIN' ? 'bg-red-100 text-red-600' :
                                                log.type === 'FINANCE' ? 'bg-green-100 text-green-600' :
                                                'bg-blue-100 text-blue-600'
                                            }`}>{log.type}</span>
                                        </td>
                                        <td className="p-4 font-bold text-gray-700 dark:text-gray-300">{log.user_id ? log.user_id.slice(0,8) : 'SYSTEM'}</td>
                                        <td className="p-4 font-medium">{log.action}</td>
                                        <td className="p-4 text-xs font-mono text-gray-500 max-w-xs truncate" title={JSON.stringify(log.details)}>{JSON.stringify(log.details)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {auditLogs.length === 0 && <div className="p-8 text-center text-gray-400">No logs found or logger not active.</div>}
                    </div>
                 </div>
                 <PaginationControls currentPage={logsPage} totalPages={totalLogsPages} onPageChange={setLogsPage} />
             </div>
        )}
      </main>

      {/* --- EVIDENCE MODAL OVERLAY --- */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <div>
                        <h2 className="font-bold text-xl dark:text-white flex items-center gap-2">
                           <Shield className="text-indigo-600" size={20}/> Case File #{selectedReport.id.slice(0,6)}
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">Review evidence before taking action.</p>
                    </div>
                    <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <XCircle className="text-gray-400" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    {evidenceLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                            <p className="text-sm">Gathering forensics...</p>
                        </div>
                    ) : (
                        <>
                            {evidence?.job && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                                    <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-2 flex items-center gap-2"><Briefcase size={14}/> Job Context</h4>
                                    <p className="font-bold text-lg dark:text-white">{evidence.job.title}</p>
                                    <div className="flex gap-4 mt-2 text-sm text-gray-600 dark:text-gray-300">
                                        <span>Budget: <strong>₹{evidence.job.budget}</strong></span>
                                        <span>Type: {evidence.job.job_type}</span>
                                    </div>
                                </div>
                            )}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2"><MessageSquare size={14}/> Recent Chat Logs</h4>
                                <div className="bg-gray-50 dark:bg-black/40 p-4 rounded-xl h-64 overflow-y-auto space-y-3 border border-gray-100 dark:border-gray-800">
                                    {evidence?.chats && evidence.chats.length > 0 ? (
                                        evidence.chats.map(msg => (
                                            <div key={msg.id} className={`flex flex-col ${msg.sender_id === selectedReport.reporter_id ? 'items-end' : 'items-start'}`}>
                                                <div className={`px-4 py-2 rounded-2xl text-sm max-w-[85%] ${
                                                    msg.sender_id === selectedReport.reporter_id 
                                                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-tl-none'
                                                }`}>
                                                    {msg.content}
                                                </div>
                                                <span className="text-[10px] text-gray-400 mt-1 px-1">
                                                    {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                            <MessageSquare size={32} className="mb-2"/>
                                            <p className="text-sm">No recent chat history found.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex gap-3">
                    <button onClick={() => handleResolveReport(selectedReport.id, 'dismissed')} className="flex-1 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Dismiss Report</button>
                    <button onClick={() => handleBanUser(selectedReport.reported_user_id, 'freelancers')} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"><Trash2 size={18}/> Ban User & Resolve</button>
                </div>
            </div>
        </div>
      )}

      {/* --- 🆕 PAYOUT MODAL --- */}
      {payoutModalOpen && payoutData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/20">
                    <h2 className="font-bold text-xl text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                        <DollarSign size={20}/> Manual Payout
                    </h2>
                    <button onClick={() => setPayoutModalOpen(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"><XCircle className="text-gray-400" /></button>
                </div>
                
                <div className="p-6 space-y-6">
                    {payoutLoading ? (
                        <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div><p className="mt-2 text-gray-500">Fetching bank details...</p></div>
                    ) : (
                        <>
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Order Summary</h3>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-gray-600 dark:text-gray-300">Total Bid:</span>
                                    <span className="font-mono font-bold">₹{payoutData.order.bid_amount}</span>
                                </div>
                                <div className="flex justify-between items-center mb-1 text-red-500">
                                    <span>Platform Fee (5%):</span>
                                    <span className="font-mono font-bold">- ₹{(payoutData.order.bid_amount * 0.05).toFixed(2)}</span>
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-600 my-2 pt-2 flex justify-between items-center text-lg font-black text-emerald-600">
                                    <span>Net Payable:</span>
                                    <span>₹{(payoutData.order.bid_amount * 0.95).toFixed(2)}</span>
                                </div>
                            </div>

                            {payoutData.bankDetails ? (
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase">Beneficiary Details</h3>
                                    <div className="grid gap-3">
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex justify-between items-center">
                                            <div><span className="block text-xs text-blue-600 font-bold">Account Holder</span><span className="font-mono text-sm">{payoutData.bankDetails.account_holder_name}</span></div>
                                            <button onClick={() => copyToClipboard(payoutData.bankDetails.account_holder_name)} className="p-2 hover:bg-blue-100 rounded text-blue-500"><Copy size={14}/></button>
                                        </div>
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex justify-between items-center">
                                            <div><span className="block text-xs text-blue-600 font-bold">Account Number</span><span className="font-mono text-sm tracking-widest">{payoutData.bankDetails.account_number}</span></div>
                                            <button onClick={() => copyToClipboard(payoutData.bankDetails.account_number)} className="p-2 hover:bg-blue-100 rounded text-blue-500"><Copy size={14}/></button>
                                        </div>
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex justify-between items-center">
                                            <div><span className="block text-xs text-blue-600 font-bold">IFSC Code</span><span className="font-mono text-sm">{payoutData.bankDetails.ifsc_code}</span></div>
                                            <button onClick={() => copyToClipboard(payoutData.bankDetails.ifsc_code)} className="p-2 hover:bg-blue-100 rounded text-blue-500"><Copy size={14}/></button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm text-center">
                                    ⚠️ No banking details found for this user. You must contact them manually.
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Record Transaction ID (UTR)</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. UPI1234567890" 
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 font-mono"
                                    value={utrInput}
                                    onChange={(e) => setUtrInput(e.target.value)}
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Paste the reference ID from your bank app here to mark this order as complete.</p>
                            </div>
                        </>
                    )}
                </div>
                
                <div className="p-6 bg-gray-50 dark:bg-gray-800 flex gap-3">
                    <button onClick={confirmManualPayout} disabled={!utrInput} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:shadow-none transition-all">
                        Confirm Transfer
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;