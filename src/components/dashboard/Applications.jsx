import React from 'react';
import Button from '../ui/Button';

const Applications = ({ applications, isClient, updateStatus, initiatePayment, parentMode }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-bold dark:text-white">{isClient ? 'Received Applications' : 'My Applications'}</h2>
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="p-4 whitespace-nowrap">{isClient ? 'Freelancer' : 'Client'}</th>
                <th className="p-4 whitespace-nowrap">Job ID</th>
                <th className="p-4 whitespace-nowrap">Cover Letter</th>
                <th className="p-4 whitespace-nowrap">Bid</th>
                <th className="p-4 whitespace-nowrap">Status</th>
                <th className="p-4 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {applications.map(app => (
                <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-4 font-medium dark:text-white whitespace-nowrap">{isClient ? app.freelancer_name : app.client_id}</td>
                  <td className="p-4 text-xs font-mono text-gray-500 whitespace-nowrap">#{String(app.job_id).slice(0,6)}</td>
                  <td className="p-4 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">{app.cover_letter}</td>
                  <td className="p-4 font-bold text-gray-900 dark:text-white whitespace-nowrap">₹{app.bid_amount}</td>
                  <td className="p-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      app.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                      app.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>{app.status}</span>
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    {isClient && app.status === 'Pending' && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => updateStatus(app.id, 'Accepted', app.freelancer_id)} className="bg-emerald-500 hover:bg-emerald-600">Accept</Button>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(app.id, 'Rejected', app.freelancer_id)} className="text-red-500 border-red-200 hover:bg-red-50">Reject</Button>
                      </div>
                    )}
                    {isClient && app.status === 'Accepted' && !parentMode && (
                      <Button size="sm" onClick={() => initiatePayment(app.id, app.bid_amount, app.freelancer_id)}>Pay Now</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {applications.length === 0 && <div className="p-8 text-center text-gray-400">No records found.</div>}
      </div>
    </div>
  );
};

export default Applications;