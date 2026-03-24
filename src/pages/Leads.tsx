import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lead } from '../types';
import { Plus, Phone, Mail, Trash2, Edit2, Calendar, DollarSign, Clock, X, Check, Users, Sparkles } from 'lucide-react';
import { SmartLeadResponseModal } from '../components/SmartLeadResponseModal';

export function Leads() {
  const { leads, updateLead, addLead, deleteLead } = useApp();
  const [editingLead, setEditingLead] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  
  // AI Lead Response Modal state
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [selectedLeadForResponse, setSelectedLeadForResponse] = useState<Lead | null>(null);
  
  const [newLead, setNewLead] = useState<Partial<Lead>>({
    status: 'new',
    notes: '',
    budget: undefined,
    moveInDate: '',
    bedrooms: undefined,
    bathrooms: undefined,
  });

  const leadStatusColors: Record<string, string> = {
    new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    contacted: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    qualified: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    showing: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead.id);
    setEditForm({ ...lead });
  };

  const handleSave = () => {
    if (editingLead && editForm) {
      updateLead(editingLead, editForm);
      setEditingLead(null);
      setEditForm({});
    }
  };

  const handleCancel = () => {
    setEditingLead(null);
    setEditForm({});
  };

  const handleAdd = () => {
    if (newLead.name && newLead.phone && newLead.email) {
      addLead({
        name: newLead.name,
        phone: newLead.phone,
        email: newLead.email,
        status: (newLead.status as Lead['status']) || 'new',
        notes: newLead.notes || '',
        budget: newLead.budget,
        moveInDate: newLead.moveInDate,
        bedrooms: newLead.bedrooms,
        bathrooms: newLead.bathrooms,
        inquiryDate: new Date().toISOString(),
      });
      setNewLead({
        status: 'new',
        notes: '',
        budget: undefined,
        moveInDate: '',
        bedrooms: undefined,
        bathrooms: undefined,
      });
      setShowAddModal(false);
    }
  };

  const handleDelete = (leadId: string) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      deleteLead(leadId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads Management</h1>
          <p className="text-lb-text-secondary mt-1">Track and manage prospective tenants</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: leads.length, icon: <Plus className="w-4 h-4" />, color: 'text-amber-400' },
          { label: 'New', value: leads.filter(l => l.status === 'new').length, icon: <Clock className="w-4 h-4" />, color: 'text-blue-400' },
          { label: 'Qualified', value: leads.filter(l => l.status === 'qualified').length, icon: <Check className="w-4 h-4" />, color: 'text-emerald-400' },
          { label: 'Contacted', value: leads.filter(l => l.status === 'contacted').length, icon: <Phone className="w-4 h-4" />, color: 'text-yellow-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-lb-surface border border-lb-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={stat.color}>{stat.icon}</span>
              <span className="text-sm text-lb-text-secondary">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Leads List */}
      <div className="bg-lb-surface border border-lb-border rounded-lg">
        <div className="p-4 border-b border-lb-border">
          <h2 className="text-lg font-semibold text-white">All Leads</h2>
        </div>
        <div className="divide-y divide-slate-800">
          {leads.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-2">No leads yet — here's how they'll come in</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-6">
                Once your Telegram bot is active, tenant inquiries from your listing will appear here automatically. 
                Each inquiry shows the tenant's name, what they're asking, and when they reached out.
              </p>
              <a 
                href="/config" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium rounded-lg transition-colors"
              >
                Set up my Telegram bot →
              </a>
              <p className="text-xs text-slate-400 mt-4">
                Already have a bot? Messages may take a few minutes to appear.
              </p>
            </div>
          ) : (
            leads.map((lead) => (
            <div key={lead.id} className="p-4 hover:bg-lb-base transition-colors">
              {editingLead === lead.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-white focus:outline-none focus:border-amber-500"
                      placeholder="Name"
                    />
                    <input
                      type="tel"
                      value={editForm.phone || ''}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-white focus:outline-none focus:border-amber-500"
                      placeholder="Phone"
                    />
                    <input
                      type="email"
                      value={editForm.email || ''}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-white focus:outline-none focus:border-amber-500"
                      placeholder="Email"
                    />
                    <select
                      value={editForm.status || 'new'}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Lead['status'] })}
                      className="px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="showing">Showing</option>
                      <option value="closed">Closed</option>
                    </select>
                    <input
                      type="text"
                      value={editForm.notes || ''}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      className="px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-white focus:outline-none focus:border-amber-500"
                      placeholder="Notes"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleSave}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-3 py-1.5 bg-lb-muted hover:bg-lb-base text-lb-text-secondary rounded-lg text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-white">{lead.name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full border ${leadStatusColors[lead.status]}`}>
                        {lead.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-lb-text-secondary">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {lead.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {lead.email}
                      </span>
                      {lead.budget && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          ${lead.budget.toLocaleString()}
                        </span>
                      )}
                      {lead.moveInDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {lead.moveInDate}
                        </span>
                      )}
                    </div>
                    {lead.notes && (
                      <p className="text-sm text-lb-text-muted">{lead.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedLeadForResponse(lead);
                        setResponseModalOpen(true);
                      }}
                      className="p-2 text-lb-text-secondary hover:text-emerald-400 transition-colors"
                      title="Generate AI Response"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(lead)}
                      className="p-2 text-lb-text-secondary hover:text-amber-400 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(lead.id)}
                      className="p-2 text-lb-text-secondary hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )))}
        </div>
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-lb-base/80 flex items-center justify-center z-50 p-4">
          <div className="bg-lb-surface border border-lb-border rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Add New Lead</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-lb-text-secondary hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-1">Name *</label>
                <input
                  type="text"
                  value={newLead.name || ''}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  className="w-full px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-white focus:outline-none focus:border-amber-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-1">Phone *</label>
                <input
                  type="tel"
                  value={newLead.phone || ''}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-white focus:outline-none focus:border-amber-500"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-1">Email *</label>
                <input
                  type="email"
                  value={newLead.email || ''}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  className="w-full px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-white focus:outline-none focus:border-amber-500"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-1">Status</label>
                <select
                  value={newLead.status || 'new'}
                  onChange={(e) => setNewLead({ ...newLead, status: e.target.value as Lead['status'] })}
                  className="w-full px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="showing">Showing</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-lb-text-secondary mb-1">Budget ($)</label>
                  <input
                    type="number"
                    value={newLead.budget || ''}
                    onChange={(e) => setNewLead({ ...newLead, budget: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-white focus:outline-none focus:border-amber-500"
                    placeholder="3000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-lb-text-secondary mb-1">Move-in Date</label>
                  <input
                    type="date"
                    value={newLead.moveInDate || ''}
                    onChange={(e) => setNewLead({ ...newLead, moveInDate: e.target.value })}
                    className="w-full px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-lb-text-secondary mb-1">Bedrooms</label>
                  <input
                    type="number"
                    value={newLead.bedrooms || ''}
                    onChange={(e) => setNewLead({ ...newLead, bedrooms: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-white focus:outline-none focus:border-amber-500"
                    placeholder="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-lb-text-secondary mb-1">Bathrooms</label>
                  <input
                    type="number"
                    value={newLead.bathrooms || ''}
                    onChange={(e) => setNewLead({ ...newLead, bathrooms: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-white focus:outline-none focus:border-amber-500"
                    placeholder="1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-1">Notes</label>
                <textarea
                  value={newLead.notes || ''}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-white focus:outline-none focus:border-amber-500"
                  rows={3}
                  placeholder="Add any notes about this lead..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-lb-text-secondary hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
              >
                Add Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Lead Response Modal */}
      {selectedLeadForResponse && (
        <SmartLeadResponseModal
          isOpen={responseModalOpen}
          onClose={() => {
            setResponseModalOpen(false);
            setSelectedLeadForResponse(null);
          }}
          lead={selectedLeadForResponse}
          onSend={(message) => {
            // Message copied to clipboard, could also trigger send via Telegram
            console.log('[SmartLeadResponse] Generated message:', message);
          }}
        />
      )}
    </div>
  );
}



export default Leads;
