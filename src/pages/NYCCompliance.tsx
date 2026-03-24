import { useState } from 'react';
import { 
  Scale, Building, DollarSign, Shield, AlertTriangle, 
  FileText, CheckCircle, XCircle, Info, Download,
  Search, RefreshCw, ExternalLink
} from 'lucide-react';
import { ComplianceFooter } from '../components/ComplianceFooter';
import { NYCComplianceChecker } from '../components/NYCComplianceChecker';
import { useApp } from '../context/AppContext';
import { 
  DEFAULT_NYC_LATE_FEE_CONFIG, 
  DEFAULT_NYC_SECURITY_DEPOSIT_LIMIT,
  FARE_ACT_REQUIRED_LANGUAGE,
  GOOD_CAUSE_PROTECTED_MESSAGE 
} from '../types';
import type { ComplianceCheckResult } from '../services/nycOpenData';

export function NYCCompliance() {
  const { leases, units } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'auto-check' | 'fare' | 'good-cause' | 'late-fees' | 'deposits' | 'lead-paint'>('overview');
  const [lastComplianceCheck, setLastComplianceCheck] = useState<ComplianceCheckResult | null>(null);

  // Calculate compliance metrics
  const totalUnits = units.length;
  const rentStabilizedCount = units.filter(u => u.notes?.includes('rent-stabilized')).length;
  
  const leaseCompliance = leases.map(lease => {
    const unit = units.find(u => u.id === lease.unitId);
    const securityDepositValid = (lease.securityDeposit || 0) <= (lease.rentAmount * DEFAULT_NYC_SECURITY_DEPOSIT_LIMIT);
    
    return {
      lease,
      unit,
      securityDepositValid,
      lateFeeValid: true, // Would check against actual late fees applied
    };
  });

  const complianceIssues = leaseCompliance.filter(l => !l.securityDepositValid).length;

  const handleComplianceCheck = (result: ComplianceCheckResult) => {
    setLastComplianceCheck(result);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Scale },
    { id: 'auto-check', label: 'Auto-Check', icon: Search },
    { id: 'fare', label: 'FARE Act', icon: Shield },
    { id: 'good-cause', label: 'Good Cause', icon: Building },
    { id: 'late-fees', label: 'Late Fees', icon: DollarSign },
    { id: 'deposits', label: 'Security Deposits', icon: DollarSign },
    { id: 'lead-paint', label: 'Lead Paint', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-100">NYC Compliance Center</h1>
          <p className="text-slate-400 mt-1">Stay compliant with NYC housing laws</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-sm font-medium rounded-full">
            NYC Edition
          </span>
          <a 
            href="https://data.cityofnewyork.us" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm rounded-full transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            NYC Open Data
          </a>
        </div>
      </div>

      {/* Compliance Status Banner */}
      {complianceIssues > 0 ? (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium">{complianceIssues} Compliance {complianceIssues === 1 ? 'Issue' : 'Issues'} Detected</p>
              <p className="text-slate-400 text-sm">Review the Security Deposits tab for details</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 font-medium">All Compliance Checks Passed</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <p className="text-slate-500 text-sm">Total Units</p>
              <p className="text-2xl font-bold text-slate-100">{totalUnits}</p>
            </div>
            
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <p className="text-slate-500 text-sm">Rent Stabilized</p>
              <p className="text-2xl font-bold text-amber-400">{rentStabilizedCount}</p>
            </div>
            
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <p className="text-slate-500 text-sm">Active Leases</p>
              <p className="text-2xl font-bold text-slate-100">{leases.length}</p>
            </div>
            
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <p className="text-slate-500 text-sm">Compliance Score</p>
              <p className="text-2xl font-bold text-emerald-400">{totalUnits > 0 ? Math.round(((totalUnits - complianceIssues) / totalUnits) * 100) : 100}%</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveTab('auto-check')}
                className="flex items-center gap-3 p-4 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors text-left"
              >
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Search className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-slate-200 font-medium">Auto-Check Compliance</p>
                  <p className="text-slate-500 text-sm">Look up violations by address</p>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('fare')}
                className="flex items-center gap-3 p-4 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors text-left"
              >
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-slate-200 font-medium">FARE Act</p>
                  <p className="text-slate-500 text-sm">Criminal history compliance</p>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('good-cause')}
                className="flex items-center gap-3 p-4 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors text-left"
              >
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Building className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-slate-200 font-medium">Good Cause Eviction</p>
                  <p className="text-slate-500 text-sm">Tenant protection status</p>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Key NYC Compliance Requirements</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-slate-200 font-medium">FARE Act</p>
                  <p className="text-slate-400 text-sm">Cannot consider criminal history in housing decisions</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Building className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-slate-200 font-medium">Good Cause Eviction</p>
                  <p className="text-slate-400 text-sm">Tenant protections for lease renewals and lease termination</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-slate-200 font-medium">Late Fee Limits</p>
                  <p className="text-slate-400 text-sm">Max $50 or 5% of rent (5-day grace period required)</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-slate-200 font-medium">Security Deposits</p>
                  <p className="text-slate-400 text-sm">Maximum 1 month rent</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Check Tab */}
      {activeTab === 'auto-check' && (
        <div className="space-y-6">
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-400 font-medium">NYC Open Data Integration</p>
                <p className="text-slate-400 text-sm">
                  This tool connects directly to NYC Open Data to retrieve real-time HPD violations, 
                  rent stabilization status, and building code violations. Data is pulled from public 
                  records and updated regularly by the city.
                </p>
                <ul className="list-disc list-inside text-slate-400 text-sm mt-2 space-y-1">
                  <li>HPD Violations: Housing Maintenance Code violations</li>
                  <li>DOB Violations: Building code violations</li>
                  <li>Rent Stabilization: Tax lot registration status</li>
                  <li>Good Cause Eligibility: Automatic calculation based on building data</li>
                </ul>
              </div>
            </div>
          </div>

          <NYCComplianceChecker 
            onComplianceCheck={handleComplianceCheck}
            showTitle={false}
          />

          {/* Integration Note */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <RefreshCw className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-300 font-medium">Data Sources</p>
                <p className="text-slate-400 text-sm">
                  Data provided by NYC Open Data (data.cityofnewyork.us). Rate limit: 1,000 requests/hour. 
                  Results are cached for 5 minutes to improve performance.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <a 
                    href="https://data.cityofnewyork.us/Housing-Development/Housing-Maintenance-Code-Violations/wvxf-dwi5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                  >
                    HPD Violations Dataset
                  </a>
                  <a 
                    href="https://data.cityofnewyork.us/Housing-Development/Rent-Stabilized-Building-List/tesw-ay5e"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                  >
                    Rent Stabilization Dataset
                  </a>
                  <a 
                    href="https://data.cityofnewyork.us/Housing-Development/DOB-Violations/3h2n-5cm9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                  >
                    DOB Violations Dataset
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FARE Act Tab */}
      {activeTab === 'fare' && (
        <div className="space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Fair Access to Rental Housing (FARE) Act</h3>
            <p className="text-slate-400 mb-6">
              Effective June 30, 2023, NYC landlords cannot consider an applicant's 
              criminal history during the housing application process.
            </p>
            
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-400 font-medium mb-2">Required Disclosure Language</p>
              <textarea 
                readOnly 
                className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-300 text-sm resize-none"
                value={FARE_ACT_REQUIRED_LANGUAGE}
              />
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <input type="checkbox" className="w-5 h-5 accent-amber-500" />
              <span className="text-slate-200">I have reviewed and implemented FARE Act compliance policies</span>
            </div>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              Download FARE Act Disclosure Template
            </button>
          </div>
          
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-300 text-sm">
                  <strong>Did you know?</strong> The FARE Act also prohibits landlords from 
                  requiring background checks. The Bot already handles this by:
                </p>
                <ul className="list-disc list-inside text-slate-400 text-sm mt-2 space-y-1">
                  <li>Not asking about criminal history in screening</li>
                  <li>Focusing on income verification and references</li>
                  <li>Fair Housing Act compliance</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Good Cause Tab */}
      {activeTab === 'good-cause' && (
        <div className="space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Good Cause Eviction Protection</h3>
            
            <p className="text-slate-400 mb-4">
              Tenants in covered units cannot be evicted or have their lease 
              non-renewed without "good cause" as defined by law.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
                <h4 className="text-emerald-400 font-medium mb-2">Protected Tenants</h4>
                <ul className="text-slate-400 text-sm space-y-2">
                  <li>✓ Rent &lt; $5,842/month (2025 threshold)</li>
                  <li>✓ Not owner-occupied building &lt; 10 units</li>
                  <li>✓ Not temporary/short term</li>
                  <li>✓ Not commercial use</li>
                </ul>
              </div>
              
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <h4 className="text-red-400 font-medium mb-2">Valid Reasons for Eviction</h4>
                <ul className="text-slate-400 text-sm space-y-2">
                  <li>• Nonpayment of rent</li>
                  <li>• Violation of lease terms</li>
                  <li>• Nuisance or damage to property</li>
                  <li>• Illegal activity</li>
                  <li>• Landlord intends to occupy</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <p className="text-sm text-amber-400 font-medium mb-2">Required Notice Language</p>
              <textarea 
                readOnly 
                className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-300 text-sm resize-none"
                value={GOOD_CAUSE_PROTECTED_MESSAGE}
              />
            </div>
          </div>
        </div>
      )}

      {/* Late Fees Tab */}
      {activeTab === 'late-fees' && (
        <div className="space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">NYC Late Fee Compliance</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
                <p className="text-slate-500 text-sm">Maximum Flat Fee</p>
                <p className="text-2xl font-bold text-emerald-400">$50</p>
              </div>
              
              <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
                <p className="text-slate-500 text-sm">Maximum Percentage</p>
                <p className="text-2xl font-bold text-emerald-400">5%</p>
              </div>
              
              <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
                <p className="text-slate-500 text-sm">Minimum Grace Period</p>
                <p className="text-2xl font-bold text-emerald-400">5 Days</p>
              </div>
            </div>
            
            <p className="text-slate-400 text-sm mb-4">
              Current settings: {DEFAULT_NYC_LATE_FEE_CONFIG.flatFee === 50 && DEFAULT_NYC_LATE_FEE_CONFIG.percentageFee === 5 ? 
                '<span className="text-emerald-400 font-medium">✓ Compliant</span>' : 
                '<span className="text-red-400 font-medium">⚠ Non-compliant</span>'}
            </p>
            
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm"><strong>NYC Admin Code §27-2155:</strong> No late fee shall exceed the lesser of $50 or five percent (5%) of the rent due. A landlord must provide a minimum five-day grace period before imposing a late fee.</p>
            </div>
          </div>
        </div>
      )}

      {/* Security Deposits Tab */}
      {activeTab === 'deposits' && (
        <div className="space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Security Deposit Compliance</h3>
            
            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4 mb-6">
              <p className="text-slate-500 text-sm">NYC Maximum</p>
              <p className="text-2xl font-bold text-emerald-400">1 Month Rent</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 text-slate-400">Unit</th>
                    <th className="text-right py-3 text-slate-400">Monthly Rent</th>
                    <th className="text-right py-3 text-slate-400">Deposit Collected</th>
                    <th className="text-right py-3 text-slate-400">Limit (1x Rent)</th>
                    <th className="text-right py-3 text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {leaseCompliance.map(({ lease, unit, securityDepositValid }) => (
                    <tr key={lease.id} className="border-b border-slate-800/50">
                      <td className="py-3 text-slate-300">{unit?.unitNumber}</td>
                      <td className="py-3 text-right text-slate-300">${lease.rentAmount.toLocaleString()}</td>
                      <td className="py-3 text-right text-slate-300">${lease.securityDeposit?.toLocaleString() || 0}</td>
                      <td className="py-3 text-right text-slate-400">${lease.rentAmount.toLocaleString()}</td>
                      <td className="py-3 text-right">
                        {securityDepositValid ? (
                          <span className="text-emerald-400">✓ Compliant</span>
                        ) : (
                          <span className="text-red-400">⚠ Over Limit</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 bg-slate-800/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm"><strong>NYC General Obligations Law §7-108:</strong> Security deposits cannot exceed one month rent. Deposits must be held in trust and returned within 14 days of lease termination.</p>
            </div>
          </div>
        </div>
      )}

      {/* Lead Paint Tab */}
      {activeTab === 'lead-paint' && (
        <div className="space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Lead Paint Disclosure</h3>
            
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-medium">Required for Pre-1978 Buildings</p>
                  <p className="text-slate-400 text-sm">
                    Federal law requires landlords to disclose known lead-based paint hazards 
                    before a tenant signs a lease.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <span className="text-slate-200">Property built before 1978?</span>
                <select className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200">
                  <option>Select...</option>
                  <option value="yes">Yes - Lead disclosure required</option>
                  <option value="no">No - After 1978</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <span className="text-slate-200">Lead disclosure given to all tenants?</span>
                <input type="checkbox" className="w-5 h-5 accent-amber-500" />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <span className="text-slate-200">EPA pamphlet provided?</span>
                <input type="checkbox" className="w-5 h-5 accent-amber-500" />
              </div>
            </div>
            
            <div className="mt-6">
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors">
                <Download className="w-4 h-4" />
                Download Lead Paint Disclosure Form
              </button>
            </div>
          </div>
        </div>
      )}

      <ComplianceFooter />
    </div>
  );
}

export default NYCCompliance;
