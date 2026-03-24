import { FileSignature, AlertTriangle, MapPin, Copyright, Ban, Gavel, Server, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function EULA() {
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
              <FileSignature className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-100">End User License Agreement</h1>
              <p className="text-slate-400">Last updated: {currentDate}</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            {/* NYC JURISDICTION BANNER */}
            
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 mb-8">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-slate-300">
                  <p className="font-semibold text-blue-400 mb-1">New York City Operations</p>
                  <p>
                    LandlordBot is licensed for use by New York City landlords and property managers. 
                    This Agreement is governed by the laws of New York State and New York City. All disputes 
                    shall be resolved in courts located in New York County, New York.
                  </p>
                </div>
              </div>
            </div>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">1. License Grant</h2>
              <p className="text-slate-400 mb-4">
                Subject to your compliance with the terms of this End User License Agreement ("EULA"), 
                GNE Services LLC ("Licensor"), a New York limited liability company, hereby grants you ("Licensee") 
                a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to access 
                and use the LandlordBot software platform ("Software" or "Service") as a cloud-based service 
                solely for your internal property management operations in New York State and New York City, 
                in accordance with this EULA and the Terms of Service.
              </p>
              <p className="text-slate-400 mb-4">
                This license is granted under and governed by the laws of New York State and New York City, 
                including New York Uniform Commercial Code Article 2A, New York General Obligations Law, 
                and applicable NYC administrative codes.
              </p>
              <p className="text-slate-400 mb-4">
                <strong className="text-slate-300">Geographic Limitation:</strong> This license is intended 
                for landlords and property managers operating properties primarily in New York State, 
                particularly New York City. Use outside of this jurisdiction may not be supported by 
                our compliance tools designed for NYC/NYS legal requirements.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">2. License Restrictions</h2>
              <p className="text-slate-400 mb-4">
                You shall not, and shall not permit any third party to:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
                <li>Reverse engineer, decompile, disassemble, or attempt to derive source code from the Software</li>
                <li>Modify, adapt, translate, or create derivative works based on the Software</li>
                <li>Remove, alter, or obscure any copyright notices, trademarks, or proprietary rights notices</li>
                <li>Rent, lease, lend, sell, sublicense, assign, or transfer rights in the Software</li>
                <li>Use the Software to provide service bureau, time-sharing, or similar services to third parties</li>
                <li>Circumvent or disable any security features or access controls</li>
                <li>Use the Software in violation of any applicable law, including New York landlord-tenant law, NYC HPD regulations, or Rent Stabilization codes</li>
                <li>Interfere with or disrupt the integrity or performance of the Software or its servers</li>
                <li>Scrape, mine, or extract data from the Software without authorization</li>
                <li>Attempt to gain unauthorized access to the Software or related systems</li>
                <li>Use the Software for properties outside our supported jurisdiction without acknowledgment of limited compliance features</li>
              </ul>
              <p className="text-slate-400 mb-4">
                Violation of these restrictions constitutes a material breach of this EULA and may 
                result in immediate termination of your license, without refund, and may subject you 
                to civil and criminal penalties under New York law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">3. Intellectual Property Rights</h2>
              
              <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Copyright className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-300">
                    <p className="font-semibold text-amber-400 mb-2">Copyright Notice</p>
                    <p>
                      The Software, including all code, designs, graphics, logos, trademarks, trade secrets, 
                      compliance tools specific to NYC/NYS, and documentation, is owned by GNE Services LLC 
                      and protected by United States and international copyright, trademark, patent, trade secret, 
                      and other intellectual property laws.
                    </p>
                    <p className="mt-2">
                      © 2024-{new Date().getFullYear()} GNE Services LLC. All rights reserved.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-slate-400 mb-4">
                All title, ownership rights, and intellectual property rights in and to the Software, 
                including all copies, modifications, and derivatives, including NYC-specific compliance 
                algorithms, FARE Act detection logic, and Rent Stabilization monitoring, shall remain 
                with Licensor. Nothing in this EULA constitutes a transfer of ownership or grants you any 
                rights beyond the limited license expressly granted herein.
              </p>

              <h3 className="text-lg font-medium text-slate-200 mb-3">3.1 Feedback</h3>
              <p className="text-slate-400 mb-4">
                You may provide feedback, suggestions, or ideas about the Software. You hereby 
                grant Licensor a perpetual, irrevocable, worldwide, royalty-free, fully paid-up license 
                to use such feedback for any purpose without compensation or attribution. This includes 
                improvements to our NYC compliance tools based on your suggestions.
              </p>

              <h3 className="text-lg font-medium text-slate-200 mb-3">3.2 Third-Party Components</h3>
              <p className="text-slate-400 mb-4">
                The Software may include or incorporate third-party open-source or proprietary software 
                components. Use of such components is subject to their respective licenses, which are 
                incorporated by reference into this EULA where applicable. We utilize third-party 
                services including Stripe (payments), AWS (hosting), and OpenAI/Anthropic (AI processing).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">4. Your Data</h2>
              
              <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Server className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-300">
                    <p className="font-semibold text-emerald-400 mb-2">Data Ownership</p>
                    <p>
                      You retain all right, title, and interest in and to any data, content, or materials 
                      you upload, submit, or transmit through the Software ("Your Data"), including 
                      property addresses, tenant information, and communications. You grant 
                      Licensor a limited license to access, process, and store Your Data solely to 
                      provide and improve the Service and ensure NYC/NYS compliance monitoring.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-slate-400 mb-4">
                You are solely responsible for:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
                <li>Lawful acquisition and use of Your Data in compliance with NYC Human Rights Law, FARE Act, and other applicable laws</li>
                <li>Obtaining all necessary consents and authorizations, including tenant consent where required</li>
                <li>Ensuring Your Data does not infringe third-party rights, including fair housing protections</li>
                <li>Maintaining backups of Your Data independent of the Service</li>
                <li>Complying with the NY SHIELD Act regarding private information security</li>
                <li>Providing accurate HPD registration numbers and Rent Stabilization status</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">5. Fair Housing and NYC Compliance Warranty</h2>
              
              <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Gavel className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-300">
                    <p className="font-semibold text-emerald-400 mb-2">Fair Housing Compliance for NYC</p>
                    <p>
                      The Software is designed to promote compliance with New York City and State laws:
                    </p>
                    <ul className="list-disc list-inside text-slate-400 space-y-1 ml-2 mt-2">
                      <li>Federal Fair Housing Act (42 U.S.C. § 3601 et seq.)</li>
                      <li>New York State Human Rights Law (Exec. Law § 290 et seq.)</li>
                      <li>New York City Human Rights Law (Admin. Code § 8-101 et seq.)</li>
                      <li>NYC FARE Act (Local Law 24 of 2023) - Fair Chance for Housing</li>
                      <li>NYC Local Law 144 (AEDT) - AI bias audit requirements</li>
                      <li>NYS Good Cause Eviction Law (HSTPA 2019)</li>
                      <li>NYC Rent Stabilization and Rent Control laws</li>
                      <li>NYC Department of Consumer and Worker Protection (DCWP) regulations</li>
                    </ul>
                  </div>
                </div>
              </div>

              <p className="text-slate-400 mb-4">
                By using the Software, you warrant that you will:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
                <li>Not use the Software to discriminate against any person based on protected characteristics (race, religion, gender, disability, familial status, sexual orientation, gender identity, source of income, lawful occupation)</li>
                <li>Not attempt to skirt rent stabilization, rent control, or tenant protection laws</li>
                <li>Comply with the NYC FARE Act prohibition on initial criminal history inquiries</li>
                <li>Use the NYC Compliance features to ensure lawful property management practices</li>
                <li>Seek independent legal advice from a New York-licensed attorney for complex legal matters</li>
                <li>Honor Good Cause Eviction protections where applicable</li>
                <li>Properly register rent-stabilized units with NYC DHCR and HPD where required</li>
              </ul>

              <p className="text-slate-400 mb-4">
                <strong className="text-slate-300">Disclaimer:</strong> While the Software includes tools 
                to assist with compliance specifically for NYC landlords, Licensor makes no warranty that 
                use of the Software will ensure compliance with all laws. You are solely responsible for 
                your compliance with applicable New York State and New York City laws and regulations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">6. Open Source and Third-Party Software</h2>
              <p className="text-slate-400 mb-4">
                The Software incorporates certain open-source software components. Your use of such 
                components is governed by their respective open-source licenses. A list of third-party 
                open-source components and their licenses is available upon request.
              </p>
              <p className="text-slate-400 mb-4">
                This EULA does not limit your rights under any applicable open-source license terms, 
                nor does it grant rights that supersede those terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">7. Disclaimer of Warranties</h2>
              
              <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-300">
                    <p className="font-semibold text-red-400 mb-2">NO WARRANTY</p>
                    <p>
                      THE SOFTWARE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
                      EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF 
                      MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, QUIET ENJOYMENT, 
                      ACCURACY, OR NON-INFRINGEMENT.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-slate-400 mb-4">
                WITHOUT LIMITING THE FOREGOING, LICENSOR DOES NOT WARRANT THAT:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
                <li>THE SOFTWARE WILL MEET YOUR SPECIFIC NYC COMPLIANCE REQUIREMENTS</li>
                <li>THE SOFTWARE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE</li>
                <li>THE RESULTS FROM USING THE SOFTWARE WILL BE ACCURATE OR RELIABLE FOR NYC LEGAL PROCEEDINGS</li>
                <li>ANY ERRORS IN THE SOFTWARE WILL BE CORRECTED</li>
                <li>THE SOFTWARE IS FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS</li>
                <li>NYC-SPECIFIC COMPLIANCE TOOLS WILL ALWAYS REFLECT CURRENT NYC ADMINISTRATIVE CODE CHANGES</li>
              </ul>

              <p className="text-slate-400 mb-4">
                YOU ASSUME ALL RISK FOR YOUR USE OF THE SOFTWARE. SOME JURISDICTIONS DO NOT ALLOW 
                THE EXCLUSION OF IMPLIED WARRANTIES, SO THE ABOVE EXCLUSIONS MAY NOT APPLY TO YOU. 
                IN NEW YORK, THE LIMITATIONS IN THE NEW YORK UNIFORM COMMERCIAL CODE APPLY.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">8. Limitation of Liability</h2>
              <p className="text-slate-400 mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL LICENSOR, ITS 
                OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
                SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED 
                TO DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES, 
                ARISING OUT OF OR RELATED TO YOUR USE OF OR INABILITY TO USE THE SOFTWARE, WHETHER 
                BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), OR ANY OTHER LEGAL THEORY, 
                EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
              <p className="text-slate-400 mb-4">
                IN NO EVENT SHALL LICENSOR'S TOTAL LIABILITY TO YOU FOR ALL DAMAGES EXCEED THE 
                AMOUNT YOU PAID TO LICENSOR FOR THE SOFTWARE IN THE TWELVE (12) MONTHS PRECEDING 
                THE CLAIM, OR ONE HUNDRED DOLLARS ($100), WHICHEVER IS GREATER.
              </p>
              <p className="text-slate-400 mb-4">
                THE FOREGOING LIMITATIONS SHALL APPLY EVEN IF THE LIMITED REMEDIES FAIL OF THEIR 
                ESSENTIAL PURPOSE. THIS LIMITATION OF LIABILITY IS A FUNDAMENTAL ELEMENT OF THE 
                BASIS OF THE BARGAIN BETWEEN YOU AND LICENSOR.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">9. Indemnification</h2>
              <p className="text-slate-400 mb-4">
                You agree to indemnify, defend, and hold harmless Licensor and its officers, directors, 
                employees, agents, licensors, and suppliers from and against all losses, expenses, 
                damages, and costs, including reasonable attorneys' fees, resulting from any violation 
                of this EULA by you or any claims arising from Your Data or your use of the Software, 
                including claims related to alleged violations of Fair Housing Law, NYC FARE Act, 
                or Rent Stabilization regulations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">10. Termination</h2>
              
              <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Ban className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-300">
                    <p className="font-semibold text-amber-400 mb-2">License Termination</p>
                    <p>
                      This license is effective until terminated. Licensor may terminate this license 
                      at any time, with or without cause, upon notice to you. Your rights under this 
                      license will terminate automatically without notice if you fail to comply with 
                      any term of this EULA.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-slate-400 mb-4">
                Upon termination:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mb-4">
                <li>All licenses granted to you under this EULA shall immediately terminate</li>
                <li>You must cease all use of the Software</li>
                <li>Your access to the Service will be deactivated</li>
                <li>Your data will be deleted in accordance with our data retention policies (typically 30 days)</li>
                <li>Provisions intended to survive termination (including IP rights, disclaimers, limitations of liability) shall remain in effect</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">11. Governing Law and Jurisdiction</h2>
              <p className="text-slate-400 mb-4">
                This EULA shall be governed by and construed in accordance with the laws of the State 
                of New York and the City of New York, without giving effect to any choice or conflict of law provision or rule.
              </p>
              <p className="text-slate-400 mb-4">
                Any legal suit, action, or proceeding arising out of or related to this EULA or the 
                Software shall be instituted exclusively in the federal or state courts located in 
                New York County, New York. You waive any objection to venue in such courts.
              </p>
              <p className="text-slate-400 mb-4">
                <strong className="text-slate-300">Jury Trial Waiver:</strong> TO THE EXTENT PERMITTED 
                BY APPLICABLE LAW, YOU HEREBY WAIVE ANY RIGHT TO A JURY TRIAL IN ANY LEGAL PROCEEDING 
                ARISING OUT OF OR RELATING TO THIS EULA.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">12. Dispute Resolution</h2>
              <p className="text-slate-400 mb-4">
                Before filing any claim, the parties agree to attempt to resolve disputes informally 
                for a period of thirty (30) days. If such informal resolution fails, either party may 
                pursue formal dispute resolution through the courts specified in Section 11.
              </p>
              <p className="text-slate-400 mb-4">
                <strong className="text-slate-300">Class Action Waiver:</strong> ANY PROCEEDINGS TO 
                RESOLVE DISPUTES WILL BE CONDUCTED ONLY ON AN INDIVIDUAL BASIS AND NOT IN A CLASS, 
                CONSOLIDATED, OR REPRESENTATIVE ACTION. YOU WAIVE ANY RIGHT TO PARTICIPATE IN CLASS 
                ACTIONS.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">13. Export Controls</h2>
              <p className="text-slate-400 mb-4">
                You may not use or export the Software in violation of U.S. export laws and regulations. 
                The Software may not be exported or re-exported to any country or person prohibited 
                by U.S. sanctions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">14. U.S. Government Rights</h2>
              <p className="text-slate-400 mb-4">
                The Software and documentation are "Commercial Items" as defined at 48 C.F.R. §2.101, 
                consisting of "Commercial Computer Software" and "Commercial Computer Software 
                Documentation." If you are a U.S. Government entity, the Software is licensed with 
                only those rights set forth in this EULA.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">15. Severability</h2>
              <p className="text-slate-400 mb-4">
                If any provision of this EULA is held to be invalid, illegal, or unenforceable by a 
                court of competent jurisdiction, such provision shall be limited or eliminated to the 
                minimum extent necessary, and the remaining provisions shall continue in full force 
                and effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">16. Waiver</h2>
              <p className="text-slate-400 mb-4">
                No waiver of any term of this EULA shall be deemed a further or continuing waiver of 
                such term. Any failure of Licensor to assert a right or provision under this EULA shall 
                not constitute a waiver of such right or provision.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">17. Entire Agreement</h2>
              <p className="text-slate-400 mb-4">
                This EULA, together with the Terms of Service and Privacy Policy, constitutes the entire 
                agreement between you and Licensor regarding the Software and supersedes all prior 
                agreements, understandings, and representations, whether written or oral.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">18. Assignment</h2>
              <p className="text-slate-400 mb-4">
                You may not assign this EULA without the prior written consent of Licensor. Licensor may 
                assign this EULA without restriction. This EULA shall be binding upon and inure to the 
                benefit of the parties and their respective successors and permitted assigns.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">19. Changes to EULA</h2>
              <p className="text-slate-400 mb-4">
                Licensor reserves the right to modify this EULA at any time. Material changes will be 
                notified via email or through the Software at least 30 days before taking effect. Your 
                continued use of the Software after changes constitutes acceptance of the revised EULA.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">20. Contact Information</h2>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-3">
                  <Building2 className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-400 font-semibold">GNE Services LLC</p>
                    <p className="text-sm text-slate-500">New York limited liability company serving NYC landlords</p>
                  </div>
                </div>
                <ul className="list-none text-slate-400 space-y-2">
                  <li className="flex items-center gap-2">
                    <FileSignature className="w-4 h-4 text-amber-400" />
                    <span>Legal inquiries: legal@gne-services.com</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FileSignature className="w-4 h-4 text-amber-400" />
                    <span>Support: support@gne-services.com</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span>Williston Park, NY 11596</span>
                  </li>
                </ul>
              </div>
            </section>

            <div className="mt-8 pt-8 border-t border-slate-800">
              <p className="text-sm text-slate-500">
                BY USING LANDLORDBOT, YOU ACKNOWLEDGE THAT YOU HAVE READ THIS END USER LICENSE AGREEMENT, 
                UNDERSTOOD IT, AND AGREE TO BE BOUND BY ITS TERMS. IF YOU DO NOT AGREE TO THESE TERMS, 
                YOU MUST IMMEDIATELY DISCONTINUE USE OF THE SOFTWARE.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default EULA;
