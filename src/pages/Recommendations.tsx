import { useState, useMemo } from 'react';
import { 
  Lightbulb, TrendingUp, Hammer, DollarSign, Clock,
  CheckCircle, X, ChevronRight, Wrench,
  Paintbrush, Home
} from 'lucide-react';
import { ComplianceFooter } from '../components/ComplianceFooter';
// UpgradeBanner removed - all features free
import { useApp } from '../context/AppContext';
import type { ValueRecommendation, Unit, Lease, MaintenanceRequest } from '../types';

const categoryIcons = {
  renovation: Paintbrush,
  amenity: Home,
  management: Wrench,
  operational: Lightbulb
};

const categoryLabels = {
  renovation: 'Renovation',
  amenity: 'Amenity',
  management: 'Management',
  operational: 'Operational'
};

const priorityColors = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
};

const statusIcons = {
  suggested: Lightbulb,
  considering: Clock,
  approved: CheckCircle,
  'in-progress': Hammer,
  completed: CheckCircle,
  declined: X
};

const statusLabels = {
  suggested: 'Suggested',
  considering: 'Considering',
  approved: 'Approved',
  'in-progress': 'In Progress',
  completed: 'Completed',
  declined: 'Declined'
};

// Build recommendations from real data
function buildRecommendations(
  units: Unit[],
  leases: Lease[],
  maintenanceRequests: MaintenanceRequest[]
): ValueRecommendation[] {
  const recs: ValueRecommendation[] = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Vacant units → 'List Vacant Unit X' (priority: high)
  units.filter(u => u.status === 'vacant').forEach((unit, idx) => {
    recs.push({
      id: `vacant_${unit.id}`,
      propertyId: unit.id,
      category: 'operational',
      priority: 'high',
      title: `List Vacant Unit ${unit.unitNumber}`,
      description: `Unit ${unit.unitNumber} is vacant and ready to be listed. Consider marketing on rental platforms to minimize vacancy loss.`,
      costEstimate: 0,
      monthlyRentIncrease: unit.rentAmount || 0,
      roiMonths: 0,
      annualRevenueImpact: (unit.rentAmount || 0) * 12,
      status: 'suggested',
      createdAt: now.toISOString()
    });
  });

  // Leases expiring <90d → 'Renew Lease — Unit X'
  leases.filter(l => l.status === 'active').forEach(lease => {
    const endDate = new Date(lease.endDate);
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 90 && daysUntilExpiry > 0) {
      const priority = daysUntilExpiry < 30 ? 'high' : 'medium';
      recs.push({
        id: `expiring_${lease.id}`,
        propertyId: lease.unitId,
        category: 'operational',
        priority,
        title: `Renew Lease — Unit ${lease.unitNumber}`,
        description: `Lease for ${lease.tenantName} in Unit ${lease.unitNumber} expires in ${daysUntilExpiry} days. Reach out early to discuss renewal terms.`,
        costEstimate: 0,
        monthlyRentIncrease: 0,
        roiMonths: 0,
        annualRevenueImpact: lease.rentAmount * 12,
        status: 'suggested',
        createdAt: now.toISOString()
      });
    }
  });

  // Units with 2+ maintenance requests in last 30d → Preventive Inspection
  const unitRequestCounts = new Map<string, { count: number; unit: Unit }>();
  maintenanceRequests
    .filter(r => new Date(r.createdAt) > thirtyDaysAgo)
    .forEach(r => {
      const unit = units.find(u => u.id === r.unitId);
      if (unit) {
        const existing = unitRequestCounts.get(r.unitId);
        if (existing) {
          existing.count++;
        } else {
          unitRequestCounts.set(r.unitId, { count: 1, unit });
        }
      }
    });

  unitRequestCounts.forEach(({ count, unit }) => {
    if (count >= 2) {
      recs.push({
        id: `inspection_${unit.id}`,
        propertyId: unit.id,
        category: 'management',
        priority: 'medium',
        title: `Preventive Inspection — Unit ${unit.unitNumber}`,
        description: `Unit ${unit.unitNumber} has had ${count} maintenance requests in the last 30 days. Consider a preventive inspection to identify underlying issues.`,
        costEstimate: 150,
        monthlyRentIncrease: 0,
        roiMonths: 0,
        annualRevenueImpact: 0,
        status: 'suggested',
        createdAt: now.toISOString()
      });
    }
  });

  // If occupied units exist → generic amenity suggestion
  const occupiedUnits = units.filter(u => u.status === 'occupied');
  if (occupiedUnits.length > 0) {
    recs.push({
      id: `amenity_general`,
      propertyId: 'all',
      category: 'amenity',
      priority: 'low',
      title: 'Add In-Unit Washer/Dryer',
      description: 'Install washer/dryer hookups in vacant units. This improves tenant retention and can justify higher rents.',
      costEstimate: 2500,
      monthlyRentIncrease: 150,
      roiMonths: 17,
      annualRevenueImpact: 1800,
      status: 'suggested',
      createdAt: now.toISOString()
    });
  }

  return recs;
}

