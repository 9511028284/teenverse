import React, { useState } from 'react';
import { 
  UploadCloud, User, Baby, ArrowLeft, CreditCard
} from 'lucide-react';
import Modal from '../ui/Modal'; 
import Button from '../ui/Button'; 

const KycVerificationModal = ({ user, kycFile, setKycFile, handleKycSubmit, onClose }) => {
  const [step, setStep] = useState(1);
  const [ageGroup, setAgeGroup] = useState(null); // 'minor' | 'adult'
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    setStep(3);
  };

  // ✅ FIX: No 'e.preventDefault()' needed because we won't use a <form> for Step 3
  const finalSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Pass DATA ONLY to the dashboard function
    await handleKycSubmit({ 
        ageGroup, 
        bankDetails: bankForm 
    });
    
    setIsSubmitting(false);
  };

  return (
    <Modal title="Verification & Payouts" onClose={onClose}>
      <div className="space-y-6">
        
        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3].map(s => (
             <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-indigo-600' : 'bg-gray-100 dark:bg-white/10'}`}></div>
          ))}
        </div>

        {/* STEP 1: AGE SELECTION */}
        {step === 1 && (
          <div className="animate-fade-in py-2">
            <h3 className="text-center text-xl font-black text-gray-900 dark:text-white mb-6">Select your status</h3>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleStep1('minor')} className="p-6 rounded-[2rem] border-2 border-gray-100 hover:border-indigo-500 bg-white dark:bg-white/5 text-center transition-all hover:shadow-lg">
                <div className="w-16 h-16 mx-auto bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4"><Baby size={32} /></div>
                <h4 className="font-bold text-lg dark:text-white">Under 18</h4>
                <p className="text-xs text-gray-500 mt-2">I am a minor.<br/>(Guardian Banking)</p>
              </button>

              <button onClick={() => handleStep1('adult')} className="p-6 rounded-[2rem] border-2 border-gray-100 hover:border-emerald-500 bg-white dark:bg-white/5 text-center transition-all hover:shadow-lg">
                <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-4"><User size={32} /></div>
                <h4 className="font-bold text-lg dark:text-white">18 or Older</h4>
                <p className="text-xs text-gray-500 mt-2">I am an adult.<br/>(Personal Banking)</p>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: BANKING DETAILS (Keep Form here for "Enter" key support) */}
        {step === 2 && (
          <form onSubmit={handleBankSubmit} className="animate-fade-in space-y-4">
             <div className="flex items-center gap-2 mb-2">
                <button type="button" onClick={() => setStep(1)} className="p-2 rounded-full hover:bg-gray-100"><ArrowLeft size={18}/></button>
                <h3 className="text-lg font-bold dark:text-white">{ageGroup === 'minor' ? "Guardian's Bank Details" : "Your Bank Details"}</h3>
             </div>

             <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border space-y-4">
                {ageGroup === 'minor' && (
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="text-[10px] font-bold text-gray-400 uppercase">Guardian Name</label>
                       <input required className="w-full p-3 rounded-xl text-sm border" value={bankForm.guardian_name} onChange={e => setBankForm({...bankForm, guardian_name: e.target.value})} />
                     </div>
                     <div>
                       <label className="text-[10px] font-bold text-gray-400 uppercase">Relation</label>
                       <select className="w-full p-3 rounded-xl text-sm border" value={bankForm.guardian_relationship} onChange={e => setBankForm({...bankForm, guardian_relationship: e.target.value})}>
                         <option>Parent</option><option>Legal Guardian</option><option>Sibling (18+)</option>
                       </select>
                     </div>
                  </div>
                )}
                
                <div>
                   <label className="text-[10px] font-bold text-gray-400 uppercase">Account Holder</label>
                   <input required className="w-full p-3 rounded-xl text-sm border" value={bankForm.account_holder_name} onChange={e => setBankForm({...bankForm, account_holder_name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="text-[10px] font-bold text-gray-400 uppercase">Bank Name</label>
                     <input required className="w-full p-3 rounded-xl text-sm border" value={bankForm.bank_name} onChange={e => setBankForm({...bankForm, bank_name: e.target.value})} />
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-gray-400 uppercase">IFSC Code</label>
                     <input required className="w-full p-3 rounded-xl text-sm uppercase border" value={bankForm.ifsc_code} onChange={e => setBankForm({...bankForm, ifsc_code: e.target.value.toUpperCase()})} />
                   </div>
                </div>
                <div>
                   <label className="text-[10px] font-bold text-gray-400 uppercase">Account Number</label>
                   <div className="relative">
                     <CreditCard size={16} className="absolute left-3 top-3.5 text-gray-400"/>
                     <input required type="password" className="w-full pl-10 pr-3 py-3 rounded-xl text-sm font-mono border" value={bankForm.account_number} onChange={e => setBankForm({...bankForm, account_number: e.target.value})} />
                   </div>
                </div>
             </div>

             {ageGroup === 'minor' && (
               <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <input type="checkbox" required id="consent" checked={bankForm.consent} onChange={e => setBankForm({...bankForm, consent: e.target.checked})} />
                  <label htmlFor="consent" className="text-xs text-amber-800 font-medium">I confirm parent/guardian authorization.</label>
               </div>
             )}
             <Button className="w-full py-3">Next: Upload Proof</Button>
          </form>
        )}

        {/* STEP 3: DOCUMENT UPLOAD */}
        {/* ✅ FIXED: Removed <form> tag to prevent accidental page refreshes on file select */}
        {step === 3 && (
          <div className="animate-fade-in">
             <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setStep(2)} className="p-2 rounded-full hover:bg-gray-100"><ArrowLeft size={18}/></button>
                <div className={`p-2 rounded-lg text-xs font-bold ${ageGroup === 'minor' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                   {ageGroup === 'minor' ? 'Student ID Required' : 'Government ID Required'}
               </div>
             </div>

             <div className="space-y-4">
               {/* File Input Label */}
               <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-[1.5rem] cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud size={24} className="text-gray-400 mb-2"/>
                    <p className="text-sm font-bold text-gray-500">{kycFile ? kycFile.name : "Tap to upload document"}</p>
                    <p className="text-xs text-gray-400 mt-1">MAX 5MB • JPG/PDF</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => setKycFile(e.target.files[0])} 
                    onClick={(e) => e.stopPropagation()} // Stop bubbling just in case
                    accept="image/*,application/pdf" 
                  />
               </label>
               
               {/* Manual Submit Button */}
               <Button 
                  onClick={finalSubmit} 
                  disabled={isSubmitting}
                  className="w-full py-4 text-lg"
               >
                 {isSubmitting ? "Submitting..." : "Submit Verification"}
               </Button>
             </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default KycVerificationModal;