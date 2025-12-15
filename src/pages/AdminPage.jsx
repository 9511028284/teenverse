import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Briefcase, CheckCircle, XCircle, 
  Trash2, DollarSign, LogOut, Shield, Flag, Package,
  Clock, User, Filter, AlertTriangle // Added new icons
} from 'lucide-react';
import { supabase } from '../supabase';
import Toast from '../components/ui/Toast';

const AdminDashboard = ({ onLogout }) => {
  const [tab, setTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [services, setServices] = useState([]);
  const [reports, setReports] = useState([]); 
  
  // New State for Report Filtering
  const [reportFilter, setReportFilter] = useState('pending'); 

  const [stats, setStats] = useState({ totalUsers: 0, totalJobs: 0, totalServices: 0, totalRevenue: 0, activeReports: 0 });
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchData();
  }, [reportFilter]); // Refetch when filter changes

  const fetchData = async () => {
    // 1. Fetch Users
    const { data: clients } = await supabase.from('clients').select('*');
    const { data: freelancers } = await supabase.from('freelancers').select('*');
    const allUsers = [...(clients || []).map(u => ({...u, role: 'client'})), ...(freelancers || []).map(u => ({...u, role: 'freelancer'}))];
    setUsers(allUsers);

    // 2. Fetch Jobs
    const { data: allJobs } = await supabase.from('jobs').select('*');
    setJobs(allJobs || []);

    // 3. Fetch Services
    const { data: allServices } = await supabase.from('services').select('*');
    setServices(allServices || []);

    // 4. Fetch Reports (With Filter)
    const { data: allReports } = await supabase
        .from('reports')
        .select('*')
        .eq('status', reportFilter) // Apply filter
        .order('created_at', { ascending: false });
    setReports(allReports || []);

    // 5. Fetch Stats (Independent of filter)
    const { count: pendingCount } = await supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending');
    
    // Fetch Revenue
    const { data: payments } = await supabase.from('applications').select('bid_amount').eq('status', 'Paid');
    const totalRevenue = payments?.reduce((acc, curr) => acc + (Number(curr.bid_amount) * 0.04), 0) || 0;

    setStats({
      totalUsers: allUsers.length,
      totalJobs: allJobs?.length || 0,
      totalServices: allServices?.length || 0,
      totalRevenue,
      activeReports: pendingCount || 0
    });
  };

  const handleResolveReport = async (id, newStatus) => {
      const { error } = await supabase.from('reports').update({ status: newStatus }).eq('id', id);
      if(error) showToast("Error updating report", "error");
      else {
          showToast(`Report marked as ${newStatus}`);
          // Remove from current view if it no longer matches filter
          if (reportFilter !== newStatus) {
            setReports(reports.filter(r => r.id !== id));
          }
          // Update stats if we resolved a pending report
          if (reportFilter === 'pending' && newStatus !== 'pending') {
             setStats(prev => ({...prev, activeReports: prev.activeReports - 1}));
          }
      }
  };
  
  const handleBanUser = async (id, table) => {
    if(!window.confirm("Ban this user? This cannot be undone.")) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) showToast(error.message, 'error');
    else {
      showToast("User banned and deleted");
      fetchData();
    }
  };
  
  const handleDeleteJob = async (id) => {
       if(!window.confirm("Admin: Delete this job?")) return;
       const { error } = await supabase.from('jobs').delete().eq('id', id);
       if (error) showToast(error.message, 'error');
       else { showToast("Job deleted"); fetchData(); }
  };

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
      <aside className="hidden md:flex w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col fixed h-full z-10">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 font-bold text-xl text-red-600">
          <Shield size={24} /> Admin Panel
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {['overview', 'reports', 'users', 'jobs', 'services'].map((t) => (
             <button 
                key={t}
                onClick={() => setTab(t)} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
             >
                {t === 'overview' && <LayoutDashboard size={18} />}
                {t === 'reports' && <Flag size={18} />}
                {t === 'users' && <Users size={18} />}
                {t === 'jobs' && <Briefcase size={18} />}
                {t === 'services' && <Package size={18} />}
                {t} 
                {t === 'reports' && stats.activeReports > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{stats.activeReports}</span>}
             </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 md:ml-64 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{tab}</h1>
          {/* Mobile Menu Button could go here */}
        </header>

        {tab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
               <div className="flex justify-between mb-2"><h3 className="text-gray-500 font-bold text-xs uppercase">Revenue</h3><DollarSign className="text-emerald-500"/></div>
               <p className="text-3xl font-black">₹{stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
               <div className="flex justify-between mb-2"><h3 className="text-gray-500 font-bold text-xs uppercase">Active Disputes</h3><Flag className="text-red-500"/></div>
               <p className="text-3xl font-black text-red-600">{stats.activeReports}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
               <div className="flex justify-between mb-2"><h3 className="text-gray-500 font-bold text-xs uppercase">Total Users</h3><Users className="text-blue-500"/></div>
               <p className="text-3xl font-black">{stats.totalUsers}</p>
            </div>
             <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
               <div className="flex justify-between mb-2"><h3 className="text-gray-500 font-bold text-xs uppercase">Total Gigs</h3><Package className="text-purple-500"/></div>
               <p className="text-3xl font-black">{stats.totalServices}</p>
            </div>
          </div>
        )}
        
        {/* IMPROVED REPORTS TAB */}
        {tab === 'reports' && (
            <div className="space-y-6">
                {/* Filter Tabs */}
                <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 w-fit">
                  {['pending', 'resolved', 'dismissed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setReportFilter(status)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                        reportFilter === status 
                          ? 'bg-red-500 text-white shadow-md' 
                          : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                {/* Mobile Friendly Report Cards */}
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
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 text-sm italic text-gray-600 dark:text-gray-300">
                                    "{report.details || 'No details provided'}"
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                                    <div>
                                        <span className="font-bold uppercase block mb-1">Reporter ID</span>
                                        <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded select-all">{report.reporter_id.slice(0,8)}...</span>
                                    </div>
                                    <div>
                                        <span className="font-bold uppercase block mb-1">Reported User ID</span>
                                        <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded select-all">{report.reported_user_id.slice(0,8)}...</span>
                                    </div>
                                </div>

                                {reportFilter === 'pending' && (
                                    <div className="flex gap-2 mt-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <button 
                                            onClick={() => handleResolveReport(report.id, 'resolved')} 
                                            className="flex-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={16}/> Resolve
                                        </button>
                                        <button 
                                            onClick={() => handleResolveReport(report.id, 'dismissed')} 
                                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                                        >
                                            <XCircle size={16}/> Dismiss
                                        </button>
                                        <button 
                                            onClick={() => handleBanUser(report.reported_user_id, 'freelancers')} // Defaulting to freelancer table, you might need logic to check user role
                                            className="px-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                                            title="Ban User"
                                        >
                                            <Trash2 size={18}/>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {tab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
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
                    <td className="p-4 text-gray-500 dark:text-gray-400 text-sm">{user.email}</td>
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
        
        {/* Jobs & Services Tabs - Simple Cards */}
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
                <button 
                    onClick={() => tab === 'jobs' ? handleDeleteJob(item.id) : handleDeleteService(item.id)} 
                    className="w-full sm:w-auto px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors"
                >
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
      </main>
    </div>
  );
};

export default AdminDashboard;