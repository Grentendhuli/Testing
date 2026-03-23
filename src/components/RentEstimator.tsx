import { useState, useCallback, useEffect } from 'react';
import { 
  Calculator, MapPin, Bed, Bath, DollarSign, 
  TrendingUp, TrendingDown, AlertCircle, CheckCircle,
  Loader2, Info, Building2, ArrowRight
} from 'lucide-react';
import { 
  getRentEstimate, 
  analyzeRentGap, 
  getComparableRentals,
  ZillowRentEstimate,
  RentGapAnalysis,
  ZillowComparableRental,
  isZillowConfigured
} from '../services/zillow';
import { AddressAutocomplete } from './AddressAutocomplete';

interface RentEstimatorProps {
  initialAddress?: string;
  initialBeds?: number;
  initialBaths?: number;
  currentRent?: number;
  onEstimateComplete?: (estimate: ZillowRentEstimate, gap: RentGapAnalysis) => void;
}

export function RentEstimator({ 
  initialAddress = '', 
  initialBeds = 2, 
  initialBaths = 1,
  currentRent,
  onEstimateComplete 
}: RentEstimatorProps) {
  // Form state
  const [address, setAddress] = useState(initialAddress);
  const [beds, setBeds] = useState(initialBeds);
  const [baths, setBaths] = useState(initialBaths);
  const [yourRent, setYourRent] = useState(currentRent?.toString() || '');
  
  // Results state
  const [estimate, setEstimate] = useState<ZillowRentEstimate | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<RentGapAnalysis | null>(null);
  const [comparables, setComparables] = useState<ZillowComparableRental[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showComparables, setShowComparables] = useState(false);
  const [usingRealData, setUsingRealData] = useState(false);

  useEffect(() => {
    setUsingRealData(isZillowConfigured());
  }, []);

  const handleEstimate = useCallback(async () => {
    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get rent estimate
      const rentEstimate = await getRentEstimate(address, beds, baths);
      setEstimate(rentEstimate);

      // Get gap analysis if current rent is provided
      if (yourRent && parseFloat(yourRent) > 0) {
        const gap = await analyzeRentGap(address, parseFloat(yourRent), beds, baths);
        setGapAnalysis(gap);
        
        if (onEstimateComplete) {
          onEstimateComplete(rentEstimate, gap);
        }
      }

      // Get comparables
      const comps = await getComparableRentals(address, beds, baths);
      setComparables(comps);
    } catch (err) {
      setError('Failed to get rent estimate. Please try again.');
      console.error('Rent estimation error:', err);
    } finally {
      setLoading(false);
    }
  }, [address, beds, baths, yourRent, onEstimateComplete]);

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-emerald-400 bg-emerald-400/10';
      case 'medium': return 'text-amber-400 bg-amber-400/10';
      case 'low': return 'text-red-400 bg-red-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  const getGapColor = (percent: number) => {
    if (percent > 10) return 'text-red-400';
    if (percent > 5) return 'text-amber-400';
    if (percent >= -5) return 'text-emerald-400';
    return 'text-blue-400';
  };

  const getGapIcon = (percent: number) => {
    if (percent > 5) return <TrendingUp className="w-5 h-5" />;
    if (percent < -5) return <TrendingDown className="w-5 h-5" />;
    return <CheckCircle className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-500/20 rounded-lg">
          <Calculator className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Rent Estimator</h2>
          <p className="text-slate-400 text-sm">Get market-rate rent estimates for your property</p>
        </div>
      </div>

      {/* Data Source Notice */}
      {!usingRealData && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-blue-400 text-sm">
            Using estimated NYC market data. Configure Zillow API for real-time data.
          </p>
        </div>
      )}

      {/* Input Form */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">
            Property Address
          </label>
          <AddressAutocomplete
            value={address}
            onChange={(value) => setAddress(value)}
            placeholder="123 Main St, New York, NY 10001"
            useGooglePlaces={!!(import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Bedrooms
            </label>
            <div className="relative">
              <Bed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <select
                value={beds}
                onChange={(e) => setBeds(parseInt(e.target.value))}
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 appearance-none"
              >
                <option value={0}>Studio</option>
                <option value={1}>1 Bedroom</option>
                <option value={2}>2 Bedrooms</option>
                <option value={3}>3 Bedrooms</option>
                <option value={4}>4+ Bedrooms</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Bathrooms
            </label>
            <div className="relative">
              <Bath className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <select
                value={baths}
                onChange={(e) => setBaths(parseInt(e.target.value))}
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 appearance-none"
              >
                <option value={1}>1 Bath</option>
                <option value={2}>2 Baths</option>
                <option value={3}>3 Baths</option>
                <option value={4}>4+ Baths</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">
            Your Current Rent (optional)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="number"
              value={yourRent}
              onChange={(e) => setYourRent(e.target.value)}
              placeholder="2500"
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <button
          onClick={handleEstimate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 text-slate-950 font-semibold rounded-lg transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Calculator className="w-5 h-5" />
              Get Rent Estimate
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {estimate && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-6">
          {/* Rent Estimate */}
          <div className="text-center pb-6 border-b border-slate-800">
            <p className="text-slate-400 text-sm mb-2">Estimated Market Rent</p>
            <p className="text-4xl font-bold text-slate-100">
              ${estimate.estimatedRent.toLocaleString()}
              <span className="text-lg text-slate-400 font-normal">/mo</span>
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getConfidenceColor(estimate.confidence)}`}>
                {estimate.confidence.charAt(0).toUpperCase() + estimate.confidence.slice(1)} Confidence
              </span>
              <span className="text-slate-500 text-xs">
                Range: ${estimate.rentRange.low.toLocaleString()} - ${estimate.rentRange.high.toLocaleString()}
              </span>
            </div>
            {estimate.pricePerSqft && (
              <p className="text-slate-500 text-sm mt-2">
                ${estimate.pricePerSqft}/sqft estimated
              </p>
            )}
          </div>

          {/* Market Rate vs Your Rent */}
          {gapAnalysis && (
            <div className="space-y-4">
              <h3 className="font-medium text-slate-300 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                Market Rate vs Your Rent
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                  <p className="text-slate-500 text-xs mb-1">Market Median</p>
                  <p className="text-xl font-semibold text-slate-200">
                    ${gapAnalysis.marketMedian.toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                  <p className="text-slate-500 text-xs mb-1">Your Rent</p>
                  <p className="text-xl font-semibold text-slate-200">
                    ${gapAnalysis.currentRent.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Gap Visualization */}
              <div className={`p-4 rounded-lg ${gapAnalysis.percentBelowMarket > 0 ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-emerald-500/10 border border-emerald-500/30'}`}>
                <div className="flex items-center gap-3">
                  <div className={getGapColor(gapAnalysis.percentBelowMarket)}>
                    {getGapIcon(gapAnalysis.percentBelowMarket)}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${getGapColor(gapAnalysis.percentBelowMarket)}`}>
                      {gapAnalysis.percentBelowMarket > 0 ? (
                        <>
                          ${gapAnalysis.monthlyGap.toLocaleString()}/mo below market 
                          ({gapAnalysis.percentBelowMarket}%)
                        </>
                      ) : gapAnalysis.percentBelowMarket < -5 ? (
                        <>
                          ${Math.abs(gapAnalysis.monthlyGap).toLocaleString()}/mo above market 
                          ({Math.abs(gapAnalysis.percentBelowMarket)}%)
                        </>
                      ) : (
                        <>At market rate</>
                      )}
                    </p>
                    {gapAnalysis.percentBelowMarket > 0 && (
                      <p className="text-amber-400/80 text-sm mt-1">
                        Potential annual increase: ${gapAnalysis.annualGap.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  {gapAnalysis.recommendation}
                </p>
              </div>
            </div>
          )}

          {/* Comparable Properties */}
          {comparables.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-slate-300 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  Comparable Rentals
                </h3>
                <button
                  onClick={() => setShowComparables(!showComparables)}
                  className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  {showComparables ? 'Hide' : 'Show'}
                  <ArrowRight className={`w-4 h-4 transition-transform ${showComparables ? 'rotate-90' : ''}`} />
                </button>
              </div>

              {showComparables && (
                <div className="space-y-2">
                  {comparables.slice(0, 5).map((comp, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between py-3 border-b border-slate-800/50 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-300">{comp.address}</p>
                          <p className="text-xs text-slate-500">
                            {comp.bedrooms}bd • {comp.bathrooms}ba • {comp.distance.toFixed(1)}mi away
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-200">
                          ${comp.rent.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">
                          {comp.daysOnMarket} days on market
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RentEstimator;
