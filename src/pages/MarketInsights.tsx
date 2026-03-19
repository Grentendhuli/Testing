import { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, MapPin, DollarSign, 
  Calendar, ArrowRight, Building2, Crown, Gauge,
  AlertTriangle, CheckCircle, Loader2, Info,
  Search, Calculator, BarChart3, Target
} from 'lucide-react';
import { ComplianceFooter } from '../components/ComplianceFooter';
import { RentEstimator } from '../components/RentEstimator';
import { ComparableRentals } from '../components/ComparableRentals';
import { useApp } from '../context/AppContext';
import { analyzeRent, isRentAnalysisConfigured, RentAnalysis } from '../services/rentAnalysis';
import { 
  getMarketTrends, 
  analyzeRentGap,
  getZillowStatus,
  ZillowMarketTrends,
  RentGapAnalysis
} from '../services/zillow';
import type { MarketInsight, ComparableRent } from '../types/pro';

// Transform RentAnalysis to MarketInsight format
function transformRentAnalysisToInsight(
  analysis: RentAnalysis, 
  unitId: string, 
  unitNumber: string,
  currentRent: number
): MarketInsight {
  const rentGap = analysis.suggestedRent - currentRent;
  
  // Map rent analysis source values to ComparableRent source values
  const mapSource = (source: 'zillow' | 'rentometer' | 'public'): 'zillow' | 'redfin' | 'apartments' | 'crexi' => {
    switch (source) {
      case 'zillow': return 'zillow';
      case 'rentometer': return 'apartments'; // closest match
      case 'public': return 'redfin'; // closest match
      default: return 'zillow';
    }
  };
  
  return {
    id: `insight_${unitId}`,
    propertyId: unitId,
    generatedAt: new Date().toISOString(),
    comparableRents: analysis.comparableRentals.map(comp => ({
      address: comp.address,
      beds: comp.beds,
      baths: comp.baths,
      sqft: comp.sqft || 0,
      rent: comp.rent,
      distance: comp.distance,
      source: mapSource(comp.source),
    })),
    marketRangeLow: analysis.rentRange.min,
    marketRangeHigh: analysis.rentRange.max,
    marketMedian: analysis.medianRent,
    currentRent: currentRent,
    rentGap: rentGap > 0 ? rentGap : 0,
    rentGapPercent: currentRent > 0 ? ((rentGap / currentRent) * 100) : 0,
    twelveMonthChange: analysis.twelveMonthChangePercent,
    vacancyRate: analysis.vacancyRate,
    daysOnMarket: analysis.daysOnMarket,
    suggestedRent: analysis.suggestedRent,
    potentialAnnualIncrease: analysis.potentialAnnualIncrease,
  };
}

// Tab type
type TabType = 'overview' | 'estimator' | 'comparables' | 'trends';

