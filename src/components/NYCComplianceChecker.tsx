import { useState, useCallback } from 'react';
import { 
  Search, 
  Building2, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Shield, 
  Loader2,
  RefreshCw,
  MapPin,
  FileWarning,
  Info,
  TrendingUp,
  TrendingDown,
  AlertOctagon,
  Home
} from 'lucide-react';
import { useNYCCompliance, useBuildingSearch } from '../hooks/useNYCCompliance';
import { 
  getViolationClassDescription, 
  getBoroughName,
  parseBBL,
  type ComplianceCheckResult 
} from '../services/nycOpenData';

interface NYCComplianceCheckerProps {
  initialBbl?: string;
  onComplianceCheck?: (result: ComplianceCheckResult) => void;
  showTitle?: boolean;
}

export function NYCComplianceChecker({ 
  initialBbl, 
  onComplianceCheck,
  showTitle = true 
}: NYCComplianceCheckerProps) {
  const [addressInput, setAddressInput] = useState('');
  const [bblInput, setBblInput] = useState(initialBbl || '');
  const [searchMode, setSearchMode] = useState<'address' | 'bbl'>(initialBbl ? 'bbl' : 'address');
  
  const { 
    data, 
    loading, 
    error, 
    refresh, 
    loadComplianceData 
  } = useNYCCompliance();
  
  const { 
    bbl: searchedBbl, 
    loading: searching, 
    error: searchError, 
    search, 
    clear 
  } = useBuildingSearch();

  const handleAddressSearch = useCallback(async () => {
    if (!addressInput.trim()) return;
    
    const result = await search(addressInput);
    if (result) {
      await loadComplianceData(result);
    }
  }, [addressInput, search, loadComplianceData]);

  const handleBBLCheck = useCallback(async () => {
    if (!bblInput.trim()) return;
    
    await loadComplianceData(bblInput);
  }, [bblInput, loadComplianceData]);

  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  // Notify parent when data changes
  const handleDataChange = useCallback((result: ComplianceCheckResult) => {
    if (onComplianceCheck) {
      onComplianceCheck(result);
    }
  }, [onComplianceCheck]);

  // Call parent callback when data is available
  if (data && !loading) {
    handleDataChange(data);
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/20 border-emerald-500/30';
    if (score >= 60) return 'bg-amber-500/20 border-amber-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-500/20 rounded-xl">
            <Building2 className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-100">NYC Compliance Checker</h2>
            <p className="text-slate-400 text-sm">Check HPD violations, rent stabilization status, and compliance score</p>
          </div>
        </div>
      )}

      {/* Search Mode Toggle */}
      <div className="flex gap-2 p-1 bg-slate-800/50 rounded-lg">
        <button
          onClick={() => setSearchMode('address')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            searchMode === 'address'
              ? 'bg-amber-500 text-slate-900'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Search by Address
        </button>
        <button
          onClick={() => setSearchMode('bbl')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            searchMode === 'bbl'
              ? 'bg-amber-500 text-slate-900'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Search by BBL
        </button>
      </div>

      {/* Search Input */}
      <div className="space-y-4">
        {searchMode === 'address' ? (
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                placeholder="Enter NYC address (e.g., 123 Main Street, Brooklyn)"
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
              />
            </div>
            <button
              onClick={handleAddressSearch}
              disabled={!addressInput.trim() || searching || loading}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-900 font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {searching || loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Check
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={bblInput}
                onChange={(e) => setBblInput(e.target.value)}
                placeholder="Enter BBL (Borough-Block-Lot, e.g., 1000010001)"
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                onKeyDown={(e) => e.key === 'Enter' && handleBBLCheck()}
              />
            </div>
            <button
              onClick={handleBBLCheck}
              disabled={!bblInput.trim() || loading}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-900 font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Check
                </>
              )}
            </button>
          </div>
        )}

        <p className="text-slate-500 text-xs">
          {searchMode === 'address' 
            ? 'Enter a full NYC street address. The system will look up the BBL and fetch compliance data.'
            : 'BBL format: 10 digits (1 borough + 5 block + 4 lot). Example: 1000010001 = Manhattan, Block 1, Lot 1'}
        </p>
      </div>

      {/* Error Display */}
      {(error || searchError) && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertOctagon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium">Error</p>
              <p className="text-slate-400 text-sm">{error || searchError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {data && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header with Refresh */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-100">{data.address}</h3>
              <p className="text-slate-400 text-sm">
                BBL: {data.bbl} • {(() => {
                  const parsed = parseBBL(data.bbl);
                  if (!parsed.success) return 'Unknown';
                  const borough = getBoroughName(parsed.data.borough);
                  return borough.success ? borough.data : 'Unknown';
                })()}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Compliance Score */}
          <div className={`${getScoreBg(data.complianceScore)} border rounded-xl p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Compliance Score</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-bold ${getScoreColor(data.complianceScore)}`}>
                    {data.complianceScore}
                  </span>
                  <span className="text-slate-500">/100</span>
                </div>
                <p className={`text-sm font-medium mt-1 ${getScoreColor(data.complianceScore)}`}>
                  {getScoreLabel(data.complianceScore)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-xs">Last Updated</p>
                <p className="text-slate-400 text-sm">
                  {new Date(data.lastUpdated).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Rent Stabilization */}
            <div className={`p-4 rounded-xl border ${
              data.rentStabilized 
                ? 'bg-amber-500/10 border-amber-500/30' 
                : 'bg-slate-800/50 border-slate-700'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {data.rentStabilized ? (
                  <Shield className="w-5 h-5 text-amber-400" />
                ) : (
                  <Shield className="w-5 h-5 text-slate-500" />
                )}
                <span className="text-slate-300 font-medium">Rent Stabilized</span>
              </div>
              <p className={`text-lg font-semibold ${
                data.rentStabilized ? 'text-amber-400' : 'text-slate-500'
              }`}>
                {data.rentStabilized ? 'Yes' : 'No'}
              </p>
              {data.rentStabilizationDetails?.unitsres && (
                <p className="text-slate-500 text-xs mt-1">
                  {data.rentStabilizationDetails.unitsres} residential units
                </p>
              )}
            </div>

            {/* Good Cause Protected */}
            <div className={`p-4 rounded-xl border ${
              data.goodCauseProtected 
                ? 'bg-emerald-500/10 border-emerald-500/30' 
                : 'bg-slate-800/50 border-slate-700'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {data.goodCauseProtected ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-slate-500" />
                )}
                <span className="text-slate-300 font-medium">Good Cause Protected</span>
              </div>
              <p className={`text-lg font-semibold ${
                data.goodCauseProtected ? 'text-emerald-400' : 'text-slate-500'
              }`}>
                {data.goodCauseProtected ? 'Protected' : 'Not Protected'}
              </p>
            </div>

            {/* Total Violations */}
            <div className={`p-4 rounded-xl border ${
              data.totalViolations > 0 
                ? 'bg-red-500/10 border-red-500/30' 
                : 'bg-emerald-500/10 border-emerald-500/30'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <FileWarning className={`w-5 h-5 ${
                  data.totalViolations > 0 ? 'text-red-400' : 'text-emerald-400'
                }`} />
                <span className="text-slate-300 font-medium">HPD Violations</span>
              </div>
              <p className={`text-lg font-semibold ${
                data.totalViolations > 0 ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {data.totalViolations}
              </p>
              <p className="text-slate-500 text-xs mt-1">
                {data.openViolations} open
              </p>
            </div>

            {/* Building Info */}
            <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-slate-500" />
                <span className="text-slate-300 font-medium">Building Info</span>
              </div>
              {data.buildingInfo ? (
                <>
                  <p className="text-slate-200 text-sm">
                    Built {data.buildingInfo.yearbuilt || 'N/A'}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    {data.buildingInfo.unitsres || '?'} units • {data.buildingInfo.numfloors || '?'} floors
                  </p>
                </>
              ) : (
                <p className="text-slate-500 text-sm">No building data available</p>
              )}
            </div>
          </div>

          {/* Violation Breakdown */}
          {data.totalViolations > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h4 className="text-slate-200 font-semibold mb-4">Violation Breakdown</h4>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-400">{data.classAViolations}</p>
                  <p className="text-slate-500 text-sm">Class A</p>
                  <p className="text-slate-600 text-xs">Non-hazardous</p>
                </div>
                <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-2xl font-bold text-amber-400">{data.classBViolations}</p>
                  <p className="text-slate-500 text-sm">Class B</p>
                  <p className="text-slate-600 text-xs">Hazardous</p>
                </div>
                <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-2xl font-bold text-red-400">{data.classCViolations}</p>
                  <p className="text-slate-500 text-sm">Class C</p>
                  <p className="text-slate-600 text-xs">Immediately Hazardous</p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Violations */}
          {data.hpdViolations.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <h4 className="text-slate-200 font-semibold">Recent HPD Violations</h4>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {data.hpdViolations.slice(0, 10).map((violation, index) => (
                  <div 
                    key={violation.violationid || index}
                    className="p-4 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                            violation.class === 'C' 
                              ? 'bg-red-500/20 text-red-400' 
                              : violation.class === 'B'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            Class {violation.class}
                          </span>
                          <span className="text-slate-500 text-xs">
                            {violation.violationid}
                          </span>
                          <span className={`text-xs ${
                            violation.violationstatus?.toLowerCase() === 'open'
                              ? 'text-red-400'
                              : 'text-emerald-400'
                          }`}>
                            {violation.violationstatus}
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm">
                          {violation.novdescription || violation.description || 'No description available'}
                        </p>
                        {violation.apartment && (
                          <p className="text-slate-500 text-xs mt-1">
                            Apt: {violation.apartment}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-slate-500 text-xs">
                          {violation.inspectiondate 
                            ? new Date(violation.inspectiondate).toLocaleDateString()
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {data.hpdViolations.length > 10 && (
                  <div className="p-3 text-center text-slate-500 text-sm border-t border-slate-700/50">
                    +{data.hpdViolations.length - 10} more violations
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DOB Violations */}
          {data.dobViolations.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <h4 className="text-slate-200 font-semibold">DOB Violations</h4>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {data.dobViolations.slice(0, 5).map((violation, index) => (
                  <div 
                    key={violation.violationnumber || index}
                    className="p-4 border-b border-slate-700/50 last:border-0"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-slate-300 text-sm">{violation.description}</p>
                        <p className="text-slate-500 text-xs mt-1">
                          {violation.violationtype} • {violation.violationcategory}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs ${
                          violation.status?.toLowerCase() === 'active'
                            ? 'text-red-400'
                            : 'text-emerald-400'
                        }`}>
                          {violation.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Violations Message */}
          {data.totalViolations === 0 && data.dobViolations.length === 0 && (
            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-6 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h4 className="text-emerald-400 font-semibold mb-2">No Violations Found</h4>
              <p className="text-slate-400 text-sm">
                This building has no recorded HPD or DOB violations. Great job maintaining compliance!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NYCComplianceChecker;
