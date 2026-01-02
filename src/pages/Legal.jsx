import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  FileText,
  Shield,
  Lock,
  AlertTriangle,
  Users,
  FileCheck,
  DollarSign,
  UserCheck,
  Scale,
  BookOpen,
  Briefcase
} from "lucide-react";

const Legal = ({ onBack, page = "terms" }) => {
  const [activeDoc, setActiveDoc] = useState(page);

  useEffect(() => {
    if (page) setActiveDoc(page);
  }, [page]);

  const documents = {
    terms: {
      title: "Terms & Conditions",
      icon: <FileText size={20} />,
      content: (
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <p><strong>Last Updated: November 2025</strong></p>
          <p>Welcome to TeenVerse. By using our services, you agree to these Terms and Conditions.</p>

          <h4 className="font-bold mt-4">Nature of Service</h4>
          <p>TeenVerse is a platform connecting teenage freelancers with clients. We do not employ users.</p>

          <h4 className="font-bold mt-4">Eligibility</h4>
          <ul className="list-disc ml-5 space-y-1">
           
            <li>Age 14–17 requires parental consent</li>
            <li>Under 14 are not allowed to work</li>
          </ul>

          <h4 className="font-bold mt-4">Account Termination</h4>
          <p>We may suspend accounts for safety concerns or rule violations.</p>
        </div>
      )
    },

    privacy: {
      title: "Privacy Policy",
      icon: <Lock size={20} />,
      content: (
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <p>Your privacy is very important to us.</p>

          <h4 className="font-bold mt-4">Data We Collect</h4>
          <ul className="list-disc ml-5">
            <li>Identity data (encrypted)</li>
            <li>Contact data (email + parent email)</li>
            <li>Financial data (UPI only)</li>
          </ul>

          <h4 className="font-bold mt-4">Data Usage</h4>
          <p>We never sell any minor’s data. Data is used for safety, verification, and communication.</p>

          <h4 className="font-bold mt-4">Parental Rights</h4>
          <p>
            Parents may request data access via  
            <a href="mailto:legal@teenverse.com" className="text-indigo-600"> legal@teenverse.com</a>.
          </p>
        </div>
      )
    },

    refund: {
      title: "Refund & Cancellation",
      icon: <DollarSign size={20} />,
      content: (
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <h4 className="font-bold">Cancellation</h4>
          <ul className="list-disc ml-5">
            <li>Clients can cancel before work starts (minus fees).</li>
            <li>Freelancers may cancel; repeated cancellations affect ratings.</li>
          </ul>

          <h4 className="font-bold mt-4">Refunds</h4>
          <p>Refunds are granted when work does not match the agreed scope. Platform fee is non-refundable.</p>
        </div>
      )
    },

    fees: {
      title: "Platform Fee Policy",
      icon: <Scale size={20} />,
      content: (
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <p>TeenVerse charges a 4% fee per transaction.</p>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl text-center font-bold">
            Standard Fee: 4%
          </div>

          <p>Example: ₹1000 job → freelancer receives ₹960.</p>
        </div>
      )
    },

    seller: {
      title: "Seller Agreement (Teens)",
      icon: <Briefcase size={20} />,
      content: (
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <p>Teen freelancers agree to:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Deliver work professionally</li>
            <li>Maintain respectful communication</li>
            <li>Not share personal contact info</li>
            <li>Report suspicious behavior</li>
            <li>Understand they are independent contractors</li>
          </ul>
        </div>
      )
    },

    client: {
      title: "Client Agreement",
      icon: <Users size={20} />,
      content: (
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <p>Clients working with minors agree to:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Be respectful</li>
            <li>Give clear instructions</li>
            <li>Never ask for personal meetings</li>
            <li>Pay promptly</li>
            <li>Understand legal limitations of contracts with minors</li>
          </ul>
        </div>
      )
    },

    minor_safety: {
      title: "Minor Safety Policy",
      icon: <Shield size={20} />,
      content: (
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <p>Safety is our top priority.</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>AI chat monitoring for harmful content</li>
            <li>Zero tolerance for harassment or grooming</li>
            <li>Limited visibility of teen identity</li>
          </ul>
        </div>
      )
    },

    parent_consent: {
      title: "Parent Consent Policy",
      icon: <FileCheck size={20} />,
      content: (
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <p>Users aged 14–17 require parental consent.</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Parents become legal financial account holders</li>
            <li>Parents can co-pilot the account</li>
            <li>Required for verification</li>
          </ul>
        </div>
      )
    },

    kyc: {
      title: "KYC & Verification",
      icon: <UserCheck size={20} />,
      content: (
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <p>We require ID verification for fraud prevention.</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Aadhaar, Passport, or School ID</li>
            <li>Parent ID for withdrawals</li>
            <li>UPI ID must match verified name</li>
          </ul>
        </div>
      )
    },

    community: {
      title: "Community Guidelines",
      icon: <BookOpen size={20} />,
      content: (
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <p>Help us keep TeenVerse safe:</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border rounded-xl">
              <h5 className="font-bold text-green-600">Do’s</h5>
              <ul className="list-disc ml-4">
                <li>Be kind</li>
                <li>Submit original work</li>
                <li>Meet deadlines</li>
              </ul>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/20 border rounded-xl">
              <h5 className="font-bold text-red-600">Don'ts</h5>
              <ul className="list-disc ml-4">
                <li>No bullying</li>
                <li>No contact info sharing</li>
                <li>No academic cheating</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }
  };

  const current = documents[activeDoc] || documents.terms;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col md:flex-row transition-colors">
      
      {/* Sidebar */}
      <div className="w-full md:w-72 bg-white dark:bg-gray-900 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 sticky top-0 flex flex-col">
        
        {/* Back */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600">
            <ArrowLeft size={20} /> Back
          </button>
          <span className="md:hidden font-bold text-gray-900 dark:text-white">Legal Center</span>
        </div>

        {/* Sidebar Items */}
        <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto p-2 md:p-4 space-x-2 md:space-y-1 scrollbar-hide">
          <h2 className="hidden md:block px-4 py-2 text-xs font-bold text-gray-400 uppercase">
            Legal Documents
          </h2>

          {Object.keys(documents).map((key) => (
            <button
              key={key}
              onClick={() => setActiveDoc(key)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 md:py-3 rounded-full md:rounded-xl text-sm font-medium
                ${
                  activeDoc === key
                    ? "bg-indigo-600 text-white md:bg-indigo-50 md:text-indigo-700 dark:md:bg-indigo-900/30"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 bg-white md:bg-transparent"
                }`}
            >
              {documents[key].icon} {documents[key].title}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="hidden md:block p-6 border-t border-gray-200 dark:border-gray-800 mt-auto">
          <div className="flex items-center gap-2 text-green-600 text-xs font-bold">
            <Shield size={14} /> Official Docs
          </div>
          <p className="text-xs text-gray-400 mt-1">Updated: Nov 2025</p>
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 p-4 md:p-12 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          
          <div className="flex items-center gap-4 mb-6 md:mb-8">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl text-indigo-600">
              {current.icon}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {current.title}
            </h1>
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-800">
            {current.content}
          </div>

          <div className="mt-8 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm flex gap-3">
            <AlertTriangle size={20} />
            <p><strong>Disclaimer:</strong> These documents are informational. Consult a lawyer for exact legal advice.</p>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Legal;
