import React, { useState } from 'react';
import { 
  ShieldAlert, Lock, UploadCloud, User, Baby, ArrowLeft, 
  CreditCard, CheckCircle, Building, Users 
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const KycVerificationModal = ({ user, kycFile, setKycFile, handleKycSubmit, onClose }) => {
  const [step, setStep] = useState(1);
  const [ageGroup, setAgeGroup] = useState(null); // 'minor' | 'adult'
  
  // Banking State
  const [bankForm, setBankForm] = useState({
    account_number: '',
    ifsc_code: '',
    bank_name: '',
    account_holder_name: '',
    guardian_name: '',
    guardian_relationship: 'Parent',
    consent: false
  });

  const handleStep1 = (group) => {
    setAgeGroup(group);
    setStep(2);
  };

  const handleBankSubmit = (e) => {
    e.preventDefault();
    if (ageGroup === 'minor' && !bankForm.consent) return;
    setStep(3); // Move to Upload Step
  };

  // Wrapper to pass all data to the Dashboard handler
  const finalSubmit = (e) => {
    e.preventDefault();
    handleKycSubmit(e, { ageGroup, bankDetails: bankForm });
  };

  return (
    <Modal title="Verification & Payouts" onClose={onClose}>
      <div className="space-y-6">
        
        {/* PROGRESS STEPPER */}
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3].map(s => (
             <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-indigo-600 shadow-lg shadow-indigo-500/30' : 'bg-gray-100 dark:bg-white/10'}`}></div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
           <span>Identify</span>
           <span>Banking</span>
           <span>Documents</span>
        </div>

        {/* STEP 1: AGE SELECTION */}
        {step === 1 && (
          <div className="animate-fade-in py-2">
            <h3 className="text-center text-xl font-black text-gray-900 dark:text-white mb-6">Select your status</h3>
            <div className="grid grid-cols-2 gap-4">
              
              <button onClick={() => handleStep1('minor')} className="group relative p-6 rounded-[2rem] border-2 border-gray-100 dark:border-white/10 hover:border-indigo-500 bg-white dark:bg-white/5 hover:shadow-xl hover:shadow-indigo-500/20 transition-all text-center">
                <div className="w-16 h-16 mx-auto bg-indigo-50 dark:bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                  <Baby size={32} />
                </div>
                <h4 className="font-bold text-lg text-gray-900 dark:text-white">Under 18</h4>
                <p className="text-xs text-gray-500 mt-2 font-medium">I am a minor.<br/>(Guardian Banking)</p>
              </button>

              <button onClick={() => handleStep1('adult')} className="group relative p-6 rounded-[2rem] border-2 border-gray-100 dark:border-white/10 hover:border-emerald-500 bg-white dark:bg-white/5 hover:shadow-xl hover:shadow-emerald-500/20 transition-all text-center">
                <div className="w-16 h-16 mx-auto bg-emerald-50 dark:bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                  <User size={32} />
                </div>
                <h4 className="font-bold text-lg text-gray-900 dark:text-white">18 or Older</h4>
                <p className="text-xs text-gray-500 mt-2 font-medium">I am an adult.<br/>(Personal Banking)</p>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: BANKING DETAILS */}
        {step === 2 && (
          <form onSubmit={handleBankSubmit} className="animate-fade-in space-y-4">
             <div className="flex items-center gap-2 mb-2">
                <button type="button" onClick={() => setStep(1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"><ArrowLeft size={18}/></button>
                <h3 className="text-lg font-bold dark:text-white">
                   {ageGroup === 'minor' ? "Guardian's Bank Details" : "Your Bank Details"}
                </h3>
             </div>

             <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5 space-y-4">
                {ageGroup === 'minor' && (
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Guardian Name</label>
                       <input required className="w-full p-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm" 
                         value={bankForm.guardian_name} onChange={e => setBankForm({...bankForm, guardian_name: e.target.value})} placeholder="Parent Name" />
                     </div>
                     <div>
                       <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Relation</label>
                       <select className="w-full p-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm"
                         value={bankForm.guardian_relationship} onChange={e => setBankForm({...bankForm, guardian_relationship: e.target.value})}>
                         <option>Parent</option><option>Legal Guardian</option><option>Sibling (18+)</option>
                       </select>
                     </div>
                  </div>
                )}

                <div>
                   <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Account Holder Name {ageGroup === 'minor' && "(Guardian)"}</label>
                   <input required className="w-full p-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm" 
                     value={bankForm.account_holder_name} onChange={e => setBankForm({...bankForm, account_holder_name: e.target.value})} placeholder="Name as on Passbook" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Bank Name</label>
                     <input required className="w-full p-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm" 
                       value={bankForm.bank_name} onChange={e => setBankForm({...bankForm, bank_name: e.target.value})} placeholder="HDFC, SBI..." />
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">IFSC Code</label>
                     <input required className="w-full p-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm uppercase" 
                       value={bankForm.ifsc_code} onChange={e => setBankForm({...bankForm, ifsc_code: e.target.value.toUpperCase()})} placeholder="SBIN000..." />
                   </div>
                </div>

                <div>
                   <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Account Number</label>
                   <div className="relative">
                     <CreditCard size={16} className="absolute left-3 top-3.5 text-gray-400"/>
                     <input required type="password" className="w-full pl-10 pr-3 py-3 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl text-sm font-mono tracking-widest" 
                       value={bankForm.account_number} onChange={e => setBankForm({...bankForm, account_number: e.target.value})} placeholder="0000000000" />
                   </div>
                </div>
             </div>

             {ageGroup === 'minor' && (
               <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
                  <input type="checkbox" required id="consent" className="mt-1" checked={bankForm.consent} onChange={e => setBankForm({...bankForm, consent: e.target.checked})} />
                  <label htmlFor="consent" className="text-xs text-amber-800 dark:text-amber-500 font-medium leading-relaxed">
                    I confirm that my parent/guardian authorizes this account for receiving payments on my behalf.
                  </label>
               </div>
             )}

             <Button className="w-full py-3">Next: Upload Proof</Button>
          </form>
        )}

        {/* STEP 3: DOCUMENT UPLOAD */}
        {step === 3 && (
          <div className="animate-fade-in">
             <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setStep(2)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"><ArrowLeft size={18}/></button>
                <div className={`p-2 rounded-lg text-xs font-bold ${ageGroup === 'minor' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                   {ageGroup === 'minor' ? 'Student ID Required' : 'Government ID Required'}
                </div>
             </div>

             <form onSubmit={finalSubmit} className="space-y-4">
               <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-[1.5rem] cursor-pointer bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 transition-transform group-hover:-translate-y-1">
                    <div className={`p-4 rounded-full mb-3 ${ageGroup === 'minor' ? 'bg-amber-100 text-amber-500' : 'bg-blue-100 text-blue-500'}`}>
                       <UploadCloud size={24} />
                    </div>
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
                      {kycFile ? kycFile.name : "Tap to upload document"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">MAX 5MB • JPG/PDF</p>
                  </div>
                  <input type="file" className="hidden" onChange={(e) => setKycFile(e.target.files[0])} accept="image/*,application/pdf" required />
               </label>
               
               <div className="text-xs text-center text-gray-400 px-4">
                  By submitting, you agree to our Terms of Service. Your data is encrypted.
               </div>

               <Button className="w-full py-4 shadow-xl shadow-indigo-500/20 text-lg">
                 Submit Verification
               </Button>
             </form>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default KycVerificationModal;