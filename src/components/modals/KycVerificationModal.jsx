import React from 'react';
import { ShieldAlert, Lock, UploadCloud } from 'lucide-react';
import Modal from '../ui/Modal'; // Adjust import
import Button from '../ui/Button'; // Adjust import

const KycVerificationModal = ({ user, kycFile, setKycFile, handleKycSubmit, onClose }) => {
  return (
    <Modal title="Identity Verification" onClose={onClose}>
      <div className="space-y-6">
        {/* HEADER SECTION based on Status */}
        {user.kyc_status === 'rejected' ? (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800 flex gap-3 items-start">
            <ShieldAlert className="text-red-600 shrink-0" size={24} />
            <div>
              <h4 className="font-bold text-red-700 dark:text-red-400">Verification Rejected</h4>
              <p className="text-sm text-red-600/80 mt-1">Reason: {user.kyc_rejection_reason || "Document unclear"}</p>
              <p className="text-xs text-red-500 mt-2 font-bold">Please upload a clearer document.</p>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 flex gap-3 items-center">
            <Lock className="text-blue-600" size={24} />
            <div>
              <h4 className="font-bold text-blue-700 dark:text-blue-400">Security Check Required</h4>
              <p className="text-sm text-blue-600/80">To ensure safety, we need to verify your identity before you can process payments.</p>
            </div>
          </div>
        )}

        {/* UPLOAD FORM */}
        <form onSubmit={handleKycSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Upload Government ID / School ID</label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-8 h-8 mb-3 text-gray-400" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">{kycFile ? kycFile.name : "Click to upload"}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG or PDF (MAX. 800x400px)</p>
              </div>
              <input type="file" className="hidden" onChange={(e) => setKycFile(e.target.files[0])} accept="image/*,application/pdf" />
            </label>
          </div>

          <div className="flex items-start gap-2">
            <input type="checkbox" required id="kyc-consent" className="mt-1 rounded border-gray-300 text-indigo-600" />
            <label htmlFor="kyc-consent" className="text-xs text-gray-500 dark:text-gray-400">
              I confirm this document belongs to me. I understand that falsifying identity will result in a permanent ban.
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose} type="button">Cancel</Button>
            <Button className="flex-1">Submit for Review</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default KycVerificationModal;