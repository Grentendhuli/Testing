import { Camera, CheckCircle, Clock, MapPin, AlertCircle } from 'lucide-react';
import { ComplianceFooter } from '../components/ComplianceFooter';
import { useApp } from '../context/AppContext';

export function Walkthroughs() {
  const { user } = useApp();

  if (user?.subscriptionTier !== 'concierge') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-100">Walkthroughs</h1>
          <p className="text-slate-400 mt-1">Monthly on-site property inspections</p>
        </div>
        
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
          <Camera className="w-16 h-16 text-amber-500/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-200 mb-2">Elite Tier Feature</h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Monthly on-site walkthroughs with photo documentation, condition reports, 
            and maintenance recommendations from your dedicated manager.
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

  const walkthroughs = [
    {
      id: 1,
      date: '2026-02-15',
      status: 'completed',
      units: ['2A', '3B', '4C'],
      summary: 'All units in good condition. Minor wear noted in 3B.',
      photos: 24,
      issues: 0,
    },
    {
      id: 2,
      date: '2026-01-18',
      status: 'completed',
      units: ['2A', '3B', '4C'],
      summary: 'Excellent condition. No issues reported.',
      photos: 22,
      issues: 0,
    },
    {
      id: 3,
      date: '2026-03-20',
      status: 'scheduled',
      units: ['2A', '3B', '4C'],
      summary: 'Pending',
      photos: 0,
      issues: 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-100">Walkthroughs</h1>
          <p className="text-slate-400 mt-1">Monthly on-site property inspections with photo documentation</p>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-900/30 border border-amber-500/30 rounded-lg text-amber-400 text-sm">
          <Clock className="w-4 h-4" />
          <span>Next: March 20, 2026</span>
        </div>
      </div>

      {/* Upcoming Walkthrough */}
      <div className="bg-gradient-to-r from-amber-900/20 to-slate-900/50 border border-amber-500/30 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Camera className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="font-semibold text-amber-400">Upcoming Walkthrough</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-slate-500 mb-1">Date & Time</p>
            <p className="text-slate-200">Thursday, March 20, 2026</p>
            <p className="text-sm text-slate-400">10:00 AM - 12:00 PM</p>
          </div>
          
          <div>
            <p className="text-sm text-slate-500 mb-1">Units to Inspect</p>
            <p className="text-slate-200">2A, 3B, 4C</p>
            <p className="text-sm text-slate-400">3 units • Estimated 45 min each</p>
          </div>
          
          <div>
            <p className="text-sm text-slate-500 mb-1">Manager</p>
            <p className="text-slate-200">Sarah Chen</p>
            <p className="text-sm text-slate-400">Your Elite Manager</p>
          </div>
        </div>
      </div>

      {/* Walkthrough History */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Walkthrough History</h3>
        
        <div className="space-y-4">
          {walkthroughs.map((wt) => (
            <div 
              key={wt.id} 
              className={`p-4 rounded-lg border ${
                wt.status === 'scheduled' 
                  ? 'bg-amber-900/10 border-amber-500/30' 
                  : 'bg-slate-800/30 border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-slate-200 font-medium">
                      {new Date(wt.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                    {wt.status === 'completed' ? (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Completed
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                        Scheduled
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Units: {wt.units.join(', ')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Camera className="w-4 h-4" />
                      {wt.photos} photos
                    </span>                  </div>
                </div>
                
                {wt.status === 'completed' && (
                  <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors">
                    View Report
                  </button>
                )}
              </div>
              
              <p className="text-sm text-slate-400">{wt.summary}</p>
              
              {wt.issues > 0 && (
                <div className="mt-3 flex items-center gap-2 text-sm text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                  {wt.issues} maintenance {wt.issues === 1 ? 'issue' : 'issues'} identified
                </div>
              )}
            </div>
          ))}
        </div>      </div>

      <ComplianceFooter />
    </div>
  );
}
