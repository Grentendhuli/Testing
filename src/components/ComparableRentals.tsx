import { useState, useEffect, useCallback } from 'react';
import { 
  MapPin, Bed, Bath, Maximize, DollarSign, 
  Filter, ExternalLink, Clock, Building2,
  ChevronDown, ChevronUp, Map as MapIcon,
  Loader2, AlertCircle, Navigation
} from 'lucide-react';
import { 
  getComparableRentals, 
  getRentEstimate,
  ZillowComparableRental,
  ZillowRentEstimate
} from '../services/zillow';

interface ComparableRentalsProps {
  address: string;
  beds?: number;
  baths?: number;
  radius?: number; // in miles
  showMap?: boolean;
}

interface FilterState {
  minRent: string;
  maxRent: string;
  beds: number | 'any';
  baths: number | 'any';
  maxDistance: number;
}

export function ComparableRentals({ 
  address, 
  beds = 2, 
  baths = 1, 
  radius = 1.0,
  showMap = false 
}: ComparableRentalsProps) {
  // Data state
  const [comparables, setComparables] = useState<ZillowComparableRental[]>([]);
  const [filteredComparables, setFilteredComparables] = useState<ZillowComparableRental[]>([]);
  const [marketEstimate, setMarketEstimate] = useState<ZillowRentEstimate | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>(showMap ? 'map' : 'list');
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    minRent: '',
    maxRent: '',
    beds: beds,
    baths: baths,
    maxDistance: radius,
  });

  // Sort state
  const [sortBy, setSortBy] = useState<'distance' | 'rent' | 'daysOnMarket'>('distance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const loadComparables = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [comps, estimate] = await Promise.all([
        getComparableRentals(address, beds, baths, radius),
        getRentEstimate(address, beds, baths)
      ]);
      
      setComparables(comps);
      setFilteredComparables(comps);
      setMarketEstimate(estimate);
    } catch (err) {
      setError('Failed to load comparable rentals');
      console.error('Error loading comparables:', err);
    } finally {
      setLoading(false);
    }
  }, [address, beds, baths, radius]);

  useEffect(() => {
    loadComparables();
  }, [loadComparables]);

  // Apply filters
  useEffect(() => {
    let filtered = [...comparables];
    
    // Filter by rent
    if (filters.minRent) {
      filtered = filtered.filter(c => c.rent >= parseInt(filters.minRent));
    }
    if (filters.maxRent) {
      filtered = filtered.filter(c => c.rent <= parseInt(filters.maxRent));
    }
    
    // Filter by beds
    if (filters.beds !== 'any') {
      filtered = filtered.filter(c => c.bedrooms === filters.beds);
    }
    
    // Filter by baths
    if (filters.baths !== 'any') {
      filtered = filtered.filter(c => c.bathrooms === filters.baths);
    }
    
    // Filter by distance
    filtered = filtered.filter(c => c.distance <= filters.maxDistance);
    
    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'distance':
          comparison = a.distance - b.distance;
          break;
        case 'rent':
          comparison = a.rent - b.rent;
          break;
        case 'daysOnMarket':
          comparison = a.daysOnMarket - b.daysOnMarket;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredComparables(filtered);
  }, [comparables, filters, sortBy, sortOrder]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      minRent: '',
      maxRent: '',
      beds: beds,
      baths: baths,
      maxDistance: radius,
    });
  };

  const getRentComparison = (rent: number) => {
    if (!marketEstimate) return null;
    const diff = rent - marketEstimate.estimatedRent;
    const percent = (diff / marketEstimate.estimatedRent) * 100;
    
    if (Math.abs(percent) < 5) return { color: 'text-slate-400', label: 'At market' };
    if (percent > 0) return { color: 'text-amber-400', label: `+${percent.toFixed(0)}%` };
    return { color: 'text-emerald-400', label: `${percent.toFixed(0)}%` };
  };

  if (loading) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Loading comparable rentals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
        <p className="text-slate-400 mb-4">{error}</p>
        <button
          onClick={loadComparables}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            Comparable Rentals
          </h3>
          <p className="text-slate-400 text-sm">
            {filteredComparables.length} properties near {address.split(',')[0]}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showFilters 
                ? 'bg-amber-500/20 text-amber-400' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {Object.values(filters).some(v => v !== '' && v !== beds && v !== baths && v !== radius) && (
              <span className="ml-1 w-2 h-2 bg-amber-500 rounded-full"></span>
            )}
          </button>
          
          {showMap && (
            <div className="flex bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-slate-700 text-slate-100' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  viewMode === 'map' 
                    ? 'bg-slate-700 text-slate-100' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MapIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Market Summary */}
      {marketEstimate && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4 text-center">
            <p className="text-slate-500 text-xs mb-1">Market Median</p>
            <p className="text-xl font-bold text-slate-100">
              ${marketEstimate.estimatedRent.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 text-center">
            <p className="text-slate-500 text-xs mb-1">Range</p>
            <p className="text-lg font-semibold text-slate-200">
              ${marketEstimate.rentRange.low.toLocaleString()} - ${marketEstimate.rentRange.high.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 text-center">
            <p className="text-slate-500 text-xs mb-1">Confidence</p>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
              marketEstimate.confidence === 'high' 
                ? 'bg-emerald-400/10 text-emerald-400' 
                : marketEstimate.confidence === 'medium'
                ? 'bg-amber-400/10 text-amber-400'
                : 'bg-red-400/10 text-red-400'
            }`}>
              {marketEstimate.confidence.charAt(0).toUpperCase() + marketEstimate.confidence.slice(1)}
            </span>
          </div>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Min Rent</label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="number"
                  value={filters.minRent}
                  onChange={(e) => handleFilterChange('minRent', e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Max Rent</label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="number"
                  value={filters.maxRent}
                  onChange={(e) => handleFilterChange('maxRent', e.target.value)}
                  placeholder="∞"
                  className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Bedrooms</label>
              <select
                value={filters.beds}
                onChange={(e) => handleFilterChange('beds', e.target.value === 'any' ? 'any' : parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500/50"
              >
                <option value="any">Any</option>
                <option value={0}>Studio</option>
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4+</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Max Distance</label>
              <select
                value={filters.maxDistance}
                onChange={(e) => handleFilterChange('maxDistance', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500/50"
              >
                <option value={0.25}>0.25 mi</option>
                <option value={0.5}>0.5 mi</option>
                <option value={1}>1 mi</option>
                <option value={2}>2 mi</option>
                <option value={5}>5 mi</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={clearFilters}
              className="text-sm text-slate-400 hover:text-slate-300"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Sort Controls */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-slate-500">Sort by:</span>
        <div className="flex gap-2">
          {(['distance', 'rent', 'daysOnMarket'] as const).map((option) => (
            <button
              key={option}
              onClick={() => {
                if (sortBy === option) {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy(option);
                  setSortOrder('asc');
                }
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                sortBy === option 
                  ? 'bg-amber-500/20 text-amber-400' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {option === 'distance' ? 'Distance' 
                : option === 'rent' 
                ? 'Rent' 
                : 'Days on Market'}
              {sortBy === option && (
                sortOrder === 'asc' ? <ChevronDown className="w-3 h-3" /> 
                : <ChevronUp className="w-3 h-3" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredComparables.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center">
              <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No comparable rentals found with current filters</p>
            </div>
          ) : (
            filteredComparables.map((comp, idx) => {
              const comparison = getRentComparison(comp.rent);
              
              return (
                <div 
                  key={idx}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Property Image Placeholder */}
                    <div className="w-full sm:w-24 h-24 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-8 h-8 text-slate-500" />
                    </div>
                    
                    {/* Property Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-medium text-slate-200 truncate">
                            {comp.address}
                          </h4>
                          <p className="text-slate-500 text-sm">
                            {comp.city}, {comp.state} {comp.zipCode}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-slate-100">
                            ${comp.rent.toLocaleString()}
                          </p>
                          {comparison && (
                            <span className={`text-xs ${comparison.color}`}>
                              {comparison.label}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Bed className="w-4 h-4" />
                          {comp.bedrooms}bd
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath className="w-4 h-4" />
                          {comp.bathrooms}ba
                        </span>
                        {comp.squareFeet && (
                          <span className="flex items-center gap-1">
                            <Maximize className="w-4 h-4" />
                            {comp.squareFeet.toLocaleString()} sqft
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Navigation className="w-4 h-4" />
                          {comp.distance.toFixed(1)} mi
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {comp.daysOnMarket} days
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Map View Placeholder */}
      {viewMode === 'map' && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
          <MapIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">Map view coming soon</p>
          <p className="text-slate-500 text-sm">
            Integration with mapping services is in development.
            <br />
            Use list view for now.
          </p>
          <button
            onClick={() => setViewMode('list')}
            className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium rounded-lg transition-colors"
          >
            Switch to List View
          </button>
        </div>
      )}
    </div>
  );
}

export default ComparableRentals;
