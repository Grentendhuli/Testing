import { useState, useRef, useCallback } from 'react';
import { 
  AlertTriangle, CheckCircle, Wrench, Plus, Camera, X, Home, User, 
  Sparkles, History, Bell, UserCircle, ChevronDown, ChevronUp,
  FileImage, Loader2, AlertCircle, Clock, Filter, Search
} from 'lucide-react';
import { ComplianceFooter } from '../components/ComplianceFooter';
import { triageMaintenanceRequest } from '../services/gemini';
import type { MaintenanceTriage } from '../services/gemini';
import { UpgradeModal } from '../components/UpgradeModal';
import { useApp } from '../context/AppContext';
import { useAuth } from '@/features/auth';
import type { MaintenanceRequest, MaintenanceStatus, MaintenancePriority } from '../types';
import { supabase } from '@/lib/supabase';

const statusConfig: Record<MaintenanceStatus, { label: string; color: string; bg: string; icon: typeof AlertTriangle }> = {
  open: { label: 'Open', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: AlertTriangle },
  in_progress: { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: Clock },
  completed: { label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'text-slate-600', bg: 'bg-slate-500/10 border-slate-500/20', icon: X },
};

const priorityConfig: Record<MaintenancePriority, { label: string; color: string; bg: string }> = {
  emergency: { label: 'Emergency', color: 'text-red-400', bg: 'bg-red-500/20' },
  urgent: { label: 'Urgent', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  high: { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  medium: { label: 'Medium', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  low: { label: 'Low', color: 'text-slate-400', bg: 'bg-slate-500/20' },
  routine: { label: 'Routine', color: 'text-slate-400', bg: 'bg-slate-500/20' },
};

// Mock handymen/vendors list
const HANDYMEN = [
  { id: '1', name: 'John Smith', trade: 'General Repairs', phone: '555-0101' },
  { id: '2', name: 'Mike Johnson', trade: 'Plumbing', phone: '555-0102' },
  { id: '3', name: 'Dave Williams', trade: 'Electrical', phone: '555-0103' },
  { id: '4', name: 'Sarah Brown', trade: 'HVAC', phone: '555-0104' },
  { id: '5', name: 'Tom Davis', trade: 'Carpentry', phone: '555-0105' },
];

interface MaintenanceHistory {
  id: string;
  requestId: string;
  action: string;
  oldValue?: string;
  newValue: string;
  performedBy: string;
  timestamp: string;
}

export function Maintenance() {
  const { userData } = useAuth();
  const { units, maintenanceRequests, addMaintenanceRequest, updateMaintenanceRequest } = useApp();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<MaintenanceStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<MaintenancePriority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [triageResult, setTriageResult] = useState<MaintenanceTriage | null>(null);
  const [triageLoading, setTriageLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [history, setHistory] = useState<MaintenanceHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Photo upload state
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    assignedTo: string;
  }>({
    unitId: '',
    unitNumber: '',
    tenantName: '',
    title: '',
    description: '',
    priority: 'routine',
    status: 'open',
    notes: '',
    assignedTo: '',
  });

  const isFreeTier = !userData || userData.subscription_tier === 'free';

  const openRequests = maintenanceRequests.filter(r => r.status === 'open').length;
  const inProgressRequests = maintenanceRequests.filter(r => r.status === 'in_progress').length;
  const completedRequests = maintenanceRequests.filter(r => r.status === 'completed').length;

  // Filter requests based on status, priority, and search
  const filteredRequests = maintenanceRequests.filter(r => {
    const matchesStatus = filter === 'all' || r.status === filter;
    const matchesPriority = priorityFilter === 'all' || r.priority === priorityFilter;
    const matchesSearch = searchQuery === '' || 
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.unitNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tenantName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const handleCreateClick = () => {
    setShowAddModal(true);
    setUploadedPhotos([]);
    setTriageResult(null);
  };

  // Photo upload handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhotos(true);
    const newPhotos: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type and size
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 5 * 1024 * 1024) continue; // 5MB limit

      try {
        // Convert to base64 for preview
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const base64 = await base64Promise;
        newPhotos.push(base64);
      } catch (err) {
        console.error('Error reading file:', err);
      }
    }

    setUploadedPhotos(prev => [...prev, ...newPhotos]);
    setUploadingPhotos(false);
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddRequest = async () => {
    if (!newRequest.unitId || !newRequest.description) return;

    const unit = units.find(u => u.id === newRequest.unitId);
    if (!unit) return;

    // AI Triage — call in background, don't block submit
    const desc = newRequest.description || '';
    if (desc.length > 10) {
      setTriageLoading(true);
      setTriageResult(null);
      triageMaintenanceRequest(desc).then(result => {
        if (result.success && result.data.success && result.data.data) {
          setTriageResult(result.data.data);
        }
        setTriageLoading(false);
      }).catch(() => setTriageLoading(false));
    }

    await addMaintenanceRequest({
      unitId: unit.id,
      unitNumber: unit.unitNumber,
      tenantId: unit.tenant?.id,
      tenantName: newRequest.tenantName || unit.tenant?.name || 'Unknown',
      tenantPhone: unit.tenant?.phone || '',
      title: newRequest.title || 'Maintenance Request',
      description: newRequest.description,
      priority: newRequest.priority,
      status: newRequest.status,
      photos: uploadedPhotos,
      notes: newRequest.notes,
      assignedTo: newRequest.assignedTo || undefined,
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
      assignedTo: '',
    });
    setUploadedPhotos([]);
    setShowAddModal(false);
  };

  const handleStatusChange = async (id: string, newStatus: MaintenanceStatus) => {
    const request = maintenanceRequests.find(r => r.id === id);
    if (!request) return;

    const oldStatus = request.status;
    
    await updateMaintenanceRequest(id, { status: newStatus });

    // Add history entry
    const historyEntry: MaintenanceHistory = {
      id: `hist_${Date.now()}`,
      requestId: id,
      action: 'Status Change',
      oldValue: oldStatus,
      newValue: newStatus,
      performedBy: userData?.first_name || 'System',
      timestamp: new Date().toISOString(),
    };
    
    // In a real app, this would be saved to the database
    setHistory(prev => [historyEntry, ...prev]);

    // Send notification (mock)
    if (newStatus === 'completed' && request.tenantPhone) {
      console.log(`[Notification] Sending completion notification to tenant at ${request.tenantPhone}`);
    }
  };

  const handleAssignToHandyman = async (requestId: string, handymanId: string) => {
    const handyman = HANDYMEN.find(h => h.id === handymanId);
    if (!handyman) return;

    await updateMaintenanceRequest(requestId, { 
      assignedTo: handyman.name,
      status: 'in_progress'
    });

    // Add history entry
    const historyEntry: MaintenanceHistory = {
      id: `hist_${Date.now()}`,
      requestId: requestId,
      action: 'Assigned',
      newValue: handyman.name,
      performedBy: userData?.first_name || 'System',
      timestamp: new Date().toISOString(),
    };
    
    setHistory(prev => [historyEntry, ...prev]);
  };

  const loadHistory = async (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setShowHistoryModal(true);
    setHistoryLoading(true);

    // Mock history - in real app, fetch from database
    const mockHistory: MaintenanceHistory[] = [
      {
        id: '1',
        requestId: request.id,
        action: 'Created',
        newValue: 'Request created',
        performedBy: request.tenantName || 'Tenant',
        timestamp: request.createdAt,
      },
    ];

    if (request.status !== 'open') {
      mockHistory.push({
        id: '2',
        requestId: request.id,
        action: 'Status Change',
        oldValue: 'open',
        newValue: request.status,
        performedBy: userData?.first_name || 'Landlord',
        timestamp: request.updatedAt,
      });
    }

    if (request.assignedTo) {
      mockHistory.push({
        id: '3',
        requestId: request.id,
        action: 'Assigned',
        newValue: request.assignedTo,
        performedBy: userData?.first_name || 'Landlord',
        timestamp: request.updatedAt,
      });
    }

    setHistory(mockHistory);
    setHistoryLoading(false);
  };

  return (
    <div className="space-y-6">
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

      {/* Stats Cards */}
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'open', 'in_progress', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-lb-base text-lb-text-secondary hover:bg-lb-muted'
              }`}
            >
              {status === 'all' ? 'All Requests' : status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {(['all', 'emergency', 'urgent', 'high', 'medium', 'low', 'routine'] as const).map((priority) => (
            <button
              key={priority}
              onClick={() => setPriorityFilter(priority)}
              className={`px-4 py-3 min-h-[44px] rounded-lg text-xs font-medium transition-colors ${
                priorityFilter === priority
                  ? 'bg-blue-500 text-white'
                  : 'bg-lb-base text-lb-text-secondary hover:bg-lb-muted'
              }`}
            >
              {priority === 'all' ? 'All Priorities' : priorityConfig[priority]?.label || priority}
            </button>
          ))}
        </div>

        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lb-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search requests..."
            className="w-full pl-10 pr-4 py-2 bg-lb-base border border-lb-border rounded-lg text-lb-text-primary placeholder-lb-text-muted focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-lb-surface border border-lb-border rounded-xl p-8 text-center">
            <Wrench className="w-12 h-12 text-lb-text-secondary mx-auto mb-4" />
            <p className="text-lb-text-secondary">No maintenance requests found.</p>
            <p className="text-lb-text-muted text-sm mt-2">
              {filter === 'all' && priorityFilter === 'all' && !searchQuery 
                ? 'Great job keeping everything running smoothly!' 
                : 'Try adjusting your filters.'}
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => {
            const status = statusConfig[request.status] || statusConfig.open;
            const priority = priorityConfig[request.priority] || priorityConfig.routine;
            const StatusIcon = status.icon;

            return (
              <div
                key={request.id}
                className="bg-lb-surface border border-lb-border hover:border-lb-border/80 rounded-xl p-5 transition-all hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${status.bg}`}>
                      <StatusIcon className={`w-6 h-6 ${status.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold text-lb-text-primary">Unit {request.unitNumber}</h3>
                        <span className="text-sm text-lb-text-muted">• {request.tenantName}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priority.bg} ${priority.color}`}>
                          {priority.label}
                        </span>
                        {request.photos && request.photos.length > 0 && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <FileImage className="w-3 h-3" />
                            {request.photos.length} photo{request.photos.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-lb-text-secondary mt-1 max-w-xl">{request.description}</p>

                      <div className="flex items-center gap-4 mt-3 flex-wrap">
                        <span className="text-lb-text-muted text-sm">
                          {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'Unknown date'}
                        </span>
                        {request.assignedTo && (
                          <span className="text-blue-400 text-sm flex items-center gap-1">
                            <UserCircle className="w-3 h-3" />
                            Assigned: {request.assignedTo}
                          </span>
                        )}
                        {request.notes && (
                          <span className="text-slate-500 text-sm italic">Note: {request.notes}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadHistory(request)}
                      className="p-2 text-lb-text-muted hover:text-lb-text-secondary hover:bg-lb-base rounded-lg transition-colors"
                      title="View History"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    
                    <select
                      value={request.status}
                      onChange={(e) => handleStatusChange(request.id, e.target.value as MaintenanceStatus)}
                      className="px-4 py-3 min-h-[44px] min-w-[140px] rounded-lg text-sm font-medium border bg-lb-base border-lb-border text-lb-text-primary focus:outline-none focus:border-amber-500 touch-manipulation"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Assignment Section */}
                {!request.assignedTo && request.status !== 'completed' && request.status !== 'cancelled' && (
                  <div className="mt-4 pt-4 border-t border-lb-border">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-lb-text-secondary">Assign to:</span>
                      <div className="flex gap-2 flex-wrap">
                        {HANDYMEN.map(handyman => (
                          <button
                            key={handyman.id}
                            onClick={() => handleAssignToHandyman(request.id, handyman.id)}
                            className="px-3 py-1 text-xs bg-lb-base hover:bg-blue-500/20 border border-lb-border hover:border-blue-500/50 rounded-full text-lb-text-secondary hover:text-blue-400 transition-colors"
                          >
                            {handyman.name} ({handyman.trade})
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <ComplianceFooter />

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

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-2">Title</label>
                <input
                  type="text"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                  placeholder="Brief title of the issue"
                  className="w-full px-3 py-2.5 bg-lb-base border border-lb-border rounded-lg text-lb-text-primary placeholder-lb-text-muted focus:outline-none focus:border-amber-500/50"
                />
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
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
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

              {/* Assign to Handyman */}
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-2">Assign To (Optional)</label>
                <select
                  value={newRequest.assignedTo}
                  onChange={(e) => setNewRequest({ ...newRequest, assignedTo: e.target.value })}
                  className="w-full px-3 py-2.5 bg-lb-base border border-lb-border rounded-lg text-lb-text-primary focus:outline-none focus:border-amber-500/50"
                >
                  <option value="">Unassigned</option>
                  {HANDYMEN.map(handyman => (
                    <option key={handyman.id} value={handyman.name}>
                      {handyman.name} - {handyman.trade}
                    </option>
                  ))}
                </select>
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

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-2">Photos</label>
                <div 
                  className="p-4 rounded-xl border-2 border-dashed border-lb-border hover:border-amber-500/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center gap-3">
                    {uploadingPhotos ? (
                      <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5 text-lb-text-muted" />
                    )}
                    <span className="text-sm text-lb-text-secondary">
                      {uploadingPhotos ? 'Uploading...' : 'Click to upload photos'}
                    </span>
                  </div>
                  <p className="text-xs text-lb-text-muted text-center mt-1">
                    Max 5MB per image
                  </p>
                </div>

                {/* Photo Previews */}
                {uploadedPhotos.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {uploadedPhotos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={photo} 
                          alt={`Upload ${index + 1}`}
                          loading="lazy"
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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

      {/* History Modal */}
      {showHistoryModal && selectedRequest && (
        <div className="fixed inset-0 bg-lb-base/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-lb-surface border border-lb-border rounded-xl max-w-md w-full max-h-[80vh] overflow-auto">
            <div className="p-6 border-b border-lb-border flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-lb-text-primary">Request History</h2>
                <p className="text-sm text-lb-text-muted">Unit {selectedRequest.unitNumber}</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 text-lb-text-muted hover:text-lb-text-secondary hover:bg-lb-base rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-lb-text-muted mx-auto mb-4" />
                  <p className="text-lb-text-secondary">No history available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((entry) => (
                    <div key={entry.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-amber-500 rounded-full" />
                        <div className="w-0.5 flex-1 bg-lb-border" />
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-lb-text-primary">{entry.action}</span>
                          <span className="text-xs text-lb-text-muted">
                            {new Date(entry.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        {entry.oldValue && (
                          <p className="text-xs text-lb-text-muted mt-1">
                            Changed from "{entry.oldValue}" to "{entry.newValue}"
                          </p>
                        )}
                        {!entry.oldValue && (
                          <p className="text-xs text-lb-text-muted mt-1">{entry.newValue}</p>
                        )}
                        <p className="text-xs text-lb-text-muted mt-1">by {entry.performedBy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="Photo Uploads"
        featureDescription="Allow tenants to attach photos to maintenance requests. Visual documentation helps you assess issues before sending vendors."
      />
    </div>
  );
}

export default Maintenance;
