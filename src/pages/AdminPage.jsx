import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Briefcase, Package, Trash2, Search, LogOut, AlertTriangle, 
  CheckCircle, XCircle, LayoutDashboard, DollarSign
} from 'lucide-react';
import { supabase } from '../supabase';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Toast from '../components/ui/Toast';

const AdminDashboard = ({ user, onLogout }) => {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState({ users: 0, jobs: 0, services: 0, revenue: 0 });
  const [usersList, setUsersList] = useState([]);
  const [jobsList, setJobsList] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch All Users (Clients + Freelancers)
      const { data: clients } = await supabase.from('clients').select('*');
      const { data: freelancers } = await supabase.from('freelancers').select('*');
      
      const allUsers = [
        ...(clients || []).map(u => ({ ...u, role: 'client' })), 
        ...(freelancers || []).map(u => ({ ...u, role: 'freelancer' }))
      ];
      setUsersList(allUsers);

      // 2. Fetch All Jobs
      const { data: jobs } = await supabase.from('jobs').select('*');
      setJobsList(jobs || []);

      // 3. Fetch All Services
      const { data: services } = await supabase.from('services').select('*');
      setServicesList(services || []);

      // 4. Calculate Revenue (4% of all Paid applications)
      const { data: payments } = await supabase.from('applications').select('bid_amount').eq('status', 'Paid');
      const revenue = payments?.reduce((acc, curr) => acc + (Number(curr.bid_amount) * 0.04), 0) || 0;

      setStats({
        users: allUsers.length,
        jobs: jobs?.length || 0,
        services: services?.length || 0,
        revenue
      });

    } catch (error) {
      console.error("Admin Fetch Error:", error);
      showToast("Failed to load admin data", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- ADMIN ACTIONS ---

  const handleDeleteUser = async (userId, role) => {
    if(!window.confirm("WARNING: This will ban the user permanently. Continue?")) return;
    const table = role === 'client' ? 'clients' : 'freelancers';
    
    const { error } = await supabase.from(table).delete().eq('id', userId);
    if(error) showToast(error.message, 'error');
    else {
      showToast("User Banned/Deleted");
      setUsersList(usersList.filter(u => u.id !== userId));
    }
  };

  const handleDeleteJob = async (jobId) => {
    if(!window.confirm("Delete this job post?")) return;
    const { error } = await supabase.from('jobs').delete().eq('id', jobId);
    if(error) showToast(error.message, 'error');
    else {
      showToast("Job Deleted");
      setJobsList(jobsList.filter(j => j.id !== jobId));
    }
  };

  const handleDeleteService = async (serviceId) => {
    if(!window.confirm("Remove this service gig?")) return;
    const { error } = await supabase.from('services').delete().eq('id', serviceId);
    if(error) showToast(error.message, 'error');
    else {
      showToast("Service Removed");
      setServicesList(servicesList.filter(s => s.id !== serviceId));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex font-sans text-gray-900 dark:text-white">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 font-black text-xl text-red-600">
          <Shield size={24} /> Admin Panel
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${tab === 'overview' ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <LayoutDashboard size={18} /> Overview
          </button>
          <button onClick={() => setTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${tab === 'users' ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <Users size={18} /> Users Manager
          </button>
          <button onClick={() => setTab('jobs')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${tab === 'jobs' ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <Briefcase size={18} /> Jobs & Gigs
          </button>
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" className="w-full justify-start text-red-500 border-red-200 hover:bg-red-50" icon={LogOut} onClick={onLogout}>Logout Admin</Button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold capitalize">{tab}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> Live System
          </div>
        </header>

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4"><h3 className="text-gray-500 text-sm font-bold uppercase">Total Revenue</h3><DollarSign className="text-emerald-500"/></div>
              <p className="text-3xl font-black text-emerald-600">₹{stats.revenue.toFixed(2)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4"><h3 className="text-gray-500 text-sm font-bold uppercase">Total Users</h3><Users className="text-blue-500"/></div>
              <p className="text-3xl font-black">{stats.users}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4"><h3 className="text-gray-500 text-sm font-bold uppercase">Active Jobs</h3><Briefcase className="text-purple-500"/></div>
              <p className="text-3xl font-black">{stats.jobs}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4"><h3 className="text-gray-500 text-sm font-bold uppercase">Gigs Posted</h3><Package className="text-orange-500"/></div>
              <p className="text-3xl font-black">{stats.services}</p>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {tab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase text-gray-500 font-bold">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {usersList.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold">{u.name}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </td>
                    <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.role==='client' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{u.role}</span></td>
                    <td className="p-4 text-sm">{u.phone || "N/A"}</td>
                    <td className="p-4 text-sm"><span className="flex items-center gap-1 text-emerald-600 font-medium"><CheckCircle size={14}/> Active</span></td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDeleteUser(u.id, u.role)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={18}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* JOBS TAB */}
        {tab === 'jobs' && (
          <div className="space-y-6 animate-fade-in">
             <h2 className="text-xl font-bold">Active Job Posts</h2>
             <div className="grid gap-4">
                {jobsList.map(job => (
                  <div key={job.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                     <div>
                        <h3 className="font-bold text-lg">{job.title}</h3>
                        <p className="text-sm text-gray-500">Client: {job.client_name} • Budget: {job.budget}</p>
                     </div>
                     <button onClick={() => handleDeleteJob(job.id)} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors">Remove Job</button>
                  </div>
                ))}
             </div>

             <h2 className="text-xl font-bold mt-8">Freelancer Gigs (Services)</h2>
             <div className="grid gap-4">
                {servicesList.map(service => (
                  <div key={service.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                     <div>
                        <h3 className="font-bold text-lg">{service.title}</h3>
                        <p className="text-sm text-gray-500">Freelancer: {service.freelancer_name} • Price: {service.price}</p>
                     </div>
                     <button onClick={() => handleDeleteService(service.id)} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors">Remove Gig</button>
                  </div>
                ))}
             </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard