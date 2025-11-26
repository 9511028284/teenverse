import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Briefcase, AlertTriangle, CheckCircle, XCircle, 
  Search, Trash2, DollarSign, LogOut, Shield, Flag, Package // Added Package icon for Services
} from 'lucide-react';
import { supabase } from '../supabase';
import Button from '../components/ui/Button';
import Toast from '../components/ui/Toast';

const AdminDashboard = ({ onLogout }) => {
  const [tab, setTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [services, setServices] = useState([]); // NEW: Services State
  const [reports, setReports] = useState([]); 
  const [stats, setStats] = useState({ totalUsers: 0, totalJobs: 0, totalServices: 0, totalRevenue: 0, activeReports: 0 });
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch Users
    const { data: clients } = await supabase.from('clients').select('*');
    const { data: freelancers } = await supabase.from('freelancers').select('*');
    const allUsers = [...(clients || []).map(u => ({...u, role: 'client'})), ...(freelancers || []).map(u => ({...u, role: 'freelancer'}))];
    setUsers(allUsers);

    // Fetch Jobs
    const { data: allJobs } = await supabase.from('jobs').select('*');
    setJobs(allJobs || []);

    // Fetch Services (NEW)
    const { data: allServices } = await supabase.from('services').select('*');
    setServices(allServices || []);

    // Fetch Reports
    const { data: allReports } = await supabase.from('reports').select('*').eq('status', 'pending');
    setReports(allReports || []);

    // Fetch Revenue
    const { data: payments } = await supabase.from('applications').select('bid_amount').eq('status', 'Paid');
    const totalRevenue = payments?.reduce((acc, curr) => acc + (Number(curr.bid_amount) * 0.04), 0) || 0;

    setStats({
      totalUsers: allUsers.length,
      totalJobs: allJobs?.length || 0,
      totalServices: allServices?.length || 0, // Added services count
      totalRevenue,
      activeReports: allReports?.length || 0
    });
  };

  const handleResolveReport = async (id) => {
      const { error } = await supabase.from('reports').update({ status: 'resolved' }).eq('id', id);
      if(error) showToast("Error", "error");
      else {
          showToast("Report Resolved");
          setReports(reports.filter(r => r.id !== id));
          setStats(prev => ({...prev, activeReports: prev.activeReports - 1}));
      }
  };
  
  const handleBanUser = async (id, table) => {
    if(!window.confirm("Ban this user?")) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) showToast(error.message, 'error');
    else {
      showToast("User banned/deleted");
      fetchData();
    }
  };
  
  const handleDeleteJob = async (id) => {
       if(!window.confirm("Admin: Delete this job?")) return;
       const { error } = await supabase.from('jobs').delete().eq('id', id);
       if (error) showToast(error.message, 'error');
       else { showToast("Job deleted"); fetchData(); }
  };

  // NEW: Delete Service
  const handleDeleteService = async (id) => {
       if(!window.confirm("Admin: Delete this gig?")) return;
       const { error } = await supabase.from('services').delete().eq('id', id);
       if (error) showToast(error.message, 'error');
       else { showToast("Service deleted"); fetchData(); }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 font-bold text-xl text-red-600">
          <Shield size={24} /> Admin Panel
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${tab === 'overview' ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <LayoutDashboard size={18} /> Overview
          </button>
          <button onClick={() => setTab('reports')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${tab === 'reports' ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <Flag size={18} /> Reports {stats.activeReports > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{stats.activeReports}</span>}
          </button>
          <button onClick={() => setTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${tab === 'users' ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <Users size={18} /> Users
          </button>
          <button onClick={() => setTab('jobs')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${tab === 'jobs' ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <Briefcase size={18} /> Jobs
          </button>
          {/* NEW SERVICES TAB BUTTON */}
          <button onClick={() => setTab('services')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${tab === 'services' ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <Package size={18} /> Services
          </button>
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{tab}</h1>
        </header>

        {tab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Stats Cards */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
               <div className="flex justify-between mb-2"><h3 className="text-gray-500 font-bold text-xs uppercase">Revenue</h3><DollarSign className="text-emerald-500"/></div>
               <p className="text-3xl font-black">₹{stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
               <div className="flex justify-between mb-2"><h3 className="text-gray-500 font-bold text-xs uppercase">Pending Reports</h3><Flag className="text-red-500"/></div>
               <p className="text-3xl font-black text-red-600">{stats.activeReports}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
               <div className="flex justify-between mb-2"><h3 className="text-gray-500 font-bold text-xs uppercase">Total Users</h3><Users className="text-blue-500"/></div>
               <p className="text-3xl font-black">{stats.totalUsers}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
               <div className="flex justify-between mb-2"><h3 className="text-gray-500 font-bold text-xs uppercase">Gigs</h3><Package className="text-purple-500"/></div>
               <p className="text-3xl font-black">{stats.totalServices}</p>
            </div>
          </div>
        )}
        
        {tab === 'reports' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs uppercase font-bold">
                    <tr>
                      <th className="p-4">Reported ID</th>
                      <th className="p-4">Reason</th>
                      <th className="p-4">Details</th>
                      <th className="p-4">Date</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {reports.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-500">No pending reports.</td></tr>}
                    {reports.map(report => (
                      <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="p-4 font-mono text-xs">{report.reported_user_id}</td>
                        <td className="p-4 font-bold text-red-600">{report.reason}</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{report.details || "No details"}</td>
                        <td className="p-4 text-xs text-gray-400">{new Date(report.created_at).toLocaleDateString()}</td>
                        <td className="p-4 text-right flex justify-end gap-2">
                           <button onClick={() => handleResolveReport(report.id)} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">Resolve</button>
                           <button onClick={() => handleBanUser(report.reported_user_id, 'freelancers')} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">Ban User</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
        )}

        {tab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 text-sm">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">ID Proof</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="p-4 font-medium text-gray-900 dark:text-white">{user.name}</td>
                    <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.role === 'client' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{user.role}</span></td>
                    <td className="p-4 text-gray-500 dark:text-gray-400">{user.email}</td>
                    <td className="p-4">
                      {user.id_proof_url ? 
                        <a href={user.id_proof_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-sm">View ID</a> : 
                        <span className="text-gray-400 text-sm">None</span>
                      }
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleBanUser(user.id, user.role === 'client' ? 'clients' : 'freelancers')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {tab === 'jobs' && (
          <div className="grid gap-4">
            {jobs.map(job => (
              <div key={job.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{job.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Posted by: {job.client_name} • Budget: {job.budget}</p>
                </div>
                <button onClick={() => handleDeleteJob(job.id)} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors">
                  Delete Job
                </button>
              </div>
            ))}
          </div>
        )}

        {/* NEW SERVICES TAB */}
        {tab === 'services' && (
          <div className="grid gap-4">
            {services.map(service => (
              <div key={service.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{service.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Freelancer: {service.freelancer_name} • Price: ₹{service.price}</p>
                </div>
                <button onClick={() => handleDeleteService(service.id)} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors">
                  Delete Service
                </button>
              </div>
            ))}
             {services.length === 0 && <div className="p-8 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">No services found.</div>}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;