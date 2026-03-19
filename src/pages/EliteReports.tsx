import { Shield, FileText, TrendingUp, Star, Download, CheckCircle } from 'lucide-react';
import { ComplianceFooter } from '../components/ComplianceFooter';
import { useApp } from '../context/AppContext';

export function EliteReports() {
  const { user } = useApp();

  if (user?.subscriptionTier !== 'concierge') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-100">Elite Reports</h1>
          <p className="text-slate-400 mt-1">Premium reports with professional oversight</p>
        </div>
        
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
          <Shield className="w-16 h-16 text-amber-500/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-200 mb-2">Concierge Tier Feature</h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Exclusive reports including professional opinion letters, attorney-reviewed lease templates, 
            and annual property valuations prepared by certified real estate professionals.
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

  const reports = [
    {
      id: 1,
      title: 'Annual Property Valuation',
      date: '2026-01-15',
      type: 'valuation',
      status: 'available',
      description: 'Comprehensive property valuation based on comparable sales, income approach, and market analysis.',
      preparedBy: 'Sarah Chen, Licensed RE Professional',
    },
    {
      id: 2,
      title: 'Annual Property Valuation',
      date: '2025-01-15',
      type: 'valuation',
      status: 'available',
      description: 'Previous year valuation with year-over-year comparison.',
      preparedBy: 'Sarah Chen, Licensed RE Professional',
    },
    {
      id: 3,
      title: 'Rent Optimization Analysis',
      date: '2026-02-01',
      type: 'analysis',
      status: 'available',
      description: 'Professional opinion on current rents vs. market rates with specific recommendations.',
      preparedBy: 'Sarah Chen, Licensed RE Professional',
    },
    {
      id: 4,
      title: 'Q1 2026 Portfolio Report',
      date: '2026-04-01',
      type: 'quarterly',
      status: 'generating',
      description: 'Quarterly performance review with manager insights and recommendations.',
      preparedBy: 'In Progress',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-slate-100">Elite Reports</h1>
        <p className="text-slate-400 mt-1">Premium reports with professional oversight</p>
      </div>

      {/* Elite Reports Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="p-3 bg-amber-900/30 rounded-lg w-fit mb-4">
            <TrendingUp className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">Annual Valuation</h3>
          <p className="text-sm text-slate-400 mb-4">
            Comprehensive property valuation prepared annually by a licensed real estate professional.
          </p>
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            <span>Last updated: Jan 2026</span>
          </div>        </div>
        
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="p-3 bg-amber-900/30 rounded-lg w-fit mb-4">
            <FileText className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">Professional Opinions</h3>
          <p className="text-sm text-slate-400 mb-4">
            Written opinions on rent optimization, market positioning, and investment strategy.
          </p>
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            <span>2 reports available</span>
          </div>        </div>
        
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="p-3 bg-amber-900/30 rounded-lg w-fit mb-4">
            <Star className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">Quarterly Reviews</h3>
          <p className="text-sm text-slate-400 mb-4">
            Portfolio performance reviews with manager insights and growth recommendations.
          </p>
          <div className="flex items-center gap-2 text-sm text-amber-400">
            <div className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />            <span>Q1 report generating...</span>
          </div>        </div>
      </div>

      {/* Reports List */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Available Reports</h3>
        
        <div className="space-y-4">
          {reports.map((report) => (
            <div 
              key={report.id} 
              className={`p-4 rounded-lg border ${
                report.status === 'generating' 
                  ? 'bg-slate-800/20 border-slate-700' 
                  : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-slate-200">{report.title}</h4>
                    {report.status === 'generating' && (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                        Generating
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-slate-400 mb-2">{report.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span>Prepared: {new Date(report.date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {report.preparedBy}
                    </span>                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {report.status === 'available' ? (
                    <>
                      <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">
                        <Download className="w-4 h-4" />
                        PDF
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">
                        View
                      </button>                    </>
                  ) : (
                    <span className="text-sm text-slate-500">Available March 31</span>
                  )}
                </div>              </div>
            </div>
          ))}
        </div>      </div>

      {/* Certification Notice */}
      <div className="bg-gradient-to-r from-amber-900/20 to-slate-900/50 border border-amber-500/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500/20 rounded-lg flex-shrink-0">
            <Shield className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-400 mb-2">Professional Certification</h3>            <p className="text-sm text-slate-400">
              All Elite reports are prepared or reviewed by licensed real estate professionals 
              with 5+ years of experience in NYC property management. Reports include professional 
              opinions that may be used for lending, tax purposes, and investment analysis.
            </p>          </div>
        </div>      </div>

      <ComplianceFooter />
    </div>
  );
}
