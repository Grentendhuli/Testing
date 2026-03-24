import { motion } from 'framer-motion';
import { Users, Home, Wrench, Edit2, FileText, QrCode, MessageSquare, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HealthScoreRing } from '@/components/HealthScoreRing';
import type { Unit, UnitStatus, HealthBreakdown } from '../types/unit.types';

const statusConfig: Record<UnitStatus, { 
  label: string; 
  color: string; 
  bg: string;
  icon: React.ElementType;
}> = {
  occupied: { 
    label: '● Occupied', 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-50 border-emerald-200',
    icon: Users
  },
  vacant: { 
    label: '○ Vacant', 
    color: 'text-amber-600', 
    bg: 'bg-amber-50 border-amber-200',
    icon: Home
  },
  maintenance: { 
    label: '🔧 In Maintenance', 
    color: 'text-orange-600', 
    bg: 'bg-orange-50 border-orange-200',
    icon: Wrench
  },
};

interface UnitCardProps {
  unit: Unit;
  index: number;
  unitHealth: HealthBreakdown;
  onSelect: (unit: Unit) => void;
  onEdit: (unit: Unit) => void;
  onDelete?: (unit: Unit) => void;
  formatDate: (dateString: string) => string;
  onTenantConnect?: (unit: Unit) => void;
  botUsername?: string;
  expandedQR?: boolean;
  onToggleQR?: () => void;
  isSelected?: boolean;
  onSelectToggle?: (unitId: string, selected: boolean) => void;
  selectionMode?: boolean;
}

export function UnitCard({ 
  unit, 
  index, 
  unitHealth, 
  onSelect, 
  onEdit,
  onDelete,
  formatDate,
  onTenantConnect,
  botUsername,
  expandedQR,
  onToggleQR,
  isSelected = false,
  onSelectToggle,
  selectionMode = false,
}: UnitCardProps) {
  const navigate = useNavigate();
  const status = statusConfig[unit.status];
  const StatusIcon = status.icon;
  const qrUrl = botUsername 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`https://t.me/${botUsername}?start=unit_${unit.id}`)}&color=1E3A5F`
    : '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => {
        if (selectionMode && onSelectToggle) {
          onSelectToggle(unit.id, !isSelected);
        } else {
          onSelect(unit);
        }
      }}
      className={`group bg-white dark:bg-slate-800 border rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 relative ${
        isSelected 
          ? 'border-amber-500 ring-2 ring-amber-500/20' 
          : 'border-slate-200 dark:border-slate-700 hover:border-amber-500/50 dark:hover:border-amber-400/50'
      }`}
    >
      {selectionMode && (
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelectToggle?.(unit.id, e.target.checked);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
          />
        </div>
      )}
      {/* Header with Health Ring */}
      <div className={`flex justify-between items-start mb-4 ${selectionMode ? 'pl-8' : ''}`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${status.bg}`}>
            <StatusIcon className={`w-6 h-6 ${status.color}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Unit {unit.unitNumber}
            </h3>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {unit.bedrooms} BR / {unit.bathrooms} BA
            </span>
          </div>
        </div>
        <HealthScoreRing score={unitHealth.score} size="sm" />
      </div>
      
      {/* Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">Rent</span>
          <span className="text-slate-900 dark:text-slate-100 font-medium">
            ${unit.rentAmount.toLocaleString()}/mo
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">Status</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.bg} ${status.color}`}>
            {status.label}
          </span>
        </div>
        
        {/* Vacant unit nudge */}
        {unit.status === 'vacant' && (
          <p className="text-xs text-amber-600 italic mt-1">Ready to list — no income while vacant</p>
        )}
        
        {unit.tenant && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Tenant</span>
              <span className="text-slate-600 dark:text-slate-300 truncate max-w-[120px]">
                {unit.tenant.name}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Lease ends</span>
              <span className="text-slate-600 dark:text-slate-300">
                {formatDate(unit.tenant.leaseEndDate)}
              </span>
            </div>
          </>
        )}

        {/* Create Listing button for vacant units */}
        {unit.status === 'vacant' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate('/listings?unitId=' + unit.id);
            }}
            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 border border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white rounded-lg transition-colors text-sm font-medium"
          >
            <FileText className="w-4 h-4" />
            📋 Create Listing
          </button>
        )}

        {/* Tenant Connect Card button - on ALL units */}
        {onTenantConnect && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTenantConnect(unit);
            }}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 border border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white rounded-lg transition-colors text-sm font-medium"
          >
            <MessageSquare className="w-4 h-4" />
            📲 Tenant Connect Card
          </button>
        )}

        {/* Quick QR toggle */}
        {onToggleQR && (
          <div className="mt-3">
            {!expandedQR ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleQR();
                }}
                className="text-xs text-slate-400 hover:text-slate-600 underline"
              >
                Show QR code
              </button>
            ) : (
              <div className="text-center">
                {botUsername ? (
                  <>
                    <img
                      src={qrUrl}
                      width={120}
                      height={120}
                      alt="QR Code"
                      className="mx-auto rounded-lg border border-slate-100 p-2"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Unit {unit.unitNumber} · Tenant scans to connect
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-amber-600">
                    Set up bot in Settings to generate QR
                  </p>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleQR();
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 underline mt-2"
                >
                  Hide
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions - Always Visible */}
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            console.log('[UnitCard] Edit button clicked for unit:', unit.unitNumber);
            onEdit(unit);
          }}
          className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
          title="Edit unit"
          type="button"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (typeof onDelete === 'function') {
                onDelete(unit);
              }
            }}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete unit"
            type="button"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
