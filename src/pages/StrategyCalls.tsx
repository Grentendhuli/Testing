import { CalendarCheck, Video, Clock, CheckCircle, UserCheck } from 'lucide-react';
import { ComplianceFooter } from '../components/ComplianceFooter';
import { useApp } from '../context/AppContext';

export function StrategyCalls() {
  const { user } = useApp();

  if (user?.subscriptionTier !== 'concierge') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-100">Strategy Calls</h1>
          <p className="text-slate-400 mt-1">Quarterly portfolio strategy sessions</p>
        </div>
        
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
          <CalendarCheck className="w-16 h-16 text-amber-500/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-200 mb-2">Elite Tier Feature</h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Quarterly 1-hour strategy calls with your dedicated property manager 
            to review portfolio performance, discuss rent optimization, and plan improvements.
          </p>
          <a 
            href="/billing" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg transition-colors"
          >
            Upgrade to Elite
          </a>
        </div>
        
        <ComplianceFooter />
      </div>
    );
  }

  const calls = [
    {
      id: 1,
      date: '2026-02-10',
      duration: '60 min',
      status: 'completed',
      topics: ['Portfolio performance review', 'Rent optimization', 'Upcoming lease renewals'],
      notes: 'Recommended 3% annual rent increase. Discussed renovation ROI strategy.',
    },
    {
      id: 2,
      date: '2026-05-15',
      duration: '60 min',
      status: 'scheduled',
      topics: ['TBD'],
      notes: 'Quarterly strategy session',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-slate-100">Strategy Calls</h1>
        <p className="text-slate-400 mt-1">Quarterly portfolio strategy sessions with your Elite Manager</p>
      </div>

      {/* Upcoming Call */}
      <div className="bg-gradient-to-r from-amber-900/20 to-slate-900/50 border border-amber-500/30 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Video className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="font-semibold text-amber-400">Upcoming Strategy Call</h3>
        </div>        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-slate-500 mb-1">Date</p>
            <p className="text-slate-200">Thursday, May 15, 2026</p>
          </div>
          
          <div>
            <p className="text-sm text-slate-500 mb-1">Time</p>
            <p className="text-slate-200">2:00 PM EST</p>
          </div>
          
          <div>
            <p className="text-sm text-slate-500 mb-1">Duration</p>
            <p className="text-slate-200">60 minutes</p>
          </div>
          
          <div>
            <p className="text-sm text-slate-500 mb-1">With</p>
            <p className="text-slate-200">Sarah Chen</p>
          </div>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium rounded-lg transition-colors">
            Join Zoom Call
          </button>
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">
            Reschedule
          </button>          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">
            Add Agenda Items
          </button>
        </div>
      </div>

      {/* Call History */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Call History</h3>
        
        <div className="space-y-4">
          {calls.filter(c => c.status === 'completed').map((call) => (
            <div key={call.id} className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-slate-200 font-medium">
                    {new Date(call.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Completed
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <Clock className="w-4 h-4" />
                  {call.duration}
                </div>
              </div>
              
              <div className="mb-3">
                <p className="text-sm text-slate-500 mb-2">Discussion Topics:</p>
                <div className="flex flex-wrap gap-2">
                  {call.topics.map((topic, i) => (
                    <span key={i} className="px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded-full">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <p className="text-sm text-slate-500 mb-1">Notes:</p>
                <p className="text-sm text-slate-400">{call.notes}</p>
              </div>            </div>
          ))}
        </div>      </div>

      {/* Suggested Topics */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserCheck className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold text-slate-200">Suggested Discussion Topics</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            'Portfolio performance review',
            'Rent optimization analysis',
            'Upcoming lease renewals',
            'Maintenance & improvement planning',
            'Market trends & comparable rents',
            'Tax strategy & deductions',
          ].map((topic) => (
            <div key={topic} className="flex items-center gap-2 p-3 bg-slate-800/30 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-sm text-slate-400">{topic}</span>
            </div>
          ))}
        </div>      </div>

      <ComplianceFooter />
    </div>
  );
}
