import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Shield } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy' | null;
}

export function LegalModal({ isOpen, onClose, type }: LegalModalProps) {
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isTerms = type === 'terms';
  const title = isTerms ? 'Terms of Service' : 'Privacy Policy';
  const icon = isTerms ? FileText : Shield;

  // Terms content (abbreviated version for modal - full version available at /terms)
  const termsContent = (
    <div className="space-y-6 text-slate-600 dark:text-slate-400">
      <p className="text-sm text-slate-500 dark:text-slate-500">
        Last updated: March 27, 2026
      </p>

      <section>
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">1. Acceptance of Terms</h3>
        <p>
          By accessing or using LandlordBot (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
          If you disagree with any part of the terms, you may not access the Service.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">2. Description of Service</h3>
        <p>
          LandlordBot is an AI-powered property management platform designed to help landlords manage
          rental units, communicate with tenants, and automate property management tasks.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">3. User Accounts</h3>
        <p>
          You must provide accurate and complete information when creating an account. You are responsible
          for safeguarding the password and for all activities that occur under your account.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">4. Subscription and Payment</h3>
        <p>
          Some features require a paid subscription. Payments are processed securely through Stripe.
          You may cancel your subscription at any time; access continues until the end of the billing period.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">5. Data and Privacy</h3>
        <p>
          We collect and process data in accordance with our Privacy Policy. You retain ownership of your
          data, and we will never sell your personal information to third parties.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">6. Limitation of Liability</h3>
        <p>
          LandlordBot is provided &quot;as is&quot; without warranties of any kind. We are not responsible for
          decisions made based on AI-generated content. Always verify critical information independently.
        </p>
      </section>

      <p className="text-sm pt-4 border-t border-slate-200 dark:border-slate-700">
        For the complete Terms of Service, visit{' '}
        <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">
          landlord-bot-testing.vercel.app/terms
        </a>
      </p>
    </div>
  );

  // Privacy content (abbreviated version for modal - full version available at /privacy)
  const privacyContent = (
    <div className="space-y-6 text-slate-600 dark:text-slate-400">
      <p className="text-sm text-slate-500 dark:text-slate-500">
        Last updated: March 27, 2026
      </p>

      <section>
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">1. Information We Collect</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Account Information:</strong> Name, email, phone number, and property address.</li>
          <li><strong>Property Data:</strong> Unit details, tenant information, lease terms.</li>
          <li><strong>Usage Data:</strong> How you interact with the Service (pages visited, features used).</li>
          <li><strong>Communication Data:</strong> Messages sent through our platform.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">2. How We Use Your Information</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Provide and maintain the Service</li>
          <li>Process your transactions</li>
          <li>Send you important updates and notifications</li>
          <li>Improve our AI and user experience</li>
          <li>Comply with legal obligations</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">3. Data Security</h3>
        <p>
          We implement industry-standard security measures including encryption at rest and in transit,
          secure authentication, and regular security audits. Your data is stored with Supabase in
          SOC 2-compliant data centers.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">4. Third-Party Services</h3>
        <p>
          We may share data with trusted third parties (e.g., payment processors, email providers)
          who assist in operating the Service. These parties are bound by confidentiality agreements.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">5. Your Rights</h3>
        <p>
          You have the right to access, correct, or delete your personal information. Contact us
          at privacy@landlordbot.com to exercise these rights.
        </p>
      </section>

      <p className="text-sm pt-4 border-t border-slate-200 dark:border-slate-700">
        For the complete Privacy Policy, visit{' '}
        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">
          landlord-bot-testing.vercel.app/privacy
        </a>
      </p>
    </div>
  );

  const content = isTerms ? termsContent : privacyContent;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-modal-title"
          >
            <div 
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                    {React.createElement(icon, { className: "w-5 h-5 text-amber-600 dark:text-amber-400" })}
                  </div>
                  <h2 
                    id="legal-modal-title" 
                    className="text-xl font-bold text-slate-900 dark:text-slate-100"
                  >
                    {title}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {content}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl">
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors"
                >
                  I Understand
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default LegalModal;
