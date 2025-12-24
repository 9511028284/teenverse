import React from 'react';
import { 
  Settings, Save, User, Shield, Briefcase, CreditCard, 
  Smartphone, Globe, Award, Hash, Building, Activity, Zap 
} from 'lucide-react'; 
import Button from '../ui/Button';

// Reusable "Gen Z" Input Field
const ModernInput = ({ label, icon: Icon, ...props }) => (
  <div className="group space-y-1.5">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-focus-within:text-indigo-500 transition-colors">
      {label}
    </label>
    <div className="relative transition-all duration-300 transform group-focus-within:-translate-y-1">
      {Icon && (
        <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
          <Icon size={16} />
        </div>
      )}
      <input 
        {...props}
        className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3.5 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm group-hover:border-gray-300 dark:group-hover:border-white/20`}
      />
    </div>
  </div>
);

const SettingsComp = ({ profileForm, setProfileForm, isClient, handleUpdateProfile, parentMode, setParentMode }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-10">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 mb-2">
            Control Center
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Manage your identity, visuals, and vault.</p>
        </div>
        
        {/* Save Button (Floating on Mobile, Fixed here on Desktop) */}
        <Button 
          onClick={handleUpdateProfile} 
          disabled={parentMode} 
          className="hidden md:flex bg-gray-900 dark:bg-white text-white dark:text-black hover:scale-105 active:scale-95 transition-transform shadow-xl shadow-indigo-500/20"
          icon={Save}
        >
          Save Changes
        </Button>
      </div>

      {/* --- BENTO GRID LAYOUT --- */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* 1. IDENTITY CARD (Span 8) */}
        <div className="col-span-12 md:col-span-8 bg-white dark:bg-[#1E293B] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-2xl shadow-gray-200/50 dark:shadow-black/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <User size={20} />
            </div>
            <h2 className="text-xl font-bold dark:text-white">Identity Matrix</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ModernInput 
              label="Display Name" 
              icon={User}
              value={profileForm.name || ""} 
              onChange={e => setProfileForm({...profileForm, name: e.target.value})} 
              placeholder="Your Name"
            />
            <ModernInput 
              label="Contact Uplink" 
              icon={Smartphone}
              value={profileForm.phone || ""} 
              onChange={e => setProfileForm({...profileForm, phone: e.target.value})} 
              placeholder="+91 00000 00000"
            />
            <ModernInput 
              label="Region / Nationality" 
              icon={Globe}
              value={profileForm.nationality || ""} 
              onChange={e => setProfileForm({...profileForm, nationality: e.target.value})} 
              placeholder="Earth, Sector 7"
            />
             {!isClient && (
              <ModernInput 
                label="Age (Years)" 
                icon={Activity}
                type="number"
                value={profileForm.age || ""} 
                onChange={e => setProfileForm({...profileForm, age: e.target.value})} 
              />
            )}
          </div>
        </div>

        {/* 2. MODE CONTROL (Span 4) - "Parent Mode" */}
        <div className={`col-span-12 md:col-span-4 p-6 rounded-[2rem] border transition-all duration-500 relative overflow-hidden flex flex-col justify-between ${parentMode 
            ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/30' 
            : 'bg-white dark:bg-[#1E293B] border-gray-100 dark:border-white/5'
          }`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
            
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${parentMode ? 'bg-white/20' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'}`}>
                  <Shield size={24} />
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${parentMode ? 'bg-white text-amber-600' : 'bg-gray-100 dark:bg-white/10 text-gray-500'}`}>
                  {parentMode ? 'ACTIVE' : 'OFFLINE'}
                </div>
              </div>
              <h3 className={`text-2xl font-black mb-1 ${parentMode ? 'text-white' : 'text-gray-900 dark:text-white'}`}>Parent Shield</h3>
              <p className={`text-xs font-medium ${parentMode ? 'text-amber-100' : 'text-gray-500 dark:text-gray-400'}`}>
                Restricts payments & sensitive actions for safety.
              </p>
            </div>

            <button 
              onClick={() => setParentMode(!parentMode)}
              className={`w-full py-4 mt-6 rounded-xl font-bold text-sm tracking-wide transition-transform active:scale-95 ${
                parentMode 
                  ? 'bg-white text-amber-600 shadow-xl' 
                  : 'bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800'
              }`}
            >
              {parentMode ? "DEACTIVATE SHIELD" : "ACTIVATE SHIELD"}
            </button>
        </div>

        {/* 3. FREELANCER STATS (Span 12 -> 6 on desktop) */}
        {!isClient && (
          <div className="col-span-12 md:col-span-6 bg-white dark:bg-[#1E293B] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-lg">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Briefcase size={20} />
                </div>
                <h2 className="text-xl font-bold dark:text-white">Professional Data</h2>
              </div>
              
              <div className="space-y-4">
                <ModernInput 
                  label="Qualification / Class" 
                  icon={Award}
                  value={profileForm.qualification || ""} 
                  onChange={e => setProfileForm({...profileForm, qualification: e.target.value})} 
                  placeholder="e.g. 12th Grade / B.Tech"
                />
                <ModernInput 
                  label="Core Specialty" 
                  icon={Zap}
                  value={profileForm.specialty || ""} 
                  onChange={e => setProfileForm({...profileForm, specialty: e.target.value})} 
                  placeholder="e.g. React Developer"
                />
                <ModernInput 
                  label="Services Offered (Tags)" 
                  icon={Hash}
                  value={profileForm.services || ""} 
                  onChange={e => setProfileForm({...profileForm, services: e.target.value})} 
                  placeholder="Web, Design, API..."
                />
              </div>
          </div>
        )}

        {/* 4. BANKING VAULT (Span 12 -> 6 on desktop) */}
        {!isClient && (
          <div className="col-span-12 md:col-span-6 relative group">
            {/* Card Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-black dark:to-[#0F172A] rounded-[2rem] transform transition-transform duration-300 group-hover:scale-[1.02] shadow-2xl"></div>
            
            {/* Content */}
            <div className="relative p-6 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6">
                <div>
                   <h2 className="text-xl font-bold text-white flex items-center gap-2">
                     <CreditCard className="text-indigo-400"/> Payout Vault
                   </h2>
                   <p className="text-xs text-gray-400 mt-1">Encrypted banking details.</p>
                </div>
                <div className="w-12 h-8 rounded-md bg-white/10 border border-white/20 flex items-center justify-center">
                   <div className="w-6 h-6 rounded-full bg-orange-500/80"></div>
                   <div className="w-6 h-6 rounded-full bg-yellow-500/80 -ml-3"></div>
                </div>
              </div>

              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Bank Name</label>
                      <input 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:bg-white/10 outline-none transition-colors"
                        placeholder="HDFC"
                        value={profileForm.bank_name || ""} 
                        onChange={e => setProfileForm({...profileForm, bank_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">IFSC Code</label>
                      <input 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:bg-white/10 outline-none transition-colors uppercase"
                        placeholder="HDFC000..."
                        value={profileForm.ifsc_code || ""} 
                        onChange={e => setProfileForm({...profileForm, ifsc_code: e.target.value.toUpperCase()})}
                      />
                    </div>
                 </div>
                 
                 <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Account Number</label>
                    <input 
                        type="text" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white font-mono tracking-widest text-lg focus:bg-white/10 outline-none transition-colors"
                        placeholder="0000 0000 0000 0000"
                        value={profileForm.account_number || ""} 
                        onChange={e => setProfileForm({...profileForm, account_number: e.target.value})}
                    />
                 </div>

                 <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">UPI ID (Optional)</label>
                    <input 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:bg-white/10 outline-none transition-colors"
                        placeholder="user@upi"
                        value={profileForm.upi || ""} 
                        onChange={e => setProfileForm({...profileForm, upi: e.target.value})}
                    />
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE SAVE BUTTON (Visible only on small screens) */}
      <div className="md:hidden fixed bottom-6 left-0 right-0 px-6 z-40">
        <Button 
          onClick={handleUpdateProfile} 
          disabled={parentMode} 
          className="w-full py-4 shadow-2xl shadow-indigo-600/30 bg-indigo-600 text-white rounded-2xl"
          icon={Save}
        >
          Save Updates
        </Button>
      </div>
      
    </div>
  );
};

export default SettingsComp;