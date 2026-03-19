import { Shield, UserCheck, Mail, Phone, Calendar, Star } from 'lucide-react';
import { ComplianceFooter } from '../components/ComplianceFooter';
import { useApp } from '../context/AppContext';

export function EliteManager() {
  const { user } = useApp();
  
  // Show placeholder for non-concierge users
  if (user?.subscriptionTier !== 'concierge') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-100">Elite Manager</h1>
          <p className="text-slate-400 mt-1">Your dedicated property management concierge</p>
        </div>
        
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
          <Shield className="w-16 h-16 text-amber-500/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-200 mb-2">Concierge Tier Feature</h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Get a dedicated, certified real estate professional assigned to your portfolio 
            with monthly walkthroughs and priority support.
          </p>
          <a 
            href="/billing" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg transition-colors"
          >
            Learn About Elite
          </a>
        </div>
        
        <ComplianceFooter />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-slate-100">Your Elite Manager</h1>
        <p className="text-slate-400 mt-1">Dedicated support for your portfolio</p>
      </div>

      {/* Manager Profile Card */}
      <div className="bg-gradient-to-br from-amber-900/20 to-slate-900/50 border border-amber-500/30 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0">
            <span className="text-3xl font-bold text-slate-950">SC</span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-semibold text-slate-100">Sarah Chen</h2>
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" />
                Elite Manager
              </span>
            </div>            <p className="text-slate-400 mb-4">Licensed Real Estate Professional • 8+ Years Experience</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-slate-300">
                <div className="p-2 bg-slate-800 rounded-lg">
                  <Phone className="w-4 h-4 text-amber-400" />
                </div>
                <span>(555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <div className="p-2 bg-slate-800 rounded-lg">
                  <Mail className="w-4 h-4 text-amber-400" />
                </div>
                <span>sarah.chen@landlordbot.com</span>
              </div>
            </div>          </div>
        </div>
      </div>

      {/* Services Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="p-3 bg-amber-900/30 rounded-lg w-fit mb-4">
            <Calendar className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">Monthly Walkthroughs</h3>
          <p className="text-sm text-slate-400">
            Scheduled monthly visits with photo documentation and condition reports for each unit.
          </p>        </div>
        
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="p-3 bg-amber-900/30 rounded-lg w-fit mb-4">
            <UserCheck className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">Priority Escalations</h3>
          <p className="text-sm text-slate-400">
            All escalations reviewed within 2 hours during business hours, with direct follow-up.
          </p>        </div>
        
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="p-3 bg-amber-900/30 rounded-lg w-fit mb-4">
            <Shield className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">Strategic Advising</h3>
          <p className="text-sm text-slate-400">
            Quarterly strategy calls to review portfolio performance and growth opportunities.
          </p>        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[
            { date: 'Feb 22, 2026', action: 'Completed monthly walkthrough', details: 'Units 2A, 3B, 4C - All in good condition' },
            { date: 'Feb 15, 2026', action: 'Resolved escalation', details: 'Heat issue in Unit 3B - Vendor contacted' },
            { date: 'Feb 10, 2026', action: 'Quarterly strategy call', details: 'Portfolio review and rent optimization discussion' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4 p-4 bg-slate-800/30 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-300">{item.action}</p>
                <p className="text-xs text-slate-500">{item.date}</p>
                <p className="text-sm text-slate-400 mt-1">{item.details}</p>
              </div>
            </div>
          ))}
        </div>      </div>

      <ComplianceFooter />
    </div>
  );
}
