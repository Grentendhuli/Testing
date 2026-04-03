import { useEffect, useRef } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/Button';
import { PhoneInput } from '@/components/PhoneInput';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import type { UnitFormData, FormErrors, UnitStatus } from '../types/unit.types';

interface UnitFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  unitData: UnitFormData;
  setUnitData: React.Dispatch<React.SetStateAction<UnitFormData>>;
  formErrors: FormErrors;
  setFormErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
  createError: string | null;
  isSubmitting: boolean;
  mode: 'create' | 'edit';
}

export function UnitForm({
  isOpen,
  onClose,
  onSubmit,
  unitData,
  setUnitData,
  formErrors,
  setFormErrors,
  createError,
  isSubmitting,
  mode,
}: UnitFormProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);

  // Handle mount/unmount to prevent state updates on unmounted component
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Clear validation errors when mode changes between create/edit
  useEffect(() => {
    setFormErrors({});
  }, [mode, setFormErrors]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, isSubmitting]);

  if (!isOpen) return null;

  const handleChange = (field: keyof UnitFormData, value: string | number | boolean) => {
    if (!isMountedRef.current) return;
    
    // Use functional update to avoid stale state issues
    setUnitData(prev => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
    
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle number input changes - allow empty string during editing
  const handleNumberChange = (field: keyof UnitFormData, value: string) => {
    if (!isMountedRef.current) return;

    // Allow empty string for better UX when deleting
    if (value === '') {
      setUnitData(prev => {
        if (!prev) return prev;
        return { ...prev, [field]: 0 };
      });
    } else {
      const numValue = field === 'bathrooms' ? parseFloat(value) : parseInt(value, 10);
      setUnitData(prev => {
        if (!prev) return prev;
        return { ...prev, [field]: isNaN(numValue) ? 0 : numValue };
      });
    }
    
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle blur for number inputs - ensure value is set
  const handleNumberBlur = (field: keyof UnitFormData, value: number) => {
    // Ensure the value is at least 0
    if (value < 0 || isNaN(value)) {
      setUnitData(prev => {
        if (!prev) return prev;
        return { ...prev, [field]: 0 };
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSubmitting && isMountedRef.current) {
      onSubmit();
    }
  };

  const title = mode === 'create' ? 'Add New Unit' : 'Edit Unit';
  const submitLabel = mode === 'create' ? 'Create Unit' : 'Save Changes';
  const Icon = Plus;

  return (
    <motion.div
      ref={modalRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === modalRef.current && !isSubmitting) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl max-w-lg w-full max-h-[90vh] overflow-auto shadow-2xl"
      >
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800 z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Icon className="w-5 h-5 text-amber-500" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                {title}
              </h2>
            </div>
            <button 
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-50"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Property Address */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Property Address <span className="text-red-400">*</span>
              </label>
              <AddressAutocomplete
                value={unitData?.address || ''}
                onChange={(value) => handleChange('address', value)}
                placeholder="e.g., 123 Main St, Brooklyn, NY 11206"
                error={formErrors?.address}
                useGooglePlaces={!!(import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY}
              />
            </div>

            {/* Unit Number */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Unit Number <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                inputMode="text"
                autoComplete="address-unit" 
                enterKeyHint="next"
                value={unitData?.unitNumber || ''}
                onChange={(e) => handleChange('unitNumber', e.target.value)}
                placeholder="e.g., 1A, 2B, 101"
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                  formErrors?.unitNumber ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                }`}
              />
              {formErrors?.unitNumber && (
                <p className="mt-1 text-sm text-red-400">{formErrors.unitNumber}</p>
              )}
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">e.g. 1A, 2B, or Ground Floor</p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Status
              </label>
              <select
                value={unitData?.status || 'vacant'}
                onChange={(e) => handleChange('status', e.target.value as UnitStatus)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            {/* Bedrooms & Bathrooms */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Bedrooms <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  enterKeyHint="next"
                  value={unitData?.bedrooms === 0 ? '' : (unitData?.bedrooms || '')}
                  onChange={(e) => handleNumberChange('bedrooms', e.target.value)}
                  onBlur={() => handleNumberBlur('bedrooms', unitData?.bedrooms || 0)}
                  className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                    formErrors?.bedrooms ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                  }`}
                />
                {formErrors?.bedrooms && (
                  <p className="mt-1 text-sm text-red-400">{formErrors.bedrooms}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Bathrooms <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  inputMode="decimal"
                  enterKeyHint="next"
                  value={unitData?.bathrooms === 0 ? '' : (unitData?.bathrooms || '')}
                  onChange={(e) => handleNumberChange('bathrooms', e.target.value)}
                  onBlur={() => handleNumberBlur('bathrooms', unitData?.bathrooms || 0)}
                  className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                    formErrors?.bathrooms ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                  }`}
                />
                {formErrors?.bathrooms && (
                  <p className="mt-1 text-sm text-red-400">{formErrors.bathrooms}</p>
                )}
              </div>
            </div>

            {/* Square Feet */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Square Feet
              </label>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                enterKeyHint="next"
                value={unitData?.squareFeet === 0 ? '' : (unitData?.squareFeet || '')}
                onChange={(e) => handleNumberChange('squareFeet', e.target.value)}
                onBlur={() => handleNumberBlur('squareFeet', unitData?.squareFeet || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            {/* Monthly Rent */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Monthly Rent ($) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                inputMode="decimal"
                enterKeyHint="next"
                value={unitData?.rentAmount === 0 ? '' : (unitData?.rentAmount || '')}
                onChange={(e) => handleNumberChange('rentAmount', e.target.value)}
                onBlur={() => handleNumberBlur('rentAmount', unitData?.rentAmount || 0)}
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                  formErrors?.rentAmount ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                }`}
              />
              {formErrors?.rentAmount && (
                <p className="mt-1 text-sm text-red-400">{formErrors.rentAmount}</p>
              )}
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Monthly rent in dollars. Don't include utilities unless bundled.</p>
            </div>

            {/* Lease Setup (Optional) */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Lease Setup</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Optional, but recommended so the unit is fully configured.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={!!unitData?.includeLease}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setUnitData(prev => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          includeLease: checked,
                          ...(checked ? {} : {
                            leaseType: 'free-market',
                            leaseStart: '',
                            leaseEnd: '',
                            tenantName: '',
                            tenantEmail: '',
                            tenantPhone: '',
                            securityDeposit: 0,
                          }),
                        };
                      });
                      if (!checked) {
                        setFormErrors(prev => ({
                          ...prev,
                          leaseType: undefined,
                          leaseStart: undefined,
                          leaseEnd: undefined,
                          tenantName: undefined,
                        }));
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-400 bg-slate-50 dark:bg-slate-700 text-amber-500 focus:ring-amber-500/50"
                  />
                  Add lease now
                </label>
              </div>

              <AnimatePresence>
                {unitData?.includeLease && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 space-y-4 overflow-hidden"
                  >
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                        Lease Type <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={unitData?.leaseType || 'free-market'}
                        onChange={(e) => handleChange('leaseType', e.target.value)}
                        className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                          formErrors?.leaseType ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        <option value="free-market">Free Market</option>
                        <option value="rent-stabilized">Rent Stabilized</option>
                      </select>
                      {formErrors?.leaseType && (
                        <p className="mt-1 text-sm text-red-400">{formErrors.leaseType}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                          Lease Start <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="date"
                          value={unitData?.leaseStart || ''}
                          onChange={(e) => handleChange('leaseStart', e.target.value)}
                          className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                            formErrors?.leaseStart ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                          }`}
                        />
                        {formErrors?.leaseStart && (
                          <p className="mt-1 text-sm text-red-400">{formErrors.leaseStart}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                          Lease End <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="date"
                          value={unitData?.leaseEnd || ''}
                          onChange={(e) => handleChange('leaseEnd', e.target.value)}
                          className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                            formErrors?.leaseEnd ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                          }`}
                        />
                        {formErrors?.leaseEnd && (
                          <p className="mt-1 text-sm text-red-400">{formErrors.leaseEnd}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                        Tenant Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="tenant-name"
                        autoComplete="name"
                        inputMode="text"
                        enterKeyHint="next"
                        value={unitData?.tenantName || ''}
                        onChange={(e) => handleChange('tenantName', e.target.value)}
                        placeholder="e.g., Alex Rivera"
                        className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                          formErrors?.tenantName ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                        }`}
                      />
                      {formErrors?.tenantName && (
                        <p className="mt-1 text-sm text-red-400">{formErrors.tenantName}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                          Tenant Email
                        </label>
                        <input
                          type="email"
                          name="tenant-email"
                          autoComplete="email"
                          inputMode="email"
                          enterKeyHint="next"
                          value={unitData?.tenantEmail || ''}
                          onChange={(e) => handleChange('tenantEmail', e.target.value)}
                          placeholder="tenant@email.com"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                          Tenant Phone
                        </label>
                        <PhoneInput
                          value={unitData?.tenantPhone || ''}
                          onChange={(value) => handleChange('tenantPhone', value)}
                          name="tenant-phone"
                          placeholder="(212) 555-0199"
                          autoComplete={true}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                        Security Deposit
                      </label>
                      <input
                        type="number"
                        min="0"
                        inputMode="decimal"
                        enterKeyHint="done"
                        value={unitData?.securityDeposit === 0 ? '' : (unitData?.securityDeposit || '')}
                        onChange={(e) => handleNumberChange('securityDeposit', e.target.value)}
                        onBlur={() => handleNumberBlur('securityDeposit', unitData?.securityDeposit || 0)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Leave blank to match the monthly rent.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Notes
              </label>
              <textarea
                value={unitData?.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
              />
            </div>

            {/* Error Message */}
            {createError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{createError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                loading={isSubmitting}
                className="flex-1"
              >
                {submitLabel}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default UnitForm;
