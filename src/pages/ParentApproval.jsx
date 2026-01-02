import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../supabase';
import Button from '../components/ui/Button';

const ParentApproval = ({ token, onApprovalComplete }) => {
  const [status, setStatus] = useState('loading'); // loading, valid, error, success
  const [requestData, setRequestData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (token) verifyToken();
  }, [token]);

  const verifyToken = async () => {
    const { data, error } = await supabase
      .from('parent_approvals')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !data || data.status !== 'pending') {
      setStatus('error');
    } else {
      setRequestData(data);
      setStatus('valid');
    }
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      // 1. Update Approval Status in DB
      await supabase.from('parent_approvals').update({ status: 'approved' }).eq('id', requestData.id);

      // 2. In a real app, this is where you'd call a Cloud Function to create the user.
      // For this frontend-only demo, we just mark it approved.
      // The teen will have to come back and sign up again, and your logic could check this table to see "Oh, this email is pre-approved".
      
      setStatus('success');
    } catch (err) {
      alert("Error approving account.");
    }
    setIsProcessing(false);
  };

  if (status === 'loading') return <div className="p-10 text-center">Verifying security token...</div>;
  
  if (status === 'error') return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
        <XCircle size={48} className="text-red-500 mx-auto mb-4"/>
        <h2 className="text-xl font-bold text-gray-900">Invalid or Expired Link</h2>
        <p className="text-gray-500 mt-2">This approval link has already been used or is invalid.</p>
      </div>
    </div>
  );

  if (status === 'success') return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
        <CheckCircle size={48} className="text-green-500 mx-auto mb-4"/>
        <h2 className="text-xl font-bold text-gray-900">Permission Granted</h2>
        <p className="text-gray-500 mt-2">You have successfully approved <strong>{requestData.teen_data.name}</strong>.</p>
        <p className="text-sm text-gray-400 mt-4">Please tell them they can now create their account.</p>
        <Button className="mt-6 w-full" onClick={onApprovalComplete}>Go to Home</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="bg-indigo-600 p-6 text-white text-center">
          <ShieldCheck size={40} className="mx-auto mb-2 opacity-90"/>
          <h1 className="text-2xl font-bold">Parental Consent Required</h1>
          <p className="opacity-90 text-sm">TeenVerse Safety Protocol</p>
        </div>
        
        <div className="p-8 space-y-6">
           <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 items-start">
              <AlertTriangle className="text-blue-600 flex-shrink-0 mt-1" size={20}/>
              <div className="text-sm text-blue-800">
                <strong>Action Required:</strong> Your teen, <span className="font-bold">{requestData.teen_data.name}</span>, wants to join TeenVerse as a freelancer.
              </div>
           </div>

           <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
              <h3 className="font-bold text-gray-900 text-lg">Legal Responsibility</h3>
              <p>By approving this account, you acknowledge that:</p>
              <ul className="list-disc ml-5 space-y-2">
                 <li>You are the legal guardian of the applicant.</li>
                 <li>You authorize them to enter into freelance contracts.</li>
                 <li>You accept responsibility for financial transactions made via this account.</li>
              </ul>
           </div>

           <div className="border-t border-gray-100 pt-6">
              <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                 <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                 <span className="text-sm font-bold text-gray-700">I verify that I am an adult (18+) and the legal guardian.</span>
              </label>
           </div>

           <div className="flex gap-4">
              <Button variant="outline" className="flex-1" onClick={() => alert("Account Rejected.")}>Deny Request</Button>
              <Button className="flex-1" onClick={handleApprove} disabled={isProcessing}>
                 {isProcessing ? "Verifying..." : "Grant Permission"}
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ParentApproval;