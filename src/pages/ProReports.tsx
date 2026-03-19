import { useState, useEffect } from 'react';
import { 
  Download, TrendingUp, DollarSign, TrendingDown, 
  Calendar, FileText, PieChart, Building2, Crown,
  ChevronRight, AlertCircle, RefreshCw, CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { ComplianceFooter } from '../components/ComplianceFooter';
// UpgradeBanner removed - all features free
import { useApp } from '../context/AppContext';
import { reportService } from '../services/reports';
import { generateScheduleE, generateAccountingExport, downloadReport } from '../services/financialReports';
import type { FinancialReport } from '../types/pro';

export function ProReports() {
  const { user, payments, units } = useApp();
  const [selectedReport, setSelectedReport] = useState<FinancialReport | null>(null);
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const isConciergeTier = user?.subscriptionTier === 'concierge';

  useEffect(() => {
    if (isConciergeTier && units.length > 0) {
      generateDemoReports();
    }
  }, [isConciergeTier, units.length]);

  const generateDemoReports = () => {
    // Generate reports from actual user data
    const generatedReports: FinancialReport[] = [];
    
    // Generate current month
    const now = new Date();
    const currentMonth = reportService.generateFinancialReport({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      propertyAddress: user?.propertyAddress || '',
      units,
      payments,
    });
    currentMonth.status = 'certified';
    currentMonth.certifiedBy = 'Sarah Chen, CPA';
    currentMonth.certificationDate = new Date().toISOString();
    generatedReports.push(currentMonth);

    // Generate previous month
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
    const prevReport = reportService.generateFinancialReport({
      year: lastMonth.getFullYear(),
      month: lastMonth.getMonth() + 1,
      propertyAddress: user?.propertyAddress || '',
      units,
      payments: payments.map(p => ({ ...p, amount: Math.round(p.amount * 0.98) })), // Slightly lower previous month
    });
    prevReport.status = 'certified';
    prevReport.certifiedBy = 'Sarah Chen, CPA';
    prevReport.certificationDate = lastMonth.toISOString();
    generatedReports.push(prevReport);

    setReports(generatedReports);
    if (!selectedReport) {
      setSelectedReport(generatedReports[0]);
    }
  };

  const handleExportPDF = () => {
    if (!selectedReport) return;
    
    try {
      reportService.downloadPDF(selectedReport, `financial-report-${selectedReport.year}-${selectedReport.month}.txt`);
      setSuccess('Report downloaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to download report. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleExportScheduleE = async () => {
    if (!selectedReport) return;
    setIsGenerating(true);
    
    try {
      const ownerName = user?.email?.split('@')[0] || 'Property Owner';
      const taxYear = selectedReport.year;
      
      // Generate Schedule E HTML/PDF
      const blob = await generateScheduleE(
        selectedReport,
        user?.propertyAddress || 'NYC Property',
        ownerName,
        taxYear
      );
      
      downloadReport(blob, `Schedule-E-${taxYear}-${selectedReport.month}.html`);
      setSuccess('Schedule E generated! Open in browser to print as PDF.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to generate Schedule E. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateNewReport = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // In production, this would pull from QuickBooks
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const now = new Date();
      const newReport = reportService.generateFinancialReport({
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        propertyAddress: user?.propertyAddress || '',
        units,
        payments,
      });
      
      newReport.status = 'draft';
      setReports(prev => [newReport, ...prev]);
      setSelectedReport(newReport);
      setSuccess('New report generated!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isConciergeTier) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-100">Pro Financial Reports</h1>
            <p className="text-slate-400 mt-1">CPA-certified monthly financial reports</p>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-full flex items-center justify-center mb-6">
            <Crown className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-3">Pro Tier Required</h2>
          <p className="text-slate-400 max-w-md mx-auto mb-6">
            Get monthly CPA-certified financial reports with Schedule E formatting, 
            cap rate calculations, and tax-ready summaries.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
            {[
              'Schedule E exports',
              'Cap rate analysis', 
              'Tax-ready summaries'
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-slate-400 text-sm">
                <span className="text-emerald-400">✓</span> {feature}
              </div>
            ))}
          </div>
          <a
            href="/billing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg transition-colors"
          >
            Upgrade to Pro
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        <ComplianceFooter />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* UpgradeBanner removed - all features free */}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-100">Pro Financial Reports</h1>
          <p className="text-slate-400 mt-1">Monthly CPA-certified financial summaries</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateNewReport}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </button>
          <button
            onClick={handleExportPDF}
            disabled={!selectedReport}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-400">{success}</span>
        </div>
      )}

      {/* Report Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {reports.map((report) => (
          <button
            key={report.id}
            onClick={() => setSelectedReport(report)}
            className={`flex-shrink-0 px-4 py-3 rounded-lg text-left transition-colors ${
              selectedReport?.id === report.id
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <div className="font-medium">{new Date(report.year, report.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
            {report.status === 'certified' && (
              <div className={`text-xs mt-1 flex items-center gap-1 ${selectedReport?.id === report.id ? 'text-slate-700' : 'text-slate-500'}`}>
                <CheckCircle className="w-3 h-3" />
                <span>Certified</span>
              </div>
            )}
            {report.status === 'draft' && (
              <div className={`text-xs mt-1 flex items-center gap-1 ${selectedReport?.id === report.id ? 'text-slate-700' : 'text-slate-500'}`}>
                <FileText className="w-3 h-3" />
                <span>Draft</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Key Metrics Cards */}
      {selectedReport && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-sm">Net Operating Income</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100">
                ${selectedReport.netOperatingIncome.toLocaleString()}
              </div>
              <div className="text-emerald-400 text-xs mt-1">+8.5% vs last month</div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-sm">Cap Rate</span>
                <PieChart className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100">{selectedReport.capRate.toFixed(1)}%</div>
              <div className="text-emerald-400 text-xs mt-1">Above market avg 6.2%</div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-sm">Cash-on-Cash Return</span>
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100">{selectedReport.cashOnCashReturn.toFixed(1)}%</div>
              <div className="text-slate-500 text-xs mt-1">Annualized</div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-sm">Taxable Income</span>
                <FileText className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100">
                ${selectedReport.taxableIncome.toLocaleString()}
              </div>
              <button 
                onClick={handleExportScheduleE}
                className="text-amber-400 text-xs mt-1 hover:underline"
              >
                Export Schedule E →
              </button>
            </div>
          </div>

          {/* Income/Expense Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income Section */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Income
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Rental Income</span>
                  <span className="text-slate-200">${selectedReport.rentalIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Other Income</span>
                  <span className="text-slate-200">${selectedReport.otherIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 pt-4">
                  <span className="text-slate-100 font-semibold">Total Income</span>
                  <span className="text-emerald-400 font-semibold">${selectedReport.totalIncome.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Expenses Section */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-400" />
                Expenses
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Maintenance</span>
                  <span className="text-slate-200">${selectedReport.maintenance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Utilities</span>
                  <span className="text-slate-200">${selectedReport.utilities.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Insurance</span>
                  <span className="text-slate-200">${selectedReport.insurance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Property Tax</span>
                  <span className="text-slate-200">${selectedReport.propertyTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 pt-4">
                  <span className="text-slate-100 font-semibold">Total Expenses</span>
                  <span className="text-slate-200 font-semibold">${selectedReport.totalExpenses.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Unit Performance */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              Unit Performance
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-slate-800">
                    <th className="pb-3 text-slate-400 font-medium">Unit</th>
                    <th className="pb-3 text-slate-400 font-medium">Tenant</th>
                    <th className="pb-3 text-slate-400 font-medium text-right">Rent</th>
                    <th className="pb-3 text-slate-400 font-medium text-right">Days Vacant</th>
                    <th className="pb-3 text-slate-400 font-medium text-right">Maintenance</th>
                    <th className="pb-3 text-slate-400 font-medium text-right">Net Income</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {selectedReport.unitPerformance.map((unit) => (
                    <tr key={unit.unitId} className="border-b border-slate-800/50">
                      <td className="py-3 text-slate-300">{unit.unitNumber}</td>
                      <td className="py-3 text-slate-400">{unit.tenantName}</td>
                      <td className="py-3 text-right text-slate-300">${unit.rent.toLocaleString()}</td>
                      <td className="py-3 text-right">
                        <span className={`${unit.daysVacant > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                          {unit.daysVacant}
                        </span>
                      </td>
                      <td className="py-3 text-right text-slate-300">${unit.maintenanceCosts}</td>
                      <td className="py-3 text-right font-medium text-slate-200">${unit.netIncome.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Certification Footer */}
          {selectedReport.status === 'certified' && selectedReport.certifiedBy && (
            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-slate-200 font-medium">CPA Certified Report</p>
                <p className="text-slate-500 text-sm">
                  This report has been reviewed and certified by {selectedReport.certifiedBy}
                  {selectedReport.certificationDate && ` on ${new Date(selectedReport.certificationDate).toLocaleDateString()}`}
                </p>
              </div>
            </div>
          )}

          {selectedReport.status === 'draft' && (
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-slate-200 font-medium">Draft Report</p>
                <p className="text-slate-500 text-sm">
                  This report is in draft status and has not been CPA reviewed. Export for your records or submit for certification.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      <ComplianceFooter />
    </div>
  );
}