export function MarketInsights() {
  const { user, units } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGapAlert, setShowGapAlert] = useState(true);
  const [usingRealData, setUsingRealData] = useState(false);
  
  // Zillow data
  const [zillowStatus, setZillowStatus] = useState(getZillowStatus());
  const [marketTrends, setMarketTrends] = useState<ZillowMarketTrends | null>(null);
  const [selectedUnit, setSelectedUnit] = useState(units[0] || null);
  const [rentGapAnalysis, setRentGapAnalysis] = useState<RentGapAnalysis | null>(null);
  
  // All tiers have full access — free forever model
  const hasMarketAccess = true;

  useEffect(() => {
    if (hasMarketAccess && units.length > 0) {
      loadMarketData();
    }
  }, [hasMarketAccess, units]);

  // Load market trends for user's zip
  useEffect(() => {
    const loadTrends = async () => {
      const userAddress = user?.propertyAddress || '';
      const zipMatch = userAddress.match(/\b\d{5}\b/);
      const zip = zipMatch ? zipMatch[0] : '10001';
      
      try {
        const trends = await getMarketTrends(zip);
        setMarketTrends(trends);
      } catch (err) {
        console.error('Failed to load market trends:', err);
      }
    };
    
    loadTrends();
  }, [user?.propertyAddress]);

  // Load rent gap analysis when unit changes
  useEffect(() => {
    const loadGapAnalysis = async () => {
      if (!selectedUnit) return;
      
      const userAddress = user?.propertyAddress || '';
      const zipMatch = userAddress.match(/\b\d{5}\b/);
      const zip = zipMatch ? zipMatch[0] : '10001';
      
      try {
        const gap = await analyzeRentGap(
          userAddress || `${zip} NYC`,
          selectedUnit.rentAmount || 2500,
          selectedUnit.bedrooms || 2,
          selectedUnit.bathrooms || 1
        );
        setRentGapAnalysis(gap);
      } catch (err) {
        console.error('Failed to load rent gap analysis:', err);
      }
    };
    
    loadGapAnalysis();
  }, [selectedUnit, user?.propertyAddress]);

  const loadMarketData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const configured = isRentAnalysisConfigured();
      setUsingRealData(configured || zillowStatus.configured);
      
      // Analyze each unit
      const analysisPromises = units.map(async (unit) => {
        // Extract zip code from user's property address or use default
        const userAddress = user?.propertyAddress || '';
        const zipMatch = userAddress.match(/\b\d{5}\b/);
        const zip = zipMatch ? zipMatch[0] : '10001';
        
        try {
          const analysis = await analyzeRent(
            userAddress || 'NYC Property',
            zip,
            unit.bedrooms || 2,
            unit.bathrooms || 1,
            unit.squareFeet,
            unit.rentAmount || 2500
          );
          
          return transformRentAnalysisToInsight(
            analysis,
            unit.id,
            unit.unitNumber,
            unit.rentAmount || 2500
          );
        } catch (err) {
          console.error(`Failed to analyze unit ${unit.unitNumber}:`, err);
          return null;
        }
      });
      
      const results = await Promise.all(analysisPromises);
      setInsights(results.filter((r): r is MarketInsight => r !== null));
    } catch (err) {
      setError('Failed to load market data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalPotentialIncrease = insights.reduce((sum, i) => sum + i.potentialAnnualIncrease, 0);
  const belowMarketCount = insights.filter(i => i.rentGap > 0).length;

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'estimator':
        return (
          <div className="space-y-6">
            <RentEstimator 
              initialAddress={user?.propertyAddress || ''}
              initialBeds={selectedUnit?.bedrooms || 2}
              initialBaths={selectedUnit?.bathrooms || 1}
              currentRent={selectedUnit?.rentAmount}
            />
          </div>
        );
        
      case 'comparables':
        return (
          <div className="space-y-6">
            <ComparableRentals 
              address={user?.propertyAddress || '10001 NYC'}
              beds={selectedUnit?.bedrooms || 2}
              baths={selectedUnit?.bathrooms || 1}
              radius={1.0}
              showMap={true}
            />
          </div>
        );
        
      case 'trends':
        return (
          <div className="space-y-6">
            {marketTrends ? (
              <>
                {/* Market Overview */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-100">
                        {marketTrends.neighborhood}, {marketTrends.borough}
                      </h3>
                      <p className="text-slate-400 text-sm">
                        Market trends for {marketTrends.zipCode}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      marketTrends.marketTier === 'luxury' 
                        ? 'bg-purple-400/10 text-purple-400' 
                        : marketTrends.marketTier === 'mid'
                        ? 'bg-blue-400/10 text-blue-400'
                        : 'bg-emerald-400/10 text-emerald-400'
                    }`}>
                      {marketTrends.marketTier.charAt(0).toUpperCase() + marketTrends.marketTier.slice(1)} Market
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                      <p className="text-slate-500 text-xs mb-1">Median Rent</p>
                      <p className="text-2xl font-bold text-slate-100">
                        ${marketTrends.medianRent.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                      <p className="text-slate-500 text-xs mb-1">12-Month Change</p>
                      <p className={`text-2xl font-bold ${
                        marketTrends.change12Months >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {marketTrends.change12Months >= 0 ? '+' : ''}
                        {marketTrends.change12Months}%
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                      <p className="text-slate-500 text-xs mb-1">Vacancy Rate</p>
                      <p className="text-2xl font-bold text-slate-100">
                        {marketTrends.vacancyRate}%
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                      <p className="text-slate-500 text-xs mb-1">Days on Market</p>
                      <p className="text-2xl font-bold text-slate-100">
                        {marketTrends.daysOnMarket}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Historical Trends */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-amber-400" />
                    Historical Trends
                  </h3>
                  
                  <div className="space-y-4">
                    {[
                      { label: '1 Month', value: marketTrends.change1Month },
                      { label: '3 Months', value: marketTrends.change3Months },
                      { label: '6 Months', value: marketTrends.change6Months },
                      { label: '12 Months', value: marketTrends.change12Months },
                    ].map((period) => (
                      <div key={period.label} className="flex items-center gap-4">
                        <span className="w-20 text-sm text-slate-400">{period.label}</span>
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              period.value >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                            style={{ 
                              width: `${Math.min(Math.abs(period.value) * 10, 100)}%`,
                              marginLeft: period.value < 0 ? 'auto' : '0',
                              marginRight: period.value >= 0 ? 'auto' : '0',
                            }}
                          />
                        </div>
                        <span className={`w-16 text-right text-sm font-medium ${
                          period.value >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {period.value >= 0 ? '+' : ''}{period.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Forecast */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-400" />
                    Market Forecast
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <p className="text-slate-500 text-sm mb-1">Next Month Forecast</p>
                      <p className="text-2xl font-bold text-emerald-400">
                        +{marketTrends.forecastNextMonth}%
                      </p>
                      <p className="text-slate-500 text-xs mt-1">
                        Expected rent increase
                      </p>
                    </div>
                    
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <p className="text-slate-500 text-sm mb-1">Next Quarter Forecast</p>
                      <p className="text-2xl font-bold text-emerald-400">
                        +{marketTrends.forecastNextQuarter}%
                      </p>
                      <p className="text-slate-500 text-xs mt-1">
                        Expected rent increase
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-4" />
                <p className="text-slate-400">Loading market trends...</p>
              </div>
            )}
          </div>
        );
        
      default:
        return (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-400">{belowMarketCount}</p>
                    <p className="text-sm text-slate-500">{belowMarketCount === 1 ? 'Unit' : 'Units'} Below Market</p>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-400">+${(totalPotentialIncrease).toLocaleString()}</p>
                    <p className="text-sm text-slate-500">Potential Annual Increase</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Gauge className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-400">{insights[0]?.vacancyRate || marketTrends?.vacancyRate || 0}%</p>
                    <p className="text-sm text-slate-500">Area Vacancy Rate</p>
                  </div>
                </div>
              </div>
            </div>

            {/* "Am I charging market rate?" Feature */}
            {rentGapAnalysis && selectedUnit && (
              <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/30 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-500/20 rounded-lg">
                    <Target className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-100 mb-2">
                      Am I Charging Market Rate?
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div className="bg-slate-900/50 rounded-lg p-4">
                        <p className="text-slate-500 text-xs mb-1">Your Rent</p>
                        <p className="text-2xl font-bold text-slate-100">
                          ${rentGapAnalysis.currentRent.toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="bg-slate-900/50 rounded-lg p-4">
                        <p className="text-slate-500 text-xs mb-1">Market Rate</p>
                        <p className="text-2xl font-bold text-slate-100">
                          ${rentGapAnalysis.marketMedian.toLocaleString()}
                        </p>
                      </div>
                      
                      <div className={`rounded-lg p-4 ${
                        rentGapAnalysis.percentBelowMarket > 0 
                          ? 'bg-amber-500/20' 
                          : 'bg-emerald-500/20'
                      }`}>
                        <p className="text-slate-400 text-xs mb-1">Difference</p>
                        <p className={`text-2xl font-bold ${
                          rentGapAnalysis.percentBelowMarket > 0 
                            ? 'text-amber-400' 
                            : 'text-emerald-400'
                        }`}>
                          {rentGapAnalysis.percentBelowMarket > 0 ? '+' : ''}
                          {rentGapAnalysis.percentBelowMarket}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <p className="text-slate-300">
                        <strong className="text-amber-400">Recommendation:</strong>{' '}
                        {rentGapAnalysis.recommendation}
                      </p>
                      {rentGapAnalysis.annualGap > 0 && (
                        <p className="text-amber-400/80 text-sm mt-2">
                          You could be earning an additional ${rentGapAnalysis.annualGap.toLocaleString()} per year.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Rent Gap Alert */}
            {showGapAlert && belowMarketCount > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-amber-400">Rent Adjustment Opportunity</h3>
                    <p className="text-slate-400 text-sm mt-1">
                      You have {belowMarketCount} unit{belowMarketCount > 1 ? 's' : ''} renting below market rate. 
                      Raising to market level could increase your annual income by ${totalPotentialIncrease.toLocaleString()}.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowGapAlert(false)}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    <span className="sr-only">Dismiss</span>
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* Unit Selector */}
            {units.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <span className="text-slate-500 text-sm whitespace-nowrap">View unit:</span>
                {units.map((unit) => (
                  <button
                    key={unit.id}
                    onClick={() => setSelectedUnit(unit)}
                    className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                      selectedUnit?.id === unit.id
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    Unit {unit.unitNumber}
                  </button>
                ))}
              </div>
            )}

            {/* Unit Insights */}
            <div className="space-y-6">
              {insights.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center">
                  <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No units found to analyze. Add units to see market insights.</p>
                </div>
              ) : (
                insights.map((insight) => {
                  const unit = units.find(u => u.id === insight.propertyId);
                  if (!unit) return null;
                  
                  // Only show selected unit or all if none selected
                  if (selectedUnit && unit.id !== selectedUnit.id) return null;

                  return (
                    <div key={insight.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-slate-800 rounded-lg">
                            <Building2 className="w-6 h-6 text-amber-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-100">Unit {unit.unitNumber}</h3>
                            <p className="text-slate-500 text-sm">
                              {unit.bedrooms} bed • {unit.bathrooms} bath • {unit.squareFeet} sqft
                            </p>
                          </div>
                        </div>

                        {insight.rentGap > 0 ? (
                          <div className="flex items-center gap-2 text-left sm:text-right">
                            <div>
                              <p className="text-amber-400 font-medium">
                                ${insight.rentGap}/mo below market
                              </p>
                              <p className="text-slate-500 text-sm">
                                Suggested: ${insight.suggestedRent.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-emerald-400">
                            <CheckCircle className="w-5 h-5" />
                            <span>At market rate</span>
                          </div>
                        )}
                      </div>

                      {/* Rent Comparison Bar */}
                      <div className="mb-6">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-500">Market Range: ${insight.marketRangeLow.toLocaleString()} - ${insight.marketRangeHigh.toLocaleString()}</span>
                          <span className="text-slate-400">Median: ${insight.marketMedian.toLocaleString()}</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-slate-600 via-emerald-500 to-slate-600 rounded-full relative"
                            style={{
                              background: `linear-gradient(to right, #475569 0%, #475569 ${((insight.currentRent - insight.marketRangeLow) / (insight.marketRangeHigh - insight.marketRangeLow)) * 100}%, #10b981 ${((insight.currentRent - insight.marketRangeLow) / (insight.marketRangeHigh - insight.marketRangeLow)) * 100}%, #10b981 ${((insight.marketMedian - insight.marketRangeLow) / (insight.marketRangeHigh - insight.marketRangeLow)) * 100}%, #475569 ${((insight.marketMedian - insight.marketRangeLow) / (insight.marketRangeHigh - insight.marketRangeLow)) * 100}%, #475569 100%)`
                            }}
                          >
                            <div 
                              className="absolute w-3 h-3 bg-amber-500 rounded-full border-2 border-slate-900 top-1/2 -translate-y-1/2"
                              style={{ left: `${((insight.currentRent - insight.marketRangeLow) / (insight.marketRangeHigh - insight.marketRangeLow)) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-slate-600">${insight.marketRangeLow.toLocaleString()}</span>
                          <span className="text-amber-400 font-medium">Your rent: ${insight.currentRent.toLocaleString()}</span>
                          <span className="text-slate-600">${insight.marketRangeHigh.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Market Stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                          <p className="text-lg font-semibold text-slate-100">{insight.twelveMonthChange}%</p>
                          <p className="text-xs text-slate-500">12-Month Change</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                          <p className="text-lg font-semibold text-slate-100">{insight.vacancyRate}%</p>
                          <p className="text-xs text-slate-500">Vacancy Rate</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                          <p className="text-lg font-semibold text-slate-100">{insight.daysOnMarket}</p>
                          <p className="text-xs text-slate-500">Avg Days on Market</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                          <p className="text-lg font-semibold text-slate-100">${insight.potentialAnnualIncrease.toLocaleString()}</p>
                          <p className="text-xs text-slate-500">Potential Annual</p>
                        </div>
                      </div>

                      {/* Comparable Rents */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-400 mb-3">Comparable Rentals</h4>
                        <div className="space-y-2">
                          {insight.comparableRents.slice(0, 5).map((comp, idx) => (
                            <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                              <div className="flex items-center gap-3">
                                <MapPin className="w-4 h-4 text-slate-500" />
                                <div>
                                  <p className="text-sm text-slate-300">{comp.address.split(',')[0]}</p>
                                  <p className="text-xs text-slate-500">
                                    {comp.beds}bd • {comp.baths}ba • {comp.sqft}sqft • {comp.distance.toFixed(1)}mi
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-slate-200">${comp.rent.toLocaleString()}</p>
                                <p className="text-xs text-slate-500 capitalize">{comp.source}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-100">Market Insights</h1>
          <p className="text-slate-400 mt-1">Comparable rents and market intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadMarketData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
          >
            <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <span className="px-3 py-1 bg-slate-800 text-slate-400 text-sm rounded-full">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Data Source Notice */}
      {!usingRealData && !loading && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-400 font-medium">Using Demo Data</p>
            <p className="text-slate-400 text-sm mt-1">
              Real-time market data is not configured. Showing estimated NYC rent data based on zip code averages.
              {' '}<a href="/config" className="text-blue-400 hover:underline">Configure API keys</a> for live Zillow data.
            </p>
          </div>
        </div>
      )}

      {usingRealData && !loading && (
        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p className="text-emerald-400">Live market data from Zillow API</p>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800">
        <nav className="flex gap-6">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'estimator', label: 'Rent Estimator', icon: Calculator },
            { id: 'comparables', label: 'Comparables', icon: Building2 },
            { id: 'trends', label: 'Market Trends', icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 pb-4 text-sm font-medium transition-colors relative ${
                activeTab === tab.id 
                  ? 'text-amber-400' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Loading State */}
      {loading && activeTab === 'overview' && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Analyzing market data for your units...</p>
        </div>
      )}

      {/* Tab Content */}
      {!loading || activeTab !== 'overview' ? renderTabContent() : null}

      <ComplianceFooter />
    </div>
  );
}

export default MarketInsights;
