import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ShieldCheck, DollarSign, MessageSquare, LogOut, AlertTriangle, Eye 
} from 'lucide-react';
import { supabase } from '../supabase';
import Button from '../components/ui/Button';

const ParentDashboard = ({ user, onLogout }) => {
  const [teen, setTeen] = useState(null);
  const [stats, setStats] = useState({ earnings: 0, activeJobs: 0, messages: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    const fetchTeenData = async () => {
      setLoading(true);
      try {
        // 1. Find the teen linked to this parent (using the link established in App.jsx)
        const { data: teenData, error } = await supabase
          .from('freelancers')
          .select('*')
          .eq('parent_user_id', user.id)
          .maybeSingle();

        if (teenData) {
          setTeen(teenData);

          // 2. Fetch Stats for that teen
          const { data: apps } = await supabase
            .from('applications')
            .select('*')
            .eq('freelancer_id', teenData.id);

          const earnings = apps?.reduce((acc, curr) => curr.status === 'Paid' ? acc + parseFloat(curr.bid_amount) : acc, 0) || 0;
          const activeJobs = apps?.filter(a => a.status === 'Accepted').length || 0;

          // 3. Fetch Safety Logs (Messages)
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .or(`sender_id.eq.${teenData.id},receiver_id.eq.${teenData.id}`);

          setStats({ earnings, activeJobs, messages: count || 0 });
          setRecentActivity(apps || []);
        }
      } catch (err) {
        console.error("Parent fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeenData();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 font-bold text-xl text-indigo-600">
          <ShieldCheck size={24} /> Parent View
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${tab === 'overview' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <LayoutDashboard size={18} /> Overview
          </button>
          <button onClick={() => setTab('safety')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${tab === 'safety' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <Eye size={18} /> Safety Monitor
          </button>
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" className="w-full justify-start text-red-500" icon={LogOut} onClick={onLogout}>Logout</Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
            Welcome, Guardian
          </h1>
          <p className="text-gray-500">Monitoring: <span className="font-bold text-indigo-600">{teen ? teen.name : "..."}</span></p>
        </header>

        {!teen && !loading && (
          <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 flex items-center gap-3">
            <AlertTriangle />
            <div>
              <strong>No Teen Account Linked.</strong>
              <p className="text-sm">Ensure you signed up with the same email ({user.email}) your teen used for verification.</p>
            </div>
          </div>
        )}

        {teen && tab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Total Earnings</p>
                  <h3 className="text-3xl font-black text-emerald-600">₹{stats.earnings}</h3>
               </div>
               <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Active Gigs</p>
                  <h3 className="text-3xl font-black text-indigo-600">{stats.activeJobs}</h3>
               </div>
               <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Safety Checks</p>
                  <h3 className="text-3xl font-black text-purple-600">{stats.messages}</h3>
                  <p className="text-xs text-gray-400 mt-1">Messages Monitored</p>
               </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 font-bold dark:text-white">Recent Contracts</div>
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Job ID</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {recentActivity.map(activity => (
                    <tr key={activity.id} className="text-sm text-gray-600 dark:text-gray-300">
                      <td className="p-4">{new Date(activity.created_at).toLocaleDateString()}</td>
                      <td className="p-4 font-mono">#{String(activity.job_id).slice(0,6)}</td>
                      <td className="p-4"><span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-bold text-xs">{activity.status}</span></td>
                      <td className="p-4 font-bold text-emerald-600">₹{activity.bid_amount}</td>
                    </tr>
                  ))}
                  {recentActivity.length === 0 && <tr><td colSpan="4" className="p-6 text-center text-gray-400">No activity recorded yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {teen && tab === 'safety' && (
           <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 text-center">
              <ShieldCheck size={48} className="mx-auto text-green-500 mb-4"/>
              <h2 className="text-xl font-bold dark:text-white mb-2">Safety Monitoring is Active</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                You can request a full transcript of your teen's chat logs if you suspect any safety issues. 
                Our AI system automatically flags suspicious keywords.
              </p>
              <Button variant="outline">Request Chat Transcript</Button>
           </div>
        )}
      </main>
    </div>
  );
};

export default ParentDashboard;