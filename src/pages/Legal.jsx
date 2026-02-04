import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  FileText,
  Shield,
  Lock,
  DollarSign,
  UserCheck,
  Scale,
  Briefcase,
  Gavel,
  CheckCircle
} from "lucide-react";

const Legal = ({ onBack, page = "terms" }) => {
  const [activeDoc, setActiveDoc] = useState(page);

  useEffect(() => {
    if (page) setActiveDoc(page);
  }, [page]);

  const documents = {
    terms: {
      title: "Terms of Service",
      icon: <FileText size={20} />,
      content: (
        <div className="space-y-6 text-gray-600 dark:text-gray-300 leading-relaxed">
          <p className="text-sm font-mono text-gray-400">Effective Date: January 1, 2026</p>
          <p>
            Welcome to <strong>TeenVerseHub</strong>. By accessing or using our platform, you ("User") agree to be bound by these Terms. 
            If you are under 18, you represent that you have obtained parental consent to use this platform.
          </p>

          <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-6">1. Intermediary Status</h4>
          <p>
            TeenVerseHub operates solely as a technology intermediary connecting Freelancers and Clients. 
            We are <strong>not</strong> an employer, recruiting agency, or contracting agent. 
            We do not control, supervise, or guarantee the quality of work delivered by Freelancers.
          </p>
          <p className="text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border-l-4 border-gray-400">
            <strong>Note:</strong> TeenVerseHub does not determine pricing, scope, or delivery of services between Clients and Freelancers.
          </p>

          <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-6">2. Eligibility & Account Security</h4>
          <ul className="list-disc ml-5 space-y-2">
            <li><strong>Age Requirement:</strong> You must be at least 14 years old. Users aged 14–17 ("Teen Freelancers") must operate under the supervision of a verified parent or legal guardian.</li>
            <li><strong>Account Responsibility:</strong> You are responsible for all activity under your account. TeenVerseHub is not liable for loss caused by unauthorized use of your account.</li>
          </ul>

          <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-6">3. Prohibited Activities</h4>
          <p>You agree NOT to:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Circumvent our payment system (e.g., sharing phone numbers/UPI to pay offline).</li>
            <li>Post illegal, abusive, or sexually explicit content.</li>
            <li>Use the platform for academic dishonesty (e.g., doing homework for others).</li>
          </ul>
          <p className="mt-2 text-red-500 font-medium">Violation results in immediate permanent ban and forfeiture of funds.</p>
        </div>
      )
    },

    verification: {
      title: "Identity & Verification",
      icon: <CheckCircle size={20} />,
      content: (
        <div className="space-y-6 text-gray-600 dark:text-gray-300 leading-relaxed">
           <p className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 text-blue-800 dark:text-blue-200 text-sm">
            <strong>Compliance Notice:</strong> This section outlines our strict protocols regarding identity verification and DigiLocker usage.
          </p>

          <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-6">1. DigiLocker Consent</h4>
          <p>
            By proceeding with verification, you explicitly consent to TeenVerseHub
            requesting and accessing your government-issued documents (such as PAN
            or Aadhaar XML, where legally permitted) via DigiLocker, solely for the purpose of identity
            verification and regulatory compliance.
          </p>
          <p>
            Access to DigiLocker is initiated only by the user through an explicit
            verification request. TeenVerseHub does not access documents automatically
            or without user action.
          </p>
          <p>
            TeenVerseHub does not store your Aadhaar number or biometric information.
            Only document references and verification status are stored.
          </p>
          <p className="text-sm">
            Where DigiLocker is unavailable, TeenVerseHub may offer alternative lawful
            verification methods with equivalent consent protections.
          </p>

          <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-6">2. Minors and Guardian Verification</h4>
          <p>
            Users below the age of 18 are required to complete verification through
            their parent or legal guardian. TeenVerseHub does not access or verify
            government documents of minors directly. Only guardian documents are
            used for verification and payout eligibility.
          </p>

          <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-6">3. Purpose-Limited Use</h4>
          <p>
            Verification is performed only when required for financial actions such
            as payouts or paid engagements. TeenVerseHub does not perform identity
            verification at the time of signup.
          </p>

          <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-6">4. Data Retention & Audits</h4>
          <p>
            Verification records are retained only as long as required for legal,
            accounting, or regulatory purposes. Users may request deletion of their
            data where permitted by law.
          </p>
          <p>
            All verification access is logged with timestamps for audit and compliance
            purposes.
          </p>

          <p className="text-xs text-gray-500 italic mt-4 border-t border-gray-200 dark:border-gray-800 pt-4">
            Verification confirms identity and eligibility for payouts and does not
            constitute endorsement, certification, or employment by TeenVerseHub.
          </p>
        </div>
      )
    },

    privacy: {
      title: "Privacy Policy",
      icon: <Lock size={20} />,
      content: (
        <div className="space-y-6 text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>TeenVerseHub respects your privacy. This policy outlines how we handle your data in compliance with the Digital Personal Data Protection Act, 2023 (India).</p>

          <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-6">1. Data Collection</h4>
          <ul className="list-disc ml-5 space-y-2">
            <li><strong>Personal Data:</strong> Name, Email, Phone, Date of Birth (for age verification).</li>
            <li><strong>KYC Data:</strong> Government-issued documents voluntarily shared by the user via DigiLocker are used for identity verification but strictly adhere to our Identity & Verification policy.</li>
            <li><strong>Financial Data:</strong> Bank account or UPI details for payouts.</li>
          </ul>

          <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-6">2. Data Usage & Minors</h4>
          <p>
            We strictly limit the visibility of Teen Freelancers' data. Clients only see: First Name, Skills, and Portfolio. 
            <strong>We strictly NEVER sell data to third-party advertisers.</strong>
          </p>

          <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-6">3. Data Retention</h4>
          <p>
            We retain account data for as long as the account is active. Upon deletion request, data is removed within 30 days, 
            except where retention is required by law (e.g., transaction logs for tax audits).
          </p>
        </div>
      )
    },

    fees: {
      title: "Fees & Payments",
      icon: <DollarSign size={20} />,
      content: (
        <div className="space-y-6 text-gray-600 dark:text-gray-300 leading-relaxed">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white">1. Service Fees</h4>
          <p>
            TeenVerseHub charges a flat <strong>5% Platform Fee</strong> on all successful transactions.
            The Platform Fee is a facilitation charge and is exclusive of any applicable taxes. 
            TeenVerseHub shall levy such taxes only if and when required under applicable law.
            All amounts displayed are exclusive of any taxes unless expressly stated otherwise.
          </p>
          <p className="text-xs text-gray-500 italic">
             TeenVerseHub’s revenue is limited strictly to its platform facilitation fee.
          </p>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border-l-4 border-indigo-500 my-4">
            <p className="font-mono text-sm">Example: Project Cost ₹1,000</p>
            <p className="font-mono text-sm">TeenVerse Fee (5%): -₹50</p>
            <p className="font-mono text-sm font-bold">Freelancer Receives: ₹950</p>
          </div>

          <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-6">2. Settlement Policy</h4>
          <p>
            Funds are held with the payment gateway in accordance with applicable payment settlement mechanisms until the release conditions are met. 
            If a Client does not respond within 7 days of submission, funds are <strong>automatically released</strong> to the Freelancer.
          </p>

          <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-6">3. Tax Liability (TDS)</h4>
          <p>
            Freelancers are solely responsible for reporting their income and paying applicable taxes.
            TeenVerseHub does not deduct TDS at present. TeenVerseHub does not act as an e-commerce operator for the purpose of tax collection at source unless mandated under applicable law.
          </p>

          <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-6">4. GST Status</h4>
          <p>
             TeenVerseHub is currently not registered under the Goods and Services Tax (GST) Act.
             If registration becomes mandatory in the future, this policy will be updated accordingly.
          </p>
        </div>
      )
    },

    disputes: {
      title: "Dispute Resolution",
      icon: <Gavel size={20} />,
      content: (
        <div className="space-y-6 text-gray-600 dark:text-gray-300 leading-relaxed">
          <p>
            In the event of a disagreement between Client and Freelancer, TeenVerseHub encourages mutual resolution. If that fails, our <strong>Arbitration Team</strong> steps in.
          </p>

          <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-6">1. Arbitration Process</h4>
          <ol className="list-decimal ml-5 space-y-2">
            <li>User raises a Dispute ticket via the Dashboard.</li>
            <li>Funds are frozen immediately pending review.</li>
            <li>Both parties submit evidence (chat logs, file deliverables).</li>
            <li>TeenVerseHub Admin reviews evidence and issues a binding decision within 72 hours.</li>
          </ol>
          <p className="text-xs text-gray-400 mt-2">
            Any arbitration shall be conducted in accordance with the Arbitration and Conciliation Act, 1996.
          </p>

          <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-6">2. Refund Eligibility</h4>
          <ul className="list-disc ml-5 space-y-1">
            <li><strong>Full Refund:</strong> If Freelancer delivered nothing or missed a strict deadline.</li>
            <li><strong>Partial Refund:</strong> If work was delivered but incomplete/low quality.</li>
            <li><strong>No Refund:</strong> If Client changes their mind after work has already been completed according to specs.</li>
          </ul>
        </div>
      )
    },

    parent_agreement: {
      title: "Parent/Guardian Agreement",
      icon: <UserCheck size={20} />,
      content: (
        <div className="space-y-6 text-gray-600 dark:text-gray-300 leading-relaxed">
          <p className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 text-amber-800 dark:text-amber-200 text-sm">
            <strong>Critical:</strong> By approving your teen's account, you legally bind yourself to these terms.
          </p>

          <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-6">1. Financial Responsibility</h4>
          <p>
            As the Guardian, you acknowledge that the financial account linked for withdrawals legally belongs to you or is authorized by you.
            You are responsible for any tax implications of earnings generated by your teen.
          </p>

          <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-6">2. Supervision</h4>
          <p>
            While TeenVerseHub employs safety filters, you agree to supervise your teen’s online interactions.
            TeenVerseHub is not liable for interactions that occur off-platform.
          </p>

          <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-6">3. Right to Revoke</h4>
          <p>
            You retain the absolute right to revoke your consent at any time.
            Upon revocation, we will freeze the teen's account 
            and process any pending payouts to your bank account before deletion.
          </p>
        </div>
      )
    },

    ip_rights: {
      title: "Intellectual Property (IP)",
      icon: <Briefcase size={20} />,
      content: (
        <div className="space-y-6 text-gray-600 dark:text-gray-300 leading-relaxed">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white">1. Ownership Transfer</h4>
          <p>
            Unless otherwise agreed in writing:
            <br/>
            - <strong>Before Payment:</strong> The Freelancer retains full copyright and ownership of all work.
            <br/>
            - <strong>After Payment:</strong> Upon successful release of funds, full ownership and IP rights transfer exclusively to the Client.
          </p>

          <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-6">2. Portfolio Rights</h4>
          <p>
            Freelancers retain a non-exclusive license to display the completed work in their TeenVerseHub portfolio for self-promotion purposes only, 
            unless a Non-Disclosure Agreement (NDA) was signed.
          </p>
        </div>
      )
    }
  };

  const current = documents[activeDoc] || documents.terms;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col md:flex-row transition-colors font-sans">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-80 bg-white dark:bg-gray-900 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 sticky top-0 flex flex-col h-auto md:h-screen z-10">
        
        {/* Header / Back */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-black/20">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 font-bold transition-colors">
            <ArrowLeft size={20} /> Back
          </button>
          <span className="md:hidden font-bold text-gray-900 dark:text-white">Legal Center</span>
        </div>

        {/* Menu Items */}
        <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto p-2 md:p-4 space-x-2 md:space-y-2 scrollbar-hide">
          <h2 className="hidden md:block px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            Documents
          </h2>

          {Object.keys(documents).map((key) => (
            <button
              key={key}
              onClick={() => setActiveDoc(key)}
              className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${
                  activeDoc === key
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 bg-white md:bg-transparent"
                }`}
            >
              {documents[key].icon} 
              <span>{documents[key].title}</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="hidden md:block p-6 border-t border-gray-200 dark:border-gray-800 mt-auto bg-gray-50 dark:bg-black/20">
          <div className="flex items-center gap-2 text-green-600 text-xs font-bold">
            <Shield size={14} /> Legally Binding
          </div>
          <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
            TeenVerseHub<br/>
            (Proprietorship – India)
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto">
          
          {/* Document Header */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200 dark:border-gray-800">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              {current.icon}
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                {current.title}
              </h1>
              <p className="text-sm text-gray-500 mt-1">Official Policy • TeenVerseHub</p>
            </div>
          </div>

          {/* Document Body */}
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm leading-7">
            {current.content}
          </div>

          {/* Legal Disclaimer Footer */}
          <div className="mt-8 p-6 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-xs flex gap-4 items-start">
            <Scale size={24} className="shrink-0 text-gray-400"/>
            <p>
              <strong>Legal Disclaimer:</strong> The information provided on this page constitutes a binding agreement between you and TeenVerseHub.
              However, summaries and examples are for convenience only. In case of any discrepancy, the formal legal text prevails.
              Disputes are subject to the exclusive jurisdiction of the courts in New Delhi, India.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Legal;