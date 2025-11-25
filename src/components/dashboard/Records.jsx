import React from 'react';
import { ShieldCheck } from 'lucide-react';

const Records = ({ applications }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800 flex flex-col sm:flex-row items-start gap-4">
        <ShieldCheck className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" size={24}/>
        <div>
          <h3 className="font-bold text-blue-900 dark:text-blue-300 text-lg">Safety Records</h3>
          <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">Permanent record of all contracts for safety compliance.</p>
        </div>
      </div>
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="p-4 whitespace-nowrap">Job ID</th>
                <th className="p-4 whitespace-nowrap">Date</th>
                <th className="p-4 whitespace-nowrap">Status</th>
                <th className="p-4 whitespace-nowrap">Amount</th>
                <th className="p-4 whitespace-nowrap text-right">Record</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {applications.map(app => (
                <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-4 text-xs font-mono dark:text-gray-300 whitespace-nowrap">#{String(app.job_id || "").slice(0,8)}</td>
                  <td className="p-4 text-sm dark:text-gray-300 whitespace-nowrap">{new Date(app.created_at).toLocaleDateString()}</td>
                  <td className="p-4 whitespace-nowrap"><span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs font-bold">{app.status}</span></td>
                  <td className="p-4 font-bold dark:text-white whitespace-nowrap">₹{app.bid_amount}</td>
                  <td className="p-4 text-right whitespace-nowrap"><button className="text-xs text-indigo-600 font-bold hover:underline">Download PDF</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Records;