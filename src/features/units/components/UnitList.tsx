import { AnimatePresence, motion } from 'framer-motion';
import { Search, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useMemo } from 'react';
import { UnitCard } from './UnitCard';
import type { Unit, HealthBreakdown } from '../types/unit.types';

interface UnitListProps {
  units: Unit[];
  allUnits: Unit[];
  calculateUnitHealth: (unit: Unit) => HealthBreakdown;
  onSelectUnit: (unit: Unit) => void;
  onEditUnit: (unit: Unit) => void;
  onDeleteUnit?: (unit: Unit) => void;
  formatDate: (dateString: string) => string;
  onTenantConnect?: (unit: Unit) => void;
  botUsername?: string;
  expandedQR?: Record<string, boolean>;
  onToggleQR?: (unitId: string) => void;
  // Optional index for tracking
  index?: number;
}

interface PropertyGroup {
  address: string;
  units: Unit[];
}

export function UnitList({
  units,
  allUnits,
  calculateUnitHealth,
  onSelectUnit,
  onEditUnit,
  onDeleteUnit,
  formatDate,
  onTenantConnect,
  botUsername,
  expandedQR,
  onToggleQR,
}: UnitListProps) {
  // State for collapsed property groups
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Normalize address for consistent grouping
  const normalizeAddress = (addr: string): string => {
    if (!addr || addr.trim() === '') return 'No Address';
    return addr
      .trim()
      .toLowerCase()
      .replace(/,\s*,/g, ',')           // Remove double commas
      .replace(/\s+/g, ' ')            // Normalize spaces
      .replace(/,\s*usa?$/i, '')        // Remove trailing USA
      .replace(/,\s*united states?$/i, '') // Remove trailing United States
      .trim();
  };

  // Group units by property address
  const groupedUnits = useMemo(() => {
    const groups: Record<string, PropertyGroup> = {};
    const normalizedToDisplay: Record<string, string> = {};
    
    units.forEach((unit) => {
      const normalized = normalizeAddress(unit.address);
      
      // Store the first (or longest) display version
      if (!normalizedToDisplay[normalized] || unit.address?.length > normalizedToDisplay[normalized].length) {
        normalizedToDisplay[normalized] = unit.address || 'No Address';
      }
      
      if (!groups[normalized]) {
        groups[normalized] = {
          address: normalizedToDisplay[normalized],
          units: [],
        };
      }
      
      groups[normalized].units.push(unit);
    });
    
    // Convert to array and sort by address
    return Object.values(groups).sort((a, b) => 
      a.address.localeCompare(b.address)
    );
  }, [units]);

  // Toggle group collapse
  const toggleGroup = (address: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [address]: !prev[address],
    }));
  };

  // No Search Results
  if (allUnits.length > 0 && units.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          No units found
        </h3>
        <p className="text-slate-500">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  // No units at all
  if (units.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {groupedUnits.map((group) => {
        const isCollapsed = collapsedGroups[group.address];
        const unitCount = group.units.length;
        
        return (
          <motion.div
            key={group.address}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden"
          >
            {/* Property Header */}
            <button
              onClick={() => toggleGroup(group.address)}
              className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Building2 className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                    {group.address}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {unitCount} {unitCount === 1 ? 'unit' : 'units'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {isCollapsed ? 'Show' : 'Hide'}
                </span>
                {isCollapsed ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </button>

            {/* Units Grid */}
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <AnimatePresence mode="popLayout">
                        {group.units.map((unit, index) => (
                          <UnitCard
                            key={unit.id}
                            unit={unit}
                            index={index}
                            unitHealth={calculateUnitHealth(unit)}
                            onSelect={onSelectUnit}
                            onEdit={onEditUnit}
                            onDelete={onDeleteUnit}
                            formatDate={formatDate}
                            onTenantConnect={onTenantConnect}
                            botUsername={botUsername}
                            expandedQR={expandedQR?.[unit.id]}
                            onToggleQR={() => onToggleQR?.(unit.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
