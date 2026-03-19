// @ts-nocheck
import { useState } from 'react';
import { AlertTriangle, CheckCircle, Wrench, Plus, Camera, X, Home, User, Lock, Sparkles } from 'lucide-react';
import { ComplianceFooter } from '../components/ComplianceFooter';
import { triageMaintenanceRequest } from '../services/gemini';
import type { MaintenanceTriage } from '../services/gemini';
import { UpgradeModal } from '../components/UpgradeModal';
import { useApp } from '../context/AppContext';
import { useAuth } from '@/features/auth';
import type { MaintenanceRequest, MaintenanceStatus, MaintenancePriority } from '../types';

const statusConfig: Record<MaintenanceStatus, { label: string; color: string; bg: string }> = {
  open: { label: 'Open', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  in_progress: { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  completed: { label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  cancelled: { label: 'Cancelled', color: 'text-slate-600', bg: 'bg-slate-500/10 border-slate-500/20' },
};

const priorityConfig: Record<MaintenancePriority, { label: string; color: string }> = {
  emergency: { label: 'Emergency', color: 'text-red-400' },
  urgent: { label: 'Urgent', color: 'text-amber-400' },
  routine: { label: 'Routine', color: 'text-slate-600' },
};

export function Maintenance() {
  const { userData } = useAuth();
  const { units, maintenanceRequests, addMaintenanceRequest, updateMaintenanceRequest } = useApp();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<MaintenanceStatus | 'all'>('all');
  const [triageResult, setTriageResult] = useState<MaintenanceTriage | null>(null);
  const [triageLoading, setTriageLoading] = useState(false);

  // Form state for new request
  const [newRequest, setNewRequest] = useState<{
    unitId: string;
    unitNumber: string;
    tenantName: string;
    tenantId?: string;
    title: string;
    description: string;
    priority: MaintenancePriority;
    status: MaintenanceStatus;
    notes: string;
  }>({
    unitId: '',
    unitNumber: '',
    tenantName: '',
    title: '',
    description: '',
    priority: 'routine',
    status: 'open',
    notes: '',
  });

  const isFreeTier = !userData || userData.subscription_tier === 'free';

  const openRequests = maintenanceRequests.filter(r => r.status === 'open').length;
  const inProgressRequests = maintenanceRequests.filter(r => r.status === 'in_progress').length;
  const completedRequests = maintenanceRequests.filter(r => r.status === 'completed').length;

  const filteredRequests = filter === 'all' 
    ? maintenanceRequests 
    : maintenanceRequests.filter(r => r.status === filter);

  const handleCreateClick = () => {
    // Free users can create text-only maintenance requests
    setShowAddModal(true);
  };

  const handlePhotoClick = () => {
    // Photos are allowed on free tier - unlimited features
    // No upgrade check needed
  };

  const handleAddRequest = () => {
    if (!newRequest.unitId || !newRequest.description) return;

    const unit = units.find(u => u.id === newRequest.unitId);
    if (!unit) return;

    // AI Triage — call in background, don't block submit
    const desc = newRequest.description || '';
    if (desc.length > 10) {
      setTriageLoading(true);
      setTriageResult(null);
      triageMaintenanceRequest(desc).then(result => {
        setTriageResult(result);
        setTriageLoading(false);
      }).catch(() => setTriageLoading(false));
    }

    addMaintenanceRequest({
      unitId: unit.id,
      unitNumber: unit.unitNumber,
      tenantId: unit.tenant?.id,
      tenantName: newRequest.tenantName || unit.tenant?.name || 'Unknown',
      tenantPhone: unit.tenant?.phone || '',
      title: newRequest.title || 'Maintenance Request',
      description: newRequest.description,
      priority: newRequest.priority,
      status: newRequest.status,
      photos: [],
      notes: newRequest.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Reset form and close modal
    setNewRequest({
      unitId: '',
      unitNumber: '',
      tenantName: '',
      title: '',
      description: '',
      priority: 'routine',
      status: 'open',
      notes: '',
    });
    setShowAddModal(false);
  };

  const handleStatusChange = (id: string, newStatus: MaintenanceStatus) => {
    updateMaintenanceRequest(id, { status: newStatus });
  };

  return (
    <div className="space-y-6">
      {/* UpgradeBanner removed - all features free */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-lb-text-primary">Maintenance Requests</h1>
          <p className="text-lb-text-secondary mt-1">Track and manage repair requests</p>
        </div>
        <button
          onClick={handleCreateClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Request
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">{openRequests}</p>
              <p className="text-sm text-lb-text-muted">Open</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Wrench className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">{inProgressRequests}</p>
              <p className="text-sm text-lb-text-muted">In Progress</p>
            </div>
          </div>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">{completedRequests}</p>
              <p className="text-sm text-lb-text-muted">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Photo uploads are now available on free tier */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Camera className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-400">Photo Uploads Included</p>
              <p className="text-xs text-emerald-400/70">Tenants can attach photos to show damage — available on free tier</p>
            </div>
          </div>
          <CheckCircle className="w-5 h-5 text-emerald-400" />
        </div>
      </div>

      <div className="flex gap-2">
        {(['all', 'open', 'in_progress', 'completed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-amber-500 text-slate-950'
                : 'bg-lb-base text-lb-text-secondary hover:bg-lb-muted'
            }`}
          >
            {status === 'all' ? 'All Requests' : status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-lb-surface border border-lb-border rounded-xl p-8 text-center">
            <Wrench className="w-12 h-12 text-lb-text-secondary mx-auto mb-4" />
            <p className="text-lb-text-secondary">All clear! No maintenance requests right now.</p>
            <p className="text-lb-text-muted text-sm mt-2">{filter === 'all' ? 'Great job keeping everything running smoothly!' : `No ${filter.replace('_', ' ')} requests.`}</p>
            {!isFreeTier && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Your First Request
              </button>
            )}
          </div>
        ) : (
          filteredRequests.map((request) => {
            const status = statusConfig[request.status] || statusConfig.open;
            const priority = priorityConfig[request.priority] || priorityConfig.routine;

            return (
              <div
                key={request.id}
                className="bg-lb-surface border border-lb-border hover:border-lb-border/80 rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${status.bg}`}>
                      <AlertTriangle className={`w-6 h-6 ${status.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold text-lb-text-primary">Unit {request.unitNumber}</h3>
                        <span className="text-sm text-lb-text-muted">• {request.tenantName}</span>
                        <span className={`text-sm font-medium ${priority.color}`}>{priority.label}</span>
                      </div>
                      <p className="text-lb-text-secondary mt-1 max-w-xl">{request.description}</p>

                      <div className="flex items-center gap-4 mt-3 flex-wrap">
                        <span className="text-lb-text-muted text-sm">{request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'Unknown date'}</span>
                        {!isFreeTier && request.photos && request.photos.length > 0 && (
                          <span className="text-slate-500 text-sm flex items-center gap-1">
                            <Camera className="w-4 h-4" />
                            {request.photos.length} photo{request.photos.length > 1 ? 's' : ''}
                          </span>
                        )}
                        {request.notes && (
                          <span className="text-slate-500 text-sm italic">Note: {request.notes}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select
                      value={request.status}
                      onChange={(e) => handleStatusChange(request.id, e.target.value as MaintenanceStatus)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border bg-lb-base border-lb-border text-lb-text-primary focus:outline-none focus:border-amber-500`}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ComplianceFooter />

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="Photo Uploads"
        featureDescription="Allow tenants to attach photos to maintenance requests. Visual documentation helps you assess issues before sending vendors."
      />

      {/* Add Request Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-lb-base/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-lb-surface border border-lb-border rounded-xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-lb-border flex items-center justify-between">
              <h2 className="text-xl font-semibold text-lb-text-primary">New Maintenance Request</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-lb-text-muted hover:text-lb-text-secondary hover:bg-lb-base rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Unit Selection */}
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-2">Unit *</label>
                <select
                  value={newRequest.unitId}
                  onChange={(e) => {
                    const unit = units.find(u => u.id === e.target.value);
                    setNewRequest({
                      ...newRequest,
                      unitId: e.target.value,
                      unitNumber: unit?.unitNumber || '',
                      tenantName: unit?.tenant?.name || '',
                      tenantId: unit?.tenant?.id,
                    });
                  }}
                  className="w-full px-3 py-2.5 bg-lb-base border border-lb-border rounded-lg text-lb-text-primary focus:outline-none focus:border-amber-500/50"
                >
                  <option value="">Select a unit</option>
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.unitNumber} {unit.tenant?.name ? `- ${unit.tenant.name}` : '(Vacant)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-2">Description *</label>
                <textarea
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  placeholder="Describe the maintenance issue..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-lb-base border border-lb-border rounded-lg text-lb-text-primary placeholder-lb-text-muted focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>

              {/* Priority & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-lb-text-secondary mb-2">Priority</label>
                  <select
                    value={newRequest.priority}
                    onChange={(e) => setNewRequest({ ...newRequest, priority: e.target.value as MaintenancePriority })}
                    className="w-full px-3 py-2.5 bg-lb-base border border-lb-border rounded-lg text-lb-text-primary focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="routine">Routine</option>
                    <option value="urgent">Urgent</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-lb-text-secondary mb-2">Status</label>
                  <select
                    value={newRequest.status}
                    onChange={(e) => setNewRequest({ ...newRequest, status: e.target.value as MaintenanceStatus })}
                    className="w-full px-3 py-2.5 bg-lb-base border border-lb-border rounded-lg text-lb-text-primary focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-2">Notes (Optional)</label>
                <input
                  type="text"
                  value={newRequest.notes}
                  onChange={(e) => setNewRequest({ ...newRequest, notes: e.target.value })}
                  placeholder="Add any additional notes..."
                  className="w-full px-3 py-2.5 bg-lb-base border border-lb-border rounded-lg text-lb-text-primary placeholder-lb-text-muted focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Photo Upload - Gated for Free Tier */}
              <div className={`p-4 rounded-xl border-2 border-dashed transition-colors ${
                isFreeTier
                  ? 'bg-lb-base border-lb-border cursor-pointer hover:border-amber-500/50'
                  : 'bg-lb-base border-lb-border'
              }`}
              onClick={isFreeTier ? handlePhotoClick : undefined}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isFreeTier ? 'bg-lb-muted' : 'bg-amber-500/20'
                  }`}>
                    {isFreeTier ? (
                      <Lock className="w-5 h-5 text-lb-text-muted" />
                    ) : (
                      <Camera className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${isFreeTier ? 'text-lb-text-secondary' : 'text-lb-text-primary'}`}>
                      {isFreeTier ? 'Photo Uploads Locked' : 'Attach Photos'}
                    </p>
                    <p className="text-sm text-lb-text-muted">
                      {isFreeTier
                        ? 'Upgrade to Concierge to allow photo uploads from tenants'
                        : 'Click to upload photos of the issue'}
                    </p>
                  </div>
                  {isFreeTier && (
                    <span className="text-xs font-medium text-amber-400 px-2 py-1 bg-amber-500/10 rounded">
                      Upgrade
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 bg-lb-base hover:bg-lb-muted text-lb-text-secondary rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRequest}
                  disabled={!newRequest.unitId || !newRequest.description}
                  className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-lb-muted disabled:text-lb-text-muted text-slate-950 font-medium rounded-lg transition-colors"
                >
                  Create Request
                </button>
              </div>

              {/* AI Triage Result Panel */}
              {(triageLoading || triageResult) && (
                <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
                  <p className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> AI Analysis
                  </p>
                  {triageLoading && <p className="text-lb-text-muted text-sm">Analyzing request...</p>}
                  {triageResult && (
                    <>
                      <div className="flex gap-3 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          triageResult.priority === 'Emergency' ? 'bg-red-500/20 text-red-400' :
                          triageResult.priority === 'Urgent' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>{triageResult.priority}</span>
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold">Trade: {triageResult.trade}</span>
                        <span className="px-3 py-1 bg-lb-muted text-lb-text-secondary rounded-full text-xs">{triageResult.estimatedCostRange}</span>
                        {triageResult.hpdRisk && <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold">⚠ HPD Risk</span>}
                      </div>
                      <div className="bg-lb-base rounded-lg p-3">
                        <p className="text-lb-text-muted text-xs mb-1">Suggested tenant message:</p>
                        <p className="text-lb-text-secondary text-sm">{triageResult.tenantMessage}</p>
                      </div>
                      {triageResult.hpdNote && <p className="text-amber-300 text-xs">{triageResult.hpdNote}</p>}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-lb-base/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-lb-surface border border-lb-border rounded-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                <Camera className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-lb-text-primary mb-2">Photo Uploads in Premium</h2>
              <p className="text-lb-text-secondary mb-6">
                Tenants can attach photos to maintenance requests so you can see the problem before sending someone out.
                <br /><br />
                Upgrade to Premium for:
              </p>

              <ul className="text-left text-sm text-lb-text-secondary mb-6 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Photo and video uploads
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Unlimited maintenance requests
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Vendor assignment and tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Cost tracking
                </li>
              </ul>

              <div className="flex flex-col gap-3">
                <a
                  href="/billing"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg transition-colors text-center block"
                >
                  Upgrade to Premium - $75/mo
                </a>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full py-3 border border-lb-border hover:bg-lb-base text-lb-text-secondary rounded-lg transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
