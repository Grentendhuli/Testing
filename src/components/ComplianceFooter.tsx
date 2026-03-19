import { ShieldCheck, Scale, Phone } from 'lucide-react';

export function ComplianceFooter() {
  return (
    <footer className="mt-8 pt-6 border-t border-slate-800">
      <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 p-2 bg-emerald-900/30 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-200">NYC Housing Law Compliant</h4>
            <p className="text-sm text-slate-400 mt-1">
              This bot is trained on NYC tenant rights, FARE Act, and fair housing law.
              For legal questions, consult an attorney or visit{' '}
              <a
                href="https://nyc.gov/housing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 underline"
              >
                nyc.gov/housing
              </a>
              .
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-400">
          <div className="flex items-start gap-2">
            <Scale className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-500" />
            <span>
              <strong className="text-slate-300">Fair Housing Statement:</strong> We don't collect
              race, national origin, family status, source of income, or disability.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Phone className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-500" />
            <span>
              <strong className="text-slate-300">Emergency?</strong> Contact your landlord immediately for heat/water issues.
              Call 911 for immediate danger.
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-slate-500">
          <div>
            <span className="font-medium text-slate-400">Disclaimer:</span> This is not legal advice.
            Escalation: Lease disputes and legal questions are reviewed by you personally.
          </div>
          <div className="flex items-center gap-4">
            <a href="/terms" className="text-slate-500 hover:text-amber-400 transition-colors">Terms of Service</a>
            <span className="text-slate-700">|</span>
            <a href="/privacy" className="text-slate-500 hover:text-amber-400 transition-colors">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
