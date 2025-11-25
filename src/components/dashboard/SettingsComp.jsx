import React from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react'; // Alias icon
import Button from '../ui/Button';
import Input from '../ui/Input';

const SettingsComp = ({ profileForm, setProfileForm, isClient, handleUpdateProfile, parentMode, setParentMode }) => {
  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-[#1E293B] p-6 md:p-8 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-lg animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white"><SettingsIcon/> Settings</h2>
      <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl mb-6">
        <div><h3 className="font-bold text-amber-900 dark:text-amber-100">Parent Mode</h3><p className="text-xs text-amber-700 dark:text-amber-400">Read-only view for safety.</p></div>
        <button onClick={() => setParentMode(!parentMode)} className={`px-4 py-2 rounded-lg font-bold text-xs transition-colors ${parentMode ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{parentMode ? "Active" : "Inactive"}</button>
      </div>
      <form onSubmit={handleUpdateProfile} className="space-y-5">
        <Input label="Full Name" value={profileForm.name || ""} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Phone" value={profileForm.phone || ""} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
          <Input label="Nationality" value={profileForm.nationality || ""} onChange={e => setProfileForm({...profileForm, nationality: e.target.value})} />
        </div>
        {!isClient && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Age" value={profileForm.age || ""} onChange={e => setProfileForm({...profileForm, age: e.target.value})} />
              <Input label="Qualification" value={profileForm.qualification || ""} onChange={e => setProfileForm({...profileForm, qualification: e.target.value})} />
            </div>
            <Input label="Specialty" value={profileForm.specialty || ""} onChange={e => setProfileForm({...profileForm, specialty: e.target.value})} />
            <Input label="Services Offered" value={profileForm.services || ""} onChange={e => setProfileForm({...profileForm, services: e.target.value})} />
            <Input label="UPI ID" value={profileForm.upi || ""} onChange={e => setProfileForm({...profileForm, upi: e.target.value})} />
          </>
        )}
        <div className="pt-4"><Button className="w-full" icon={Save} disabled={parentMode}>Save Changes</Button></div>
      </form>
    </div>
  );
};

export default SettingsComp;