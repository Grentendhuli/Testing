import { Scale, AlertTriangle, MapPin, FileText, CreditCard, Shield, Building2, Landmark } from 'lucide-react';
import { Link } from 'react-router-dom';

export function TermsOfService() {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link to="/dashboard" className="text-amber-400 hover:text-amber-300 text-sm">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-amber-500/10 rounded-lg">
              <Scale className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Terms of Service</h1>
              <p className="text-slate-400">Last updated: {currentDate}</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            {/* NEW: NYC Jurisdiction Banner */}
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 mb-8">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-slate-300">
                  <p className="font-semibold text-blue-400 mb-1">New York City Operations</p>
                  <p>
                    LandlordBot is designed specifically for New York City landlords and property managers. 
                    These Terms are governed by the laws of New York State and New York City. All disputes 
                    shall be resolved in courts located in New York County, New York.
                  </p>
                </div>
              </div>
            </div>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">1. Acceptance of Terms</h2>
              <p className="text-slate-400 mb-4">
                By accessing or using LandlordBot (&quot;the Service&quot;), operated by GNE Services LLC 
                (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), a New York limited liability company, you agree to be bound by these Terms of Service 
                (&quot;Terms&quot;). If you do not agree to these terms, please do not use the Service. 
                These Terms constitute a binding legal agreement under New York General Obligations Law § 5-903.
              </p>
              <p className="text-slate-400 mb-4">
                <strong className="text-slate-300">Eligibility:</strong> You must be at least 18 years old, 
                a property owner, landlord, or authorized property manager operating in New York City or New York State, 
                and legally capable of entering into contracts under New York law to use this Service. 
                By using the Service, you represent and warrant that you meet these requirements.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">2. Description of Service</h2>
              <p className="text-slate-400 mb-4">
                LandlordBot is an AI-powered property management software platform specifically designed for 
                <strong>New York City landlords and property managers</strong>. The Service assists with:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
                <li>Tenant communications and lead management</li>
                <li>Rent collection tracking and payment processing</li>
                <li>Lease management and expiration monitoring</li>
                <li>Maintenance coordination</li>
                <li><strong>New York City-specific compliance monitoring</strong> (FARE Act, Good Cause Eviction, Rent Stabilization)</li>
                <li><strong>NYC Department of Housing Preservation & Development (HPD) compliance</strong></li>
                <li><strong>NYC Housing Court documentation support</strong></li>
              </ul>
              <p className="text-slate-400 mb-4">
                <strong className="text-slate-300">Service Availability:</strong> We strive to maintain 
                99.9% uptime but do not guarantee uninterrupted access. Scheduled maintenance and 
                unforeseen technical issues may result in temporary service interruptions.
              </p>
            </section>

            {/* Subscription & Auto-Renewal Section - NY GBL § 394-c */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">3. Subscription, Billing & Auto-Renewal</h2>
              
              <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-300">
                    <p className="font-semibold text-amber-400 mb-2">New York Auto-Renewal Law Disclosure</p>
                    <p className="mb-2">
                      <strong>Pursuant to New York General Business Law § 394-c:</strong> Your subscription 
                      will automatically renew at the end of each billing period unless canceled. By subscribing, 
                      you authorize us to charge your payment method for the renewal term.
                    </p>
                    <ul className="list-disc list-inside text-slate-400 space-y-1 ml-2">
                      <li>Free Trial: 30 days, auto-converts to paid subscription unless cancelled</li>
                      <li>Monthly Plan: $75/month, auto-renews monthly</li>
                      <li>Pro Plan: $150/month (if selected), auto-renews monthly</li>
                      <li>Annual Plan: $750/year (if offered), auto-renews annually</li>
                      <li><strong>All prices exclude applicable NYC sales tax (8.875%)</strong></li>
                    </ul>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-medium text-slate-200 mb-3">3.1 Cancellation Rights</h3>
              <p className="text-slate-400 mb-4">
                You may cancel your subscription at any time through your account settings or by contacting 
                support at support@gne-services.com. Cancellation will take effect at the end of your current billing period. 
                <strong> No refunds will be provided for partial months.</strong>
              </p>
              <p className="text-slate-400 mb-4">
                <strong className="text-slate-300">New York Residents:</strong> Under N.Y. Gen. Bus. Law § 394-c, 
                you have the right to cancel auto-renewing subscriptions. We will provide notice at least 
                15 days (or 30 days for annual plans) before any renewal or price increase.
              </p>

              <h3 className="text-lg font-medium text-slate-200 mb-3">3.2 Payment & Billing</h3>
              <p className="text-slate-400 mb-4">
                All payments are processed securely through Stripe, Inc. By providing payment information, 
                you represent that you are authorized to use the designated payment method. You agree to 
                keep your payment information current.
              </p>
              <p className="text-slate-400 mb-4">
                <strong className="text-slate-300">Taxes:</strong> All fees are exclusive of applicable taxes. 
                Users will be charged <strong>New York State sales tax and NYC local taxes</strong> as required by law 
                (currently 8.875% for NYC customers).
              </p>

              <h3 className="text-lg font-medium text-slate-200 mb-3">3.3 Price Changes</h3>
              <p className="text-slate-400 mb-4">
                We may modify subscription fees upon 30 days&apos; prior notice. Price changes will take 
                effect at the next billing cycle. Your continued use of the Service after the effective 
                date constitutes acceptance of the new pricing.
              </p>
            </section>

            {/* Account & User Conduct */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">4. Account Registration & Security</h2>
              <p className="text-slate-400 mb-4">
                You are responsible for maintaining the confidentiality of your account credentials and 
                for all activities that occur under your account. You agree to:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
                <li>Provide accurate and complete registration information</li>
                <li>Update your information to keep it accurate</li>
                <li>Notify us immediately of any unauthorized account use</li>
                <li>Use strong, unique passwords and enable two-factor authentication when available</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">5. Acceptable Use & Prohibited Activities</h2>
              <p className="text-slate-400 mb-4">You agree not to use the Service to:</p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
                <li>Violate any federal, state, or local law, including New York landlord-tenant law</li>
                <li>Discriminate against tenants or applicants based on protected characteristics</li>
                <li>Collect or process information relating to race, religion, national origin, disability, 
                    familial status, sexual orientation, gender identity, or other legally protected classes</li>
                <li>Attempt to circumvent rent stabilization, rent control, or Good Cause Eviction protections</li>
                <li>Impersonate any person or entity or falsely state your authority</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Upload malicious code, viruses, or harmful content</li>
                <li>Scrape, crawl, or data-mine the Service without authorization</li>
                <li>Use the Service for any illegal purpose</li>
              </ul>
            </section>

            {/* Fair Housing & Compliance */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">6. New York City/NYS Fair Housing & Compliance</h2>
              
              <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-300">
                    <p className="font-semibold text-emerald-400 mb-2">Fair Housing Compliance</p>
                    <p className="mb-2">
                      LandlordBot is designed for <strong>New York City landlords</strong> and complies with:
                    </p>
                    <ul className="list-disc list-inside text-slate-400 space-y-1 ml-2">
                      <li>Federal Fair Housing Act (42 U.S.C. § 3601 et seq.)</li>
                      <li>New York State Human Rights Law (N.Y. Exec. Law § 290 et seq.)</li>
                      <li><strong>New York City Human Rights Law (N.Y.C. Admin. Code § 8-101 et seq.)</strong></li>
                      <li><strong>NYC FARE Act (Local Law 24 of 2023)</strong> — Fair Chance for Housing</li>
                      <li><strong>NYC Local Law 144 (AEDT)</strong> — Automated Employment Decision Tools (AI bias audit requirements)</li>
                      <li>NYS Good Cause Eviction Law (HSTPA 2019)</li>
                      <li><strong>NYC Rent Stabilization and Rent Control laws</strong></li>
                      <li><strong>NYC Department of Consumer and Worker Protection (DCWP) regulations</strong></li>
                    </ul>
                  </div>
                </div>
              </div>

              <p className="text-slate-400 mb-4">
                <strong className="text-slate-300">User Responsibility:</strong> While LandlordBot provides 
                compliance tools and templates designed for <strong>New York City property management</strong>, 
                you are solely responsible for ensuring your property management practices comply with all applicable NYC laws. 
                The Service does not constitute legal advice.
              </p>

              <h3 className="text-lg font-medium text-slate-200 mb-3">6.1 NYC FARE Act (Local Law 24 of 2023)</h3>
              <p className="text-slate-400 mb-4">
                For properties in New York City, you acknowledge that LandlordBot:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
                <li>Does not request or process criminal history information until after a conditional offer has been made</li>
                <li>Provides compliant FARE Act disclosure language for tenant screenings</li>
                <li>Will not generate inquiries into protected criminal record information</li>
                <li>Flags properties subject to FARE Act requirements</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-200 mb-3">6.2 NYC Local Law 144 (AEDT) Compliance</h3>
              <p className="text-slate-400 mb-4">
                LandlordBot uses AI-powered tools that may qualify as Automated Employment Decision Tools (AEDT) 
                under NYC Local Law 144. We:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
                <li>Have conducted or will conduct annual bias audits of our AI systems where applicable</li>
                <li>Provide notices regarding the use of AEDTs in our decision-making processes</li>
                <li>Allow users to opt-out of automated decision-making features</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-200 mb-3">6.3 Good Cause Eviction (HSTPA 2019)</h3>
              <p className="text-slate-400 mb-4">
                For qualifying properties under New York State&apos;s Housing Stability and Tenant Protection 
                Act of 2019, LandlordBot will:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
                <li>Flag properties subject to Good Cause protections</li>
                <li>Track rent increase limitations (max 10% or CPI+5%, whichever is lower)</li>
                <li>Provide compliant notice templates for lease non-renewals</li>
                <li>Identify &quot;good cause&quot; grounds required for eviction under NYC Housing Court standards</li>
              </ul>
            </section>

            {/* DISCLAIMER */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">7. Important Disclaimers</h2>
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-300">
                    <p className="font-semibold text-red-400 mb-2">Not Legal Advice</p>
                    <p>
                      LandlordBot is an AI-powered software tool, not a law firm, attorney, or legal 
                      professional. The Service does not provide legal advice. All compliance tools, 
                      templates, and recommendations designed for NYC landlords are for informational purposes only and do not 
                      create an attorney-client relationship. Always consult with a New York-licensed attorney for legal matters.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-slate-400 mb-4">
                <strong className="text-slate-300">No Warranty:</strong> THE SERVICE IS PROVIDED &quot;AS IS&quot; 
                AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING 
                BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, 
                OR NON-INFRINGEMENT.
              </p>

              <p className="text-slate-400 mb-4">
                <strong className="text-slate-300">Liability Limitation:</strong> TO THE MAXIMUM EXTENT 
                PERMITTED BY NEW YORK LAW, GNE SERVICES LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, 
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, 
                ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT 
                YOU PAID FOR THE SERVICE IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
              </p>
            </section>

            {/* Data & Security */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">8. Data Security & Privacy</h2>
              <p className="text-slate-400 mb-4">
                We implement industry-standard security measures to protect your data, including 
                encryption in transit and at rest. However, no security system is impenetrable. 
                You acknowledge that you provide data at your own risk.
              </p>
              <p className="text-slate-400 mb-4">
                <strong className="text-slate-300">NY SHIELD Act Compliance:</strong> We maintain 
                safeguards compliant with the Stop Hacks and Improve Electronic Data Security (SHIELD) 
                Act (Gen. Bus. Law § 899-bb) to protect private information of New York residents.
              </p>
              <p className="text-slate-400 mb-4">
                For complete information on how we collect, use, and protect your data, please review 
                our <Link to="/privacy" className="text-amber-400 hover:underline">Privacy Policy</Link>.
              </p>
            </section>

            {/* Intellectual Property */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">9. Intellectual Property</h2>
              <p className="text-slate-400 mb-4">
                All content, features, and functionality of the Service, including but not limited to 
                text, graphics, logos, icons, images, audio clips, software, and compilations thereof, 
                are the exclusive property of GNE Services LLC and are protected by United States and 
                international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
              <p className="text-slate-400 mb-4">
                We grant you a limited, non-exclusive, non-transferable, revocable license to use the 
                Service for your personal or internal business use, subject to these Terms.
              </p>
            </section>

            {/* Termination */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">10. Termination</h2>
              <p className="text-slate-400 mb-4">
                We may suspend or terminate your account and access to the Service immediately, without 
                prior notice or liability, for any reason, including breach of these Terms.
              </p>
              <p className="text-slate-400 mb-4">
                Upon termination, your right to use the Service ceases immediately. All provisions 
                of these Terms which by their nature should survive termination shall survive, including 
                ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
              </p>
            </section>

            {/* Dispute Resolution */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">11. Dispute Resolution & Governing Law</h2>
              
              <h3 className="text-lg font-medium text-slate-200 mb-3">11.1 Governing Law</h3>
              <p className="text-slate-400 mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the State 
                of New York and the City of New York, without regard to its conflict of law provisions. 
                You agree that any legal action arising from these Terms shall be subject to the exclusive jurisdiction 
                of the state and federal courts located in <strong>New York County, New York</strong>.
              </p>

              <h3 className="text-lg font-medium text-slate-200 mb-3">11.2 Informal Resolution</h3>
              <p className="text-slate-400 mb-4">
                Before filing any claim, you agree to attempt to resolve disputes informally by contacting 
                us at support@gne-services.com. We will attempt to resolve the dispute within 30 days. 
                If we cannot, either party may pursue formal dispute resolution.
              </p>

              <h3 className="text-lg font-medium text-slate-200 mb-3">11.3 Class Action Waiver</h3>
              <p className="text-slate-400 mb-4">
                You agree that any proceedings to resolve disputes will be conducted only on an 
                individual basis and not in a class, consolidated, or representative action. 
                You waive any right to participate in class actions.
              </p>

              <h3 className="text-lg font-medium text-slate-200 mb-3">11.4 Jury Trial Waiver</h3>
              <p className="text-slate-400 mb-4">
                You waive any right to a jury trial in any legal proceeding arising out of or relating 
                to these Terms.
              </p>
            </section>

            {/* Indemnification */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">12. Indemnification</h2>
              <p className="text-slate-400 mb-4">
                You agree to defend, indemnify, and hold harmless GNE Services LLC, its officers, 
                directors, employees, agents, licensors, and suppliers from and against any claims, 
                liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including 
                reasonable attorneys&apos; fees) arising out of or relating to: (a) your violation of these 
                Terms; (b) your use of the Service; (c) your violation of any third-party rights; or 
                (d) your violation of any applicable law.
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">13. Changes to Terms</h2>
              <p className="text-slate-400 mb-4">
                We may revise these Terms at any time by updating this page. Material changes will 
                be notified via email or through the Service at least 30 days before taking effect. 
                Your continued use of the Service after changes constitutes acceptance of the revised Terms.
              </p>
            </section>

            {/* Severability */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">14. Severability</h2>
              <p className="text-slate-400 mb-4">
                If any provision of these Terms is held invalid or unenforceable by a court of competent 
                jurisdiction, such provision shall be modified to the minimum extent necessary to make 
                it enforceable, and the remaining provisions shall remain in full force and effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">15. Contact Information</h2>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-slate-400 mb-2 font-semibold">GNE Services LLC</p>
                <div className="flex items-start gap-2 mb-3">
                  <Landmark className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-slate-400">Registered in New York State, operating primarily in New York City</p>
                </div>
                <ul className="list-none text-slate-400 space-y-2">
                  <li className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Email: support@gne-services.com</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span>Williston Park, NY 11596</span>
                  </li>
                </ul>
                <p className="text-slate-500 text-sm mt-3">
                  For legal notices, please mail to our registered address in New York State.
                </p>
              </div>
            </section>

            <div className="mt-8 pt-8 border-t border-slate-800">
              <p className="text-sm text-slate-500">
                By using LandlordBot, you acknowledge that you have read, understood, and agree to be 
                bound by these Terms of Service. If you do not agree, you must immediately discontinue 
                use of the Service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
