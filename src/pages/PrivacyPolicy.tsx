import { Shield, Lock, Eye, Trash2, MapPin, FileText, Bell, Database, UserCheck, Server, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PrivacyPolicy() {
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
              <Shield className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Privacy Policy</h1>
              <p className="text-slate-400">Last updated: {currentDate}</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            {/* INTRODUCTION */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">1. Introduction</h2>
              <p className="text-slate-400 mb-4">
                GNE Services LLC (&quot;LandlordBot&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is a New York limited liability company 
                committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, 
                and safeguard your information when you use our property management software platform 
                (&quot;Service&quot;), specifically designed for New York City landlords and property managers.
              </p>
              <p className="text-slate-400 mb-4">
                This Privacy Policy complies with:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
                <li><strong>New York State Stop Hacks and Improve Electronic Data Security (SHIELD) Act</strong> (General Business Law § 899-bb)</li>
                <li><strong>New York State General Business Law § 899-aa</strong> (Data breach notification)</li>
                <li><strong>New York City Consumer Protection Law</strong> (Admin Code Title 20, Chapter 5)</li>
                <li><strong>New York City Human Rights Law</strong> (Admin Code Title 8)</li>
                <li><strong>NYC Local Law 144</strong> (Automated Employment Decision Tools)</li>
                <li>Other applicable federal, state, and local privacy laws</li>
              </ul>
              <p className="text-slate-400 mb-4">
                By using the Service, you consent to the collection, use, and disclosure of your information 
                as described in this Privacy Policy. If you do not agree, please do not use the Service.
              </p>
            </section>

            {/* INFORMATION WE COLLECT */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-lg font-medium text-slate-200 mb-3">2.1 Personal Information</h3>
              <p className="text-slate-400 mb-4">We may collect the following categories of personal information from NYC landlords:</p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
                <li><strong className="text-slate-300">Account Information:</strong> Name, email address, phone number, billing address, NYC business address</li>
                <li><strong className="text-slate-300">Business Information:</strong> Property addresses (NYC and NY State), business name, EIN/Tax ID</li>
                <li><strong className="text-slate-300">Payment Information:</strong> Credit card or bank details (processed securely by Stripe; we do not store full payment data)</li>
                <li><strong className="text-slate-300">Property Data:</strong> Unit details, rent amounts, lease terms, tenant information for NYC properties</li>
                <li><strong className="text-slate-300">Communications:</strong> Messages between you, tenants, and the AI chatbot</li>
                <li><strong className="text-slate-300">Lead Information:</strong> Prospective tenant inquiries and contact details</li>
                <li><strong className="text-slate-300">Maintenance Records:</strong> Work orders, NYC-licensed vendor information, cost tracking</li>
                <li><strong className="text-slate-300">Compliance Data:</strong> Rent stabilization status, HPD registration numbers, Good Cause thresholds</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-200 mb-3">2.2 Automatically Collected Information</h3>
              <p className="text-slate-400 mb-4">When you access the Service, we may automatically collect:</p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
                <li>Device information (browser type, operating system, IP address with rough geolocation data to confirm NYC/NYS users)</li>
                <li>Usage data (pages visited, compliance tools used, time spent)</li>
                <li>Cookies and similar tracking technologies (see Section 9)</li>
                <li>Error logs and performance data</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-200 mb-3">2.3 Information We Do NOT Collect</h3>
              <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <UserCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-300">
                    <p className="font-semibold text-emerald-400 mb-2">Protected Information Exclusion (NYC/NYS)</p>
                    <p>In compliance with Federal Fair Housing Law and New York State and NYC Human Rights Laws, we explicitly do NOT collect or process:</p>
                    <ul className="list-disc list-inside text-slate-400 space-y-1 ml-2 mt-2">
                      <li>Race, color, or national origin</li>
                      <li>Religion or religious preferences</li>
                      <li>Sex, gender identity, or sexual orientation</li>
                      <li>Familial status or family composition</li>
                      <li>Disability status or medical information</li>
                      <li>Source of income (protected under NYC Admin Code § 8-107)</li>
                      <li>Criminal history (per NYC FARE Act, Local Law 24 of 2023)</li>
                    </ul>
                    <p className="mt-2 text-amber-400">
                      <strong>Note:</strong> Under the NYC FARE Act (Local Law 24 of 2023), criminal background checks 
                      may only be conducted after a conditional offer has been made. Our system does not request or 
                      process criminal history information at the application stage.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* DATA USE */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">3. How We Use Your Information</h2>
              <p className="text-slate-400 mb-4">We use your information for the following purposes related to NYC property management:</p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
                <li>Provide the AI chatbot service tailored to NYC compliance requirements</li>
                <li>Process payments and manage subscriptions</li>
                <li>Send administrative notifications and updates</li>
                <li>Respond to tenant inquiries via AI chatbot using NYC-compliant language</li>
                <li>Track lease expirations, rent stabilization renewals, and payment due dates</li>
                <li>Send escalation alerts for maintenance emergencies and HPD violations</li>
                <li>Monitor NYC-specific compliance (FARE Act, Good Cause Eviction, Rent Stabilization)</li>
                <li>Improve service functionality and user experience for NYC landlords</li>
                <li>Prevent fraud and ensure security</li>
                <li>Comply with federal, New York State, and New York City legal obligations</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-200 mb-3">3.1 Legal Basis for Processing (Applicable to NYC Users)</h3>
              <p className="text-slate-400 mb-4">Under NYC Consumer Protection Law and applicable privacy regulations, we process personal information based on:</p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
                <li><strong className="text-slate-300">Contractual Necessity:</strong> To provide the Service you requested</li>
                <li><strong className="text-slate-300">Legitimate Interests:</strong> To improve and secure our Service</li>
                <li><strong className="text-slate-300">Legal Compliance:</strong> To meet NYS and NYC regulatory requirements (HPD, DOB, Rent Guidelines Board, etc.)</li>
                <li><strong className="text-slate-300">Consent:</strong> Where you have explicitly agreed</li>
              </ul>
            </section>

            {/* DATA STORAGE & SECURITY */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">4. Data Storage & Security (NYC/NYS Compliant)</h2>
              
              <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-300">
                    <p className="font-semibold text-emerald-400 mb-2">NY SHIELD Act Compliance</p>
                    <p>
                      We implement comprehensive data security safeguards compliant with the New York State 
                      Stop Hacks and Improve Electronic Data Security (SHIELD) Act (Gen. Bus. Law § 899-bb), 
                      including:
                    </p>
                    <ul className="list-disc list-inside text-slate-400 space-y-1 ml-2 mt-2">
                      <li><strong>Administrative safeguards:</strong> Staff training, access controls, contractual safeguards with vendors, incident response plans</li>
                      <li><strong>Technical safeguards:</strong> AES-256 encryption at rest, TLS 1.3 or higher for data in transit, secure authentication</li>
                      <li><strong>Physical safeguards:</strong> Secure data center facilities with access controls (AWS US-East regions)</li>
                      <li><strong>Regular assessments:</strong> Annual risk assessments and security audits</li>
                    </ul>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-medium text-slate-200 mb-3">4.1 Data Storage Location</h3>
              <p className="text-slate-400 mb-4">
                Primary data is stored in <strong>AWS US-East-1 (N. Virginia)</strong> and <strong>US-East-2 (Ohio)</strong> 
                data centers. Backup data may be stored in US-West regions. By using the Service, you consent to 
                data transfer and storage within the United States.
              </p>

              <h3 className="text-lg font-medium text-slate-200 mb-3">4.2 Local-First Architecture</h3>
              <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Database className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300">
                    <strong className="text-amber-400">By default, your data is stored locally</strong> in your 
                    browser&apos;s localStorage. We do not transmit or store your property details, tenant information, 
                    or messages on our servers unless you explicitly opt-in to cloud sync features. Cloud sync 
                    data is encrypted both in transit and at rest.
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-medium text-slate-200 mb-3">4.3 Security Measures</h3>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
                <li>All data transmission encrypted via HTTPS (TLS 1.3 minimum)</li>
                <li>Payment information processed by Stripe (PCI DSS Level 1 compliant)</li>
                <li>No storage of credit card details on our servers</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Multi-factor authentication (MFA) available and recommended</li>
                <li>Role-based access controls for multi-user accounts</li>
                <li>Employee background checks and confidentiality agreements</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-200 mb-3">4.4 Data Retention</h3>
              <p className="text-slate-400 mb-4">
                We retain your information only as long as necessary to fulfill the purposes outlined 
                in this Privacy Policy, unless a longer retention period is required by law (e.g., tax records, 
                legal hold requests). Upon account deletion, we will securely delete or anonymize your data 
                within 30 days, except where retention is required for legal compliance or audit purposes.
              </p>
            </section>

            {/* DATA BREACH NOTIFICATION */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">5. Data Breach Notification (NYC/NYS Compliant)</h2>
              
              <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-300">
                    <p className="font-semibold text-red-400 mb-2">NY General Business Law § 899-aa</p>
                    <p>
                      In compliance with New York State data breach notification laws, we will notify 
                      affected individuals, the New York State Attorney General, and the NYC Department of 
                      Consumer and Worker Protection (if applicable) within the following timeframes 
                      in the event of a data breach involving private information of NYC/NYS residents:
                    </p>
                    <ul className="list-disc list-inside text-slate-400 space-y-1 ml-2 mt-2">
                      <li><strong>Without unreasonable delay:</strong> Notify affected individuals (typically within 72 hours of discovery)</li>
                      <li><strong>Notification to NYS Attorney General:</strong> Required when notifying more than 500 NY residents</li>
                      <li><strong>Notification to credit reporting agencies:</strong> Required when notifying more than 5,000 NY residents</li>
                      <li><strong>Identity theft protection:</strong> May be offered when Social Security numbers are involved</li>
                    </ul>
                  </div>
                </div>
              </div>

              <p className="text-slate-400 mb-4">
                If we discover a data breach that affects your personal information, we will:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
                <li>Notify you without unreasonable delay (typically within 72 hours)</li>
                <li>Describe the nature of the breach, types of information involved, and steps taken</li>
                <li>Provide contact information for follow-up questions</li>
                <li>Offer identity theft protection services when required by law</li>
                <li>Report to relevant authorities as required by NYS law</li>
              </ul>
            </section>

            {/* DATA SHARING */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">6. Information Sharing & Disclosure</h2>
              <p className="text-slate-400 mb-4">We do not sell your personal information to third parties. We may share information in the following circumstances:</p>
              
              <h3 className="text-lg font-medium text-slate-200 mb-3">6.1 Service Providers (Data Processors)</h3>
              <p className="text-slate-400 mb-4">
                We engage trusted third-party service providers to perform functions on our behalf. All vendors 
                are contractually bound to comply with the NY SHIELD Act and maintain appropriate security measures:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
                <li><strong className="text-slate-300">Stripe, Inc.:</strong> Payment processing (PCI DSS Level 1 compliant)</li>
                <li><strong className="text-slate-300">Amazon Web Services (AWS):</strong> Cloud hosting and storage (US-East-1)</li>
                <li><strong className="text-slate-300">OpenAI/Anthropic:</strong> AI language model processing (data not used for model training)</li>
                <li><strong className="text-slate-300">HubSpot/Intercom:</strong> Customer support and communication (opt-in only)</li>
                <li><strong className="text-slate-300">Analytics providers:</strong> Usage analytics and error tracking (aggregated/anonymized data only)</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-200 mb-3">6.2 Legal Requirements</h3>
              <p className="text-slate-400 mb-4">We may disclose information if required to do so by law or in response to valid requests by public authorities, including:</p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
                <li>Compliance with valid subpoenas, court orders, or legal process (including NYC Housing Court)</li>
                <li>Protection of our rights and property</li>
                <li>Prevention of fraud or illegal activity</li>
                <li>Protection of personal safety or property</li>
                <li>Cooperation with NYC Department of Investigation (DOI) or other law enforcement</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-200 mb-3">6.3 Business Transfers</h3>
              <p className="text-slate-400 mb-4">
                If we are involved in a merger, acquisition, or sale of assets, your information 
                may be transferred as part of that transaction. We will notify you of any such change 
                in ownership or control in accordance with NYC Consumer Protection Law requirements.
              </p>
            </section>

            {/* YOUR RIGHTS */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">7. Your Privacy Rights (NYC & NYS)</h2>
              <p className="text-slate-400 mb-4">Depending on your location and applicable law, you may have the following rights:</p>
              
              <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <UserCheck className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-300">
                    <p className="font-semibold text-blue-400 mb-2">New York State Resident Rights</p>
                    <p>Under NY SHIELD Act and applicable consumer protection laws, you have the right to:</p>
                    <ul className="list-disc list-inside text-slate-400 space-y-1 ml-2 mt-2">
                      <li><strong>Access:</strong> Request confirmation of whether we process your personal information and access copies of it</li>
                      <li><strong>Correction:</strong> Request correction or amendment of inaccurate information</li>
                      <li><strong>Deletion:</strong> Request deletion of your personal information, subject to legal retention requirements</li>
                      <li><strong>Portability:</strong> Export your data in a portable, machine-readable format (CSV, JSON)</li>
                      <li><strong>Opt-out of Sale:</strong> While we do not sell data, you have the right to opt-out if we ever do</li>
                      <li><strong>Non-discrimination:</strong> Receive equal service and pricing regardless of privacy choices</li>
                    </ul>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-medium text-slate-200 mb-3">7.1 NYC Consumer Protection Rights</h3>
              <p className="text-slate-400 mb-4">
                Under NYC Consumer Protection Law, NYC residents have additional protections against 
                deceptive business practices. We commit to:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
                <li>Transparent disclosure of all fees before you subscribe</li>
                <li>Honoring cancellation requests promptly</li>
                <li>Providing clear information about data handling practices</li>
                <li>Responding to consumer complaints within 15 business days</li>
              </ul>

              <h3 className="text-lg font-medium text-slate-200 mb-3">7.2 Exercising Your Rights</h3>
              <p className="text-slate-400 mb-4">To exercise your privacy rights:</p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
                <li><strong>Access/Export:</strong> Use the Config page to download all your data in CSV or JSON format</li>
                <li><strong>Delete:</strong> Use the Config page to permanently delete all data</li>
                <li><strong>Update:</strong> Edit profile information in your account settings</li>
                <li><strong>Contact Us:</strong> Email privacy@gne-services.com for assistance with rights requests</li>
              </ul>
              <p className="text-slate-400 mb-4">
                We will respond to verifiable consumer requests within 45 days as required by applicable law. 
                For complex requests, we may extend this period by an additional 45 days with notice.
              </p>
            </section>

            {/* CHILDREN'S PRIVACY */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">8. Children&apos;s Privacy</h2>
              <p className="text-slate-400 mb-4">
                The Service is not intended for children under 18 years of age. We do not knowingly 
                collect personally identifiable information from children under 18. If you are a parent 
                or guardian and believe your child has provided us with personal information, please 
                contact us at privacy@gne-services.com.
              </p>
            </section>

            {/* COOKIES & TRACKING */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">9. Cookies and Tracking Technologies</h2>
              <p className="text-slate-400 mb-4">We use cookies and similar technologies for:</p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
                <li><strong>Essential:</strong> Authentication, security, and service functionality</li>
                <li><strong>Preferences:</strong> Remember your settings and dashboard configuration</li>
                <li><strong>Analytics:</strong> Understand usage patterns to improve service (anonymized data)</li>
              </ul>
              <p className="text-slate-400 mb-4">
                You can control cookies through your browser settings. Note that disabling cookies 
                may affect Service functionality. We do not use tracking cookies for advertising purposes.
              </p>
            </section>

            {/* AI/CHATBOT DATA */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">10. AI Chatbot Data Processing</h2>
              
              <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Server className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-300">
                    <p className="font-semibold text-amber-400 mb-2">AI Processing Notice (NYC Local Law 144)</p>
                    <p className="mb-2">
                      Our AI chatbot processes messages to provide automated responses. Under NYC Local Law 144 
                      regarding Automated Employment Decision Tools (AEDT), we provide the following information:
                    </p>
                    <ul className="list-disc list-inside text-slate-400 space-y-1 ml-2">
                      <li>We use third-party AI providers (OpenAI/Anthropic) to process tenant communications</li>
                      <li>Messages are processed solely to generate responses and improve our compliance tools</li>
                      <li>Your data is not used to train AI models without explicit opt-in consent</li>
                      <li>Do not share sensitive personal information (SSN, financial details) in chat messages</li>
                      <li>Chat logs are retained for your reference and service improvement purposes</li>
                    </ul>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-medium text-slate-200 mb-3">10.1 NYC Local Law 144 (AEDT) Compliance</h3>
              <p className="text-slate-400 mb-4">
                LandlordBot uses AI technology that may qualify as an Automated Employment Decision Tool (AEDT) 
                under NYC Local Law 144. This law requires:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
                <li>Annual bias audits of AI systems affecting tenants</li>
                <li>Public disclosure of audit results</li>
                <li>Notice to affected individuals about AEDT use</li>
                <li>Alternative selection processes upon request</li>
              </ul>
              <p className="text-slate-400 mb-4">
                We have conducted or will conduct independent bias audits of our AI chatbot and will publish 
                results as required by law. Contact us for more information about our AEDT practices.
              </p>

              <h3 className="text-lg font-medium text-slate-200 mb-3">10.2 AI Limitations</h3>
              <p className="text-slate-400 mb-4">
                The AI chatbot provides automated responses based on your configured settings and NYC compliance rules. 
                <strong className="text-slate-300"> AI responses do not constitute legal advice.</strong> 
                Always consult a qualified New York attorney for legal matters. You are responsible for reviewing 
                and approving all AI-generated communications before sending to tenants.
              </p>
            </section>

            {/* DATA DELETION */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">11. Data Deletion</h2>
              <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Trash2 className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-300">
                    <p className="font-semibold text-red-400 mb-2">Permanent Data Deletion</p>
                    <p className="mb-2">
                      You can delete all your data at any time through the Config page. This action is:
                    </p>
                    <ul className="list-disc list-inside text-slate-400 space-y-1 ml-2">
                      <li><strong>Irreversible:</strong> Cannot be undone once confirmed</li>
                      <li><strong>Complete:</strong> Removes all property data, tenant info, messages, and settings</li>
                      <li><strong>Immediate:</strong> Takes effect within seconds for local data</li>
                      <li><strong>Cloud Sync:</strong> If enabled, cloud data is deleted within 30 days</li>
                      <li><strong>Exceptions:</strong> Some data may be retained if required by law (tax records, legal holds)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* THIRD-PARTY LINKS */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">12. Third-Party Links</h2>
              <p className="text-slate-400 mb-4">
                The Service may contain links to third-party websites (e.g., NYC Department of Finance, 
                NYC Housing Court, HPD). We are not responsible for the privacy practices or content of 
                these sites. We encourage you to review the privacy policies of any third-party sites you visit.
              </p>
            </section>

            {/* CHANGES TO POLICY */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">13. Changes to This Privacy Policy</h2>
              <p className="text-slate-400 mb-4">
                We may update this Privacy Policy from time to time to reflect changes in our practices, 
                NYC/NYS legal requirements, or Service functionality. Material changes will be 
                notified via email or through the Service at least 30 days before taking effect. 
                Your continued use of the Service after changes constitutes acceptance of the revised Policy.
              </p>
            </section>

            {/* CONTACT */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">14. Contact Information</h2>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-3">
                  <Building2 className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-400 font-semibold">GNE Services LLC</p>
                    <p className="text-sm text-slate-500">New York LLC, primarily serving NYC landlords</p>
                  </div>
                </div>
                <ul className="list-none text-slate-400 space-y-2">
                  <li className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Privacy inquiries: privacy@gne-services.com</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>General support: support@gne-services.com</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span>Williston Park, NY 11596</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* NYS ATTORNEY GENERAL */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">15. NYS Attorney General & NYC DCWP</h2>
              <p className="text-slate-400 mb-4">
                If you believe your privacy rights have been violated or have unresolved privacy concerns, 
                you may contact:
              </p>
              <div className="bg-slate-800/50 rounded-lg p-4 text-sm text-slate-400 space-y-4">
                <div>
                  <p className="font-semibold text-slate-300">New York State Office of the Attorney General</p>
                  <p>Internet Bureau<br />
                  28 Liberty Street, 15th Floor<br />
                  New York, NY 10005<br />
                  <a href="https://ag.ny.gov" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">ag.ny.gov</a></p>
                </div>
                <div>
                  <p className="font-semibold text-slate-300">NYC Department of Consumer and Worker Protection</p>
                  <p>42 Broadway<br />
                  New York, NY 10004<br />
                  Consumer Hotline: 311 (in NYC) or 212-NEW-YORK (outside NYC)<br />
                  <a href="https://nyc.gov/consumers" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">nyc.gov/consumers</a></p>
                </div>
              </div>
            </section>

            <div className="mt-8 pt-8 border-t border-slate-800">
              <p className="text-sm text-slate-500">
                By using LandlordBot, you acknowledge that you have read and understood this Privacy 
                Policy and consent to the collection, use, and disclosure of your information as described 
                herein, in compliance with New York State and New York City privacy laws.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
