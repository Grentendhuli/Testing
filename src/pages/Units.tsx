import { useState, useMemo, useCallback } from 'react';
import { Plus, Building2, Users, Home, Wrench, Search, Filter, ArrowUpDown, FileText, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ComplianceFooter } from '@/components/ComplianceFooter';
import { Button } from '@/components/Button';
import { EmptyStateCard, MetricCard } from '@/components/Card';
import { SkeletonUnits } from '@/components/Skeleton';
import { PageHeader } from '@/components/Breadcrumb';
import { TenantConnectCard } from '@/components/TenantConnectCard';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/features/auth';
import { useNavigate } from 'react-router-dom';
import type { Unit } from '@/types';

// Feature imports
import { 
  useUnits, 
  UnitList, 
  UnitForm, 
  UnitDetails,
  type UnitFormData,
  type HealthBreakdown,
} from '@/features/units';

export function Units() {
  const { units, updateUnit, addUnit, deleteUnit, addLease, payments, maintenanceRequests, leases, isLoading } = useApp();
  const { userData } = useAuth();
  const navigate = useNavigate();
  const botUsername = userData?.bot_phone_number || '';
  
  // Local state for modals
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editedUnit, setEditedUnit] = useState<Partial<Unit>>({});
  const [inviteUnit, setInviteUnit] = useState<Unit | null>(null);
  const [expandedQR, setExpandedQR] = useState<Record<string, boolean>>({});

  // Use the units feature hook
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    newUnit,
    setNewUnit,
    formErrors,
    setFormErrors,
    createError,
    setCreateError,
    isSubmitting,
    setIsSubmitting,
    filteredUnits,
    occupiedCount,
    vacantCount,
    maintenanceCount,
    calculateUnitHealth,
    validateForm,
    resetForm,
    initialUnitForm,
  } = useUnits({
    units,
    payments,
    maintenanceRequests,
    leases,
  });

  const handleEdit = useCallback((unit: Unit) => {
    setSelectedUnit(unit);
    setEditedUnit(unit);
    setIsEditing(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (selectedUnit && editedUnit) {
      try {
        // Ensure numeric values
        const updates = {
          ...editedUnit,
          bedrooms: Number(editedUnit.bedrooms) || selectedUnit.bedrooms,
          bathrooms: Number(editedUnit.bathrooms) || selectedUnit.bathrooms,
          rentAmount: Number(editedUnit.rentAmount) || selectedUnit.rentAmount,
          squareFeet: Number(editedUnit.squareFeet) || selectedUnit.squareFeet,
        };
        await updateUnit(selectedUnit.id, updates);
        setIsEditing(false);
        setSelectedUnit(null);
      } catch (err) {
        console.error('Update unit error:', err);
        setCreateError(err instanceof Error ? err.message : 'Failed to update unit');
      }
    }
  }, [selectedUnit, editedUnit, updateUnit]);

  const handleClose = useCallback(() => {
    setSelectedUnit(null);
    setIsEditing(false);
    setIsCreating(false);
    setEditedUnit({});
    resetForm();
  }, [resetForm]);

  const handleCreateUnit = async () => {
    // Validate form
    const { isValid, errors } = validateForm(newUnit);
    if (!isValid) {
      setFormErrors(errors);
      return;
    }

    setCreateError(null);
    setIsSubmitting(true);
    
    try {
      // Ensure all numeric values are properly typed
      const unitData = {
        ...newUnit,
        bedrooms: Number(newUnit.bedrooms) || 0,
        bathrooms: Number(newUnit.bathrooms) || 0,
        rentAmount: Number(newUnit.rentAmount) || 0,
        squareFeet: Number(newUnit.squareFeet) || 0,
        securityDeposit: newUnit.includeLease ? (Number(newUnit.securityDeposit) || newUnit.rentAmount) : 0,
      };

      const createdUnit = await addUnit(unitData);
      if (!createdUnit) {
        throw new Error('Unable to create unit. Please ensure you are logged in and try again.');
      }
      
      if (newUnit.includeLease && newUnit.tenantName) {
        const securityDeposit = typeof newUnit.securityDeposit === 'number'
          ? newUnit.securityDeposit
          : newUnit.rentAmount;

        await addLease({
          unitId: createdUnit.id,
          unitNumber: createdUnit.unitNumber,
          tenantName: newUnit.tenantName || 'Tenant',
          tenantEmail: newUnit.tenantEmail || '',
          tenantPhone: newUnit.tenantPhone || '',
          startDate: newUnit.leaseStart || '',
          endDate: newUnit.leaseEnd || '',
          rentAmount: newUnit.rentAmount,
          securityDeposit,
          leaseType: newUnit.leaseType || 'free-market',
          status: 'active',
          notes: '',
        });
      }
      
      setIsCreating(false);
      resetForm();
    } catch (err) {
      console.error('Create unit error:', err);
      setCreateError(err instanceof Error ? err.message : 'Failed to add unit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCreate = useCallback(() => {
    setIsCreating(true);
    setNewUnit(initialUnitForm);
    setFormErrors({});
  }, [initialUnitForm]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  // Selected unit health data
  const selectedUnitHealth = useMemo(() => {
    if (!selectedUnit) return null;
    return calculateUnitHealth(selectedUnit);
  }, [selectedUnit, calculateUnitHealth]);

  const selectedUnitLease = useMemo(() => {
    if (!selectedUnit) return null;
    return leases.find(lease => lease.unitId === selectedUnit.id) || null;
  }, [leases, selectedUnit]);

  if (isLoading) {
    return (
      <div className="space-y-6 px-6 py-6">
        <SkeletonUnits />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-6 py-6">
      {/* Header */}
      <PageHeader
        title="Units Management"
        description="Manage all your units — unlimited and completely free"
      >
        <Button 
          onClick={handleOpenCreate}
          icon={<Plus className="w-4 h-4" />}
        >
          Add Unit
        </Button>
      </PageHeader>

      {/* Stats Overview */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <MetricCard
          title="Occupied"
          value={occupiedCount}
          icon={<Users className="w-5 h-5" />}
          variant="success"
        />

        <MetricCard
          title="Vacant"
          value={vacantCount}
          icon={<Home className="w-5 h-5" />}
          variant="warning"
        />

        <MetricCard
          title="Maintenance"
          value={maintenanceCount}
          icon={<Wrench className="w-5 h-5" />}
          variant={maintenanceCount > 0 ? 'danger' : 'default'}
        />
      </motion.div>

      {/* Filters & Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search units, addresses, tenants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'occupied' | 'vacant' | 'maintenance' | 'all')}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            <option value="all">All Status</option>
            <option value="occupied">Occupied</option>
            <option value="vacant">Vacant</option>
            <option value="maintenance">Maintenance</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'rent' | 'status' | 'number')}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            <option value="number">Sort by Unit</option>
            <option value="rent">Sort by Rent</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>
      </motion.div>

      {/* Empty State */}
      <AnimatePresence>
        {units.length === 0 && !isCreating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <EmptyStateCard
              title="You haven't added any units yet."
              description="Let's get your portfolio set up. Add your first unit to start tracking rent, maintenance, and tenant information."
              icon={<Building2 className="w-10 h-10" />}
              action={
                <Button
                  onClick={handleOpenCreate}
                  icon={<Plus className="w-5 h-5" />}
                  size="lg"
                >
                  Add Your First Unit
                </Button>
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Units Grid */}
      <UnitList
        units={filteredUnits}
        allUnits={units}
        calculateUnitHealth={calculateUnitHealth}
        onSelectUnit={setSelectedUnit}
        onEditUnit={handleEdit}
        onDeleteUnit={async (unit) => {
          if (confirm(`Are you sure you want to delete Unit ${unit.unitNumber}? This action cannot be undone.`)) {
            await deleteUnit(unit.id);
          }
        }}
        formatDate={formatDate}
        onTenantConnect={setInviteUnit}
        botUsername={botUsername}
        expandedQR={expandedQR}
        onToggleQR={(unitId) => setExpandedQR(prev => ({ ...prev, [unitId]: !prev[unitId] }))}
      />

      {/* Create Unit Modal */}
      <UnitForm
        isOpen={isCreating}
        onClose={handleClose}
        onSubmit={handleCreateUnit}
        unitData={newUnit}
        setUnitData={setNewUnit}
        formErrors={formErrors}
        setFormErrors={setFormErrors}
        createError={createError}
        isSubmitting={isSubmitting}
        mode="create"
      />

      {/* Edit Unit Modal */}
      {selectedUnit && isEditing && (
        <UnitForm
          isOpen={isEditing}
          onClose={handleClose}
          onSubmit={handleSave}
          unitData={{
            address: selectedUnit.address || '',
            unitNumber: selectedUnit.unitNumber,
            status: selectedUnit.status,
            bedrooms: selectedUnit.bedrooms || 0,
            bathrooms: selectedUnit.bathrooms || 0,
            squareFeet: selectedUnit.squareFeet || 0,
            rentAmount: selectedUnit.rentAmount,
            notes: selectedUnit.notes || '',
            includeLease: false,
          }}
          setUnitData={(data) => setEditedUnit({ ...editedUnit, ...data })}
          formErrors={formErrors}
          setFormErrors={setFormErrors}
          createError={null}
          isSubmitting={isSubmitting}
          mode="edit"
        />
      )}

      {/* Unit Detail Modal */}
      <UnitDetails
        unit={selectedUnit}
        isOpen={!!selectedUnit && !isEditing}
        onClose={handleClose}
        onEdit={() => setIsEditing(true)}
        unitHealth={selectedUnitHealth}
        lease={selectedUnitLease}
      />

      {/* Tenant Connect Card Modal */}
      {inviteUnit && (
        <TenantConnectCard
          isOpen={!!inviteUnit}
          onClose={() => setInviteUnit(null)}
          unitNumber={inviteUnit.unitNumber}
          unitId={inviteUnit.id}
          tenantName={inviteUnit.tenantName}
          botUsername={botUsername}
          propertyAddress={userData?.property_address || ''}
        />
      )}

      <ComplianceFooter />
    </div>
  );
}

export default Units;
