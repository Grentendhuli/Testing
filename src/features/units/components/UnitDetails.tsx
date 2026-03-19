import { motion } from 'framer-motion';
import { Building2, X, Edit2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { HealthScoreRing } from '@/components/HealthScoreRing';
import { useNavigate } from 'react-router-dom';
import type { Unit, UnitStatus, HealthBreakdown } from '../types/unit.types';
import type { Lease } from '@/types';

const statusConfig: Record<UnitStatus, { 
  label: string; 
  color: string; 
  bg: string;
}> = {
  occupied: { 
    label: 'Occupied', 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  vacant: { 
    label: 'Vacant', 
    color: 'text-amber-400', 
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  maintenance: { 
    label: 'Maintenance', 
    color: 'text-red-400', 
    bg: 'bg-red-500/10 border-red-500/20',
  },
};

interface UnitDetailsProps {
  unit: Unit | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  unitHealth: HealthBreakdown | null;
  lease?: Lease | null;
}

export function UnitDetails({
  unit,
  isOpen,
  onClose,
  onEdit,
  unitHealth,
  lease,
}: UnitDetailsProps) {
  if (!isOpen || !unit) return null;

  const status = statusConfig[unit.status];
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl max-w-lg w-full max-h-[90vh] overflow-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                Unit {unit.unitNumber}
              </h2>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${status.bg} ${status.color}`}>
                {status.label}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Health Score */}
          {unitHealth && (
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
              <div className="flex items-center gap-4 mb-4">
                <HealthScoreRing score={unitHealth.score} size="md" />
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">Unit Health Score</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {unitHealth.score >= 80 ? 'Excellent condition' : 
                     unitHealth.score >= 60 ? 'Good condition' :
                     unitHealth.score >= 40 ? 'Needs attention' : 'Critical'}
                  </p>
                </div>
              </div>

              {/* Health Breakdown */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Payment</p>
                  <p className={`text-sm font-medium ${
                    unitHealth.payment.score >= 80 ? 'text-emerald-500' :
                    unitHealth.payment.score >= 50 ? 'text-amber-500' : 'text-red-500'
                  }`}>
                    {unitHealth.payment.label}
                  </p>
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Maintenance</p>
                  <p className={`text-sm font-medium ${
                    unitHealth.maintenance.score >= 80 ? 'text-emerald-500' :
                    unitHealth.maintenance.score >= 50 ? 'text-amber-500' : 'text-red-500'
                  }`}>
                    {unitHealth.maintenance.label}
                  </p>
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Lease</p>
                  <p className={`text-sm font-medium ${
                    unitHealth.lease.score >= 80 ? 'text-emerald-500' :
                    unitHealth.lease.score >= 50 ? 'text-amber-500' : 'text-red-500'
                  }`}>
                    {unitHealth.lease.label}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Unit Info */}
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Address</span>
              <span className="text-slate-800 dark:text-slate-200 text-right">{unit.address || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Bedrooms</span>
              <span className="text-slate-800 dark:text-slate-200">{unit.bedrooms}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Bathrooms</span>
              <span className="text-slate-800 dark:text-slate-200">{unit.bathrooms}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Square Feet</span>
              <span className="text-slate-800 dark:text-slate-200">{unit.squareFeet || 'N/A'}</span>
            </div>
          </div>

          {/* Rent */}
          <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <span className="text-slate-600 dark:text-slate-400">Monthly Rent</span>
            <span className="text-xl font-bold text-amber-500">
              ${unit.rentAmount.toLocaleString()}
            </span>
          </div>

          {/* Lease */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Lease</h3>
              {lease ? (
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                  Active
                </span>
              ) : (
                <span className="text-xs px-2 py-1 rounded-full bg-slate-200 text-slate-600">
                  No lease
                </span>
              )}
            </div>
            {lease ? (
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Type</span>
                  <span className="text-slate-800 dark:text-slate-200 capitalize">
                    {(lease.leaseType || 'free-market').replace(/-/g, ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Tenant</span>
                  <span className="text-slate-800 dark:text-slate-200">{lease.tenantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Term</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {lease.startDate} → {lease.endDate}
                  </span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => navigate(`/leases?unitId=${unit.id}`)}
                    className="flex-1"
                  >
                    Manage Lease
                  </Button>
                  <Button
                    onClick={() => navigate(`/leases?unitId=${unit.id}&action=renewal`)}
                    className="flex-1"
                  >
                    Generate Renewal
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                <p>No lease on file yet.</p>
                <div className="pt-3">
                  <Button onClick={() => navigate(`/leases?unitId=${unit.id}`)}>
                    Generate Lease
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Tenant Info */}
          {unit.tenant && (
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Tenant Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Name</span>
                  <span className="text-slate-800 dark:text-slate-200">{unit.tenant.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Email</span>
                  <span className="text-slate-800 dark:text-slate-200">{unit.tenant.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Phone</span>
                  <span className="text-slate-800 dark:text-slate-200">{unit.tenant.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Lease End</span>
                  <span className="text-slate-800 dark:text-slate-200">{unit.tenant.leaseEndDate}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {unit.notes && (
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Notes</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">{unit.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={onEdit}
              icon={<Edit2 className="w-4 h-4" />}
              className="flex-1"
            >
              Edit
            </Button>
            <Button
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