export function Recommendations() {
  const { units, leases, maintenanceRequests } = useApp();
  const [overrides, setOverrides] = useState<Record<string, ValueRecommendation['status']>>({});
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'completed'>('all');
  const [selectedRec, setSelectedRec] = useState<ValueRecommendation | null>(null);

  // Build recommendations from real data
  const baseRecs = useMemo(() => 
    buildRecommendations(units, leases, maintenanceRequests),
    [units, leases, maintenanceRequests]
  );

  // Apply status overrides
  const recommendations = baseRecs.map(r => 
    overrides[r.id] ? { ...r, status: overrides[r.id] } : r
  );

  const filteredRecs = recommendations.filter(rec => {
    if (filter === 'all') return true;
    if (filter === 'pending') return ['suggested', 'considering'].includes(rec.status);
    if (filter === 'approved') return ['approved', 'in-progress'].includes(rec.status);
    return rec.status === 'completed' || rec.status === 'declined';
  });

  const activeRecs = recommendations.filter(r => ['suggested', 'considering', 'approved', 'in-progress'].includes(r.status)).length;

  const updateStatus = (id: string, newStatus: ValueRecommendation['status']) => {
    setOverrides(prev => ({ ...prev, [id]: newStatus }));
    if (selectedRec?.id === id) {
      setSelectedRec(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Empty state
  if (units.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-100">Value-Add Recommendations</h1>
            <p className="text-slate-400 mt-1">AI-powered suggestions to maximize your ROI</p>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
          <Lightbulb className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-300 text-lg mb-2">Add your units and leases — AI will generate personalized recommendations.</p>
          <a
            href="/units"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg transition-colors mt-4"
          >
            Go to Units
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
          <h1 className="text-2xl font-serif font-bold text-slate-100">Value-Add Recommendations</h1>
          <p className="text-slate-400 mt-1">AI-powered suggestions to maximize your property value</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-sm font-medium rounded-full">
            {activeRecs} Active Recommendations
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === f
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {filteredRecs.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
            <Lightbulb className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No recommendations found</p>
            <p className="text-slate-500 text-sm mt-2">Check back next month for new suggestions</p>
          </div>
        ) : (
          filteredRecs.map((rec) => {
            const CategoryIcon = categoryIcons[rec.category];
            const StatusIcon = statusIcons[rec.status];

            return (
              <div
                key={rec.id}
                onClick={() => setSelectedRec(rec)}
                className="bg-slate-900/50 border border-slate-800 hover:border-slate-600 rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className={`p-3 rounded-lg ${priorityColors[rec.priority]}`}>
                    <CategoryIcon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-200">{rec.title}</h3>
                        <p className="text-slate-400 text-sm mt-1">{rec.description}</p>
                        
                        <div className="flex items-center gap-4 mt-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${priorityColors[rec.priority]}`}>
                            {rec.priority} Priority
                          </span>
                          <span className="flex items-center gap-1 text-slate-500 text-sm">
                            <CategoryIcon className="w-4 h-4" />
                            {categoryLabels[rec.category]}
                          </span>
                          <span className="flex items-center gap-1 text-slate-500 text-sm">
                            <StatusIcon className="w-4 h-4" />
                            {statusLabels[rec.status]}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-400">+${rec.annualRevenueImpact.toLocaleString()}</p>
                        <p className="text-slate-500 text-sm">Annual Impact</p>
                        {rec.roiMonths > 0 && (
                          <p className="text-amber-400 text-xs mt-1">{rec.roiMonths} month ROI</p>
                        )}
                      </div>
                    </div>
                    
                    {rec.costEstimate > 0 && (
                      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-800/50">
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <DollarSign className="w-4 h-4" />
                          Est. Cost: ${rec.costEstimate.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <TrendingUp className="w-4 h-4" />
                          Monthly +${rec.monthlyRentIncrease}
                        </div>
                        
                        {rec.vendorName && (
                          <div className="flex items-center gap-2 text-slate-400 text-sm">
                            <span>Recommended: {rec.vendorName}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ComplianceFooter />

      {/* Detail Modal */}
      {selectedRec && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedRec(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full max-h-[90vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className={`p-3 rounded-lg ${priorityColors[selectedRec.priority]}`}>
                  {(() => {
                    const Icon = categoryIcons[selectedRec.category];
                    return <Icon className="w-6 h-6" />;
                  })()}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-100">{selectedRec.title}</h3>
                  <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium capitalize ${priorityColors[selectedRec.priority]}`}>
                    {selectedRec.priority} Priority
                  </span>
                </div>
              </div>
              
              <p className="text-slate-300 mb-6">{selectedRec.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                {selectedRec.costEstimate > 0 && (
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-slate-500 text-sm">Est. Cost</p>
                    <p className="text-xl font-semibold text-slate-100">${selectedRec.costEstimate.toLocaleString()}</p>
                  </div>
                )}
                
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-500 text-sm">Monthly Increase</p>
                  <p className="text-xl font-semibold text-emerald-400">+${selectedRec.monthlyRentIncrease.toLocaleString()}</p>
                </div>
                
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-500 text-sm">ROI (Months)</p>
                  <p className="text-xl font-semibold text-amber-400">{selectedRec.roiMonths}</p>
                </div>
                
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-500 text-sm">Annual Impact</p>
                  <p className="text-xl font-semibold text-emerald-400">+${selectedRec.annualRevenueImpact.toLocaleString()}</p>
                </div>
              </div>
              
              {selectedRec.vendorName && (
                <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
                  <p className="text-slate-500 text-sm mb-2">Recommended Vendor</p>
                  <p className="text-slate-200 font-medium">{selectedRec.vendorName}</p>
                  {selectedRec.vendorPhone && (
                    <p className="text-slate-400 text-sm">{selectedRec.vendorPhone}</p>
                  )}
                </div>
              )}
              
              <div className="flex gap-3">
                {selectedRec.status === 'suggested' && (
                  <>
                    <button
                      onClick={() => updateStatus(selectedRec.id, 'approved')}
                      className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus(selectedRec.id, 'considering')}
                      className="flex-1 py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors"
                    >
                      Consider
                    </button>
                  </>
                )}
                
                {selectedRec.status === 'considering' && (
                  <>
                    <button
                      onClick={() => updateStatus(selectedRec.id, 'approved')}
                      className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus(selectedRec.id, 'declined')}
                      className="flex-1 py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors"
                    >
                      Decline
                    </button>
                  </>
                )}
                
                {(selectedRec.status === 'approved' || selectedRec.status === 'in-progress') && (
                  <button
                    onClick={() => updateStatus(selectedRec.id, 'completed')}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                  >
                    Mark Complete
                  </button>
                )}
                
                <button
                  onClick={() => setSelectedRec(null)}
                  className="flex-1 py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Recommendations;
