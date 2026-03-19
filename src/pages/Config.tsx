import { useState, useEffect } from 'react';
import { Save, Clock, AlertTriangle, Building2, User, MessageSquare, CheckCircle, ChevronDown, ChevronUp, RotateCcw, Trash2, Database, HardDrive, AlertCircle, DollarSign, Crown, Link, Lock, FileText, Copy, ExternalLink, Bot } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ComplianceFooter } from '../components/ComplianceFooter';
import { UpgradeModal } from '../components/UpgradeModal';
import { ListingsSettings } from '../components/ListingsSettings';
import { useApp } from '../context/AppContext';
import { useAuth } from '@/features/auth';
import { ResponseTone } from '../types';
import { validateBotToken } from '../services/telegram';

const escalationKeywordsList = [
  'heat',
  'hot water',
  'emergency',
  'safety',
  'fire',
  'injury',
  'police',
  '911',
  'leak',
  'flood',
  'gas',
  'smoke',
];

const toneOptions: { value: ResponseTone; label: string; description: string }[] = [
  { value: 'professional', label: 'Professional', description: 'Formal and polished responses' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable tone' },
  { value: 'warm', label: 'Warm', description: 'Cozy and conversational' },
];

// Setup Progress Component
function SetupProgress() {
  const { userData } = useAuth();
  const { units, leases } = useApp();
  
  const steps = [
    { 
      label: 'Telegram connected', 
      complete: !!userData?.bot_phone_number 
    },
    { 
      label: 'Units added', 
      complete: units.length > 0 
    },
    { 
      label: 'Tenants added', 
      complete: leases.length > 0 
    },
    { 
      label: 'Property address set', 
      complete: !!userData?.property_address 
    },
  ];
  
  const completedCount = steps.filter(s => s.complete).length;
  
  return (
    <div className="bg-lb-surface border border-lb-border rounded-xl p-5">
      <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Setup progress</p>
      <div className="flex flex-wrap gap-2">
        {steps.map((step, i) => (
          <span 
            key={i}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
              step.complete 
                ? 'bg-green-100 text-green-700' 
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {step.complete ? '✓' : '○'} {step.label}
          </span>
        ))}
      </div>
      {completedCount === steps.length && (
        <p className="text-sm text-green-600 mt-3">🎉 You're all set up!</p>
      )}
    </div>
  );
}

export function Config() {
  const { 
    botConfig, 
    updateBotConfig, 
    resetToDemoData, 
    clearAllData, 
    persistenceEnabled, 
    enablePersistence, 
    disablePersistence,
    getLateFeeConfig,
    updateLateFeeConfig,
    calculateLateFees,
  } = useApp();
  const { userData, user } = useAuth();
  const [showSaved, setShowSaved] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>('hours');
  const [showLateFeeSuccess, setShowLateFeeSuccess] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Telegram Bot Wizard state
  const [botStep, setBotStep] = useState(1);
  const [botToken, setBotToken] = useState('');
  const [botTokenError, setBotTokenError] = useState('');
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [connectedBotUsername, setConnectedBotUsername] = useState(userData?.bot_phone_number || '');
  const [copiedSnippet, setCopiedSnippet] = useState<number | null>(null);
  
  // Confirmation modals state
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [clearConfirmText, setClearConfirmText] = useState('');
  
  // Listing Defaults state
  const [listingDefaults, setListingDefaults] = useState({
    listing_laundry: 'none',
    listing_pets: 'not_allowed',
    listing_heat_included: false,
    listing_parking: false,
  });
  const [showListingSaved, setShowListingSaved] = useState(false);
  
  // Payment Handles state
  const [paymentHandles, setPaymentHandles] = useState({
    venmo_handle: '',
    zelle_contact: '',
    cashapp_tag: '',
    paypal_handle: '',
    preferred_payment_method: 'venmo',
  });
  const [showPaymentSaved, setShowPaymentSaved] = useState(false);
  
  // Load listing defaults from userData on mount
  useEffect(() => {
    if (userData) {
      setListingDefaults({
        listing_laundry: userData.listing_laundry || 'none',
        listing_pets: userData.listing_pets || 'not_allowed',
        listing_heat_included: userData.listing_heat_included || false,
        listing_parking: userData.listing_parking || false,
      });
      // Load payment handles
      setPaymentHandles({
        venmo_handle: userData.venmo_handle || '',
        zelle_contact: userData.zelle_contact || '',
        cashapp_tag: userData.cashapp_tag || '',
        paypal_handle: userData.paypal_handle || '',
        preferred_payment_method: userData.preferred_payment_method || 'venmo',
      });
    }
  }, [userData]);
  
  // Save listing defaults to Supabase
  const saveListingDefault = async (key: string, value: string | boolean) => {
    if (!user) return;
    
    const { error } = await (supabase
      .from('users') as any)
      .update({ [key]: value })
      .eq('id', user.id);
    
    if (!error) {
      setShowListingSaved(true);
      setTimeout(() => setShowListingSaved(false), 2000);
    }
  };
  
  const handleLaundryChange = (value: string) => {
    setListingDefaults(prev => ({ ...prev, listing_laundry: value }));
    saveListingDefault('listing_laundry', value);
  };
  
  const handlePetsChange = (value: string) => {
    setListingDefaults(prev => ({ ...prev, listing_pets: value }));
    saveListingDefault('listing_pets', value);
  };
  
  const handleHeatChange = (value: boolean) => {
    setListingDefaults(prev => ({ ...prev, listing_heat_included: value }));
    saveListingDefault('listing_heat_included', value);
  };
  
  const handleParkingChange = (value: boolean) => {
    setListingDefaults(prev => ({ ...prev, listing_parking: value }));
    saveListingDefault('listing_parking', value);
  };
  
  // Save payment handle to Supabase
  const savePaymentHandle = async (key: string, value: string) => {
    if (!user) return;
    
    const { error } = await (supabase
      .from('users') as any)
      .update({ [key]: value })
      .eq('id', user.id);
    
    if (!error) {
      setShowPaymentSaved(true);
      setTimeout(() => setShowPaymentSaved(false), 2000);
    }
  };
  
  const handlePreferredMethodChange = (value: string) => {
    setPaymentHandles(prev => ({ ...prev, preferred_payment_method: value }));
    savePaymentHandle('preferred_payment_method', value);
  };
  
  const isFreeTier = !userData || userData.subscription_tier === 'free';
  const lateFeeConfig = getLateFeeConfig() || { enabled: false, gracePeriodDays: 5 };

  if (!botConfig) return null;

  const handleSave = () => {
    // Trigger persistence
    if (persistenceEnabled) {
      // The state is already updated via updateBotConfig, persistence happens automatically
      // This is just for UI feedback
    }
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !botConfig.escalationKeywords.includes(newKeyword.trim().toLowerCase())) {
      updateBotConfig({
        escalationKeywords: [...botConfig.escalationKeywords, newKeyword.trim().toLowerCase()],
      });
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    updateBotConfig({
      escalationKeywords: botConfig.escalationKeywords.filter(k => k !== keyword),
    });
  };

  const handleResetToDemo = () => {
    if (resetConfirmText.toLowerCase() === 'reset') {
      resetToDemoData();
      setShowResetConfirm(false);
      setResetConfirmText('');
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
    }
  };

  const handleClearAllData = () => {
    if (clearConfirmText.toLowerCase() === 'delete') {
      clearAllData();
      setShowClearConfirm(false);
      setClearConfirmText('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-lb-text-primary">Bot Configuration</h1>
          <p className="text-lb-text-secondary mt-1">Customize your chatbot settings and property rules</p>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      {/* Setup Progress Indicator */}
      <SetupProgress />

      {showSaved && (
        <div className="bg-emerald-100 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-400">Settings saved successfully</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="bg-lb-surface border border-lb-border rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('hours')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-lb-base transition-colors"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400" />
              <div className="text-left">
                <h3 className="font-medium text-lb-text-primary">Business Hours</h3>
                <p className="text-sm text-lb-text-muted">When your bot responds immediately vs. collecting messages</p>
              </div>
            </div>
            {expandedSection === 'hours' ? (
              <ChevronUp className="w-5 h-5 text-lb-text-muted" />
            ) : (
              <ChevronDown className="w-5 h-5 text-lb-text-muted" />
            )}
          </button>
          
          {expandedSection === 'hours' && (
            <div className="px-6 pb-6 pt-2 border-t border-lb-border">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-lb-text-secondary mb-2">Start Time</label>
                  <input
                    type="time"
                    value={botConfig.businessHours.start}
                    onChange={(e) => updateBotConfig({
                      businessHours: { ...botConfig.businessHours, start: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-slate-800 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-lb-text-secondary mb-2">End Time</label>
                  <input
                    type="time"
                    value={botConfig.businessHours.end}
                    onChange={(e) => updateBotConfig({
                      businessHours: { ...botConfig.businessHours, end: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-slate-800 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={botConfig.afterHoursCollect}
                    onChange={(e) => updateBotConfig({ afterHoursCollect: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-400 bg-lb-muted text-amber-500 focus:ring-amber-500/50"
                  />
                  <span className="text-lb-text-secondary">Collect after-hours messages for morning digest</span>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="bg-lb-surface border border-lb-border rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('escalation')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-lb-base transition-colors"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <div className="text-left">
                <h3 className="font-medium text-lb-text-primary">Escalation Keywords</h3>
                <p className="text-sm text-lb-text-muted">Phrases that trigger immediate alerts to you</p>
              </div>
            </div>
            {expandedSection === 'escalation' ? (
              <ChevronUp className="w-5 h-5 text-lb-text-muted" />
            ) : (
              <ChevronDown className="w-5 h-5 text-lb-text-muted" />
            )}
          </button>
          
          {expandedSection === 'escalation' && (
            <div className="px-6 pb-6 pt-2 border-t border-lb-border">
              <div className="flex flex-wrap gap-2 mb-4">
                {botConfig.escalationKeywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400"
                  >
                    {keyword}
                    <button
                      onClick={() => removeKeyword(keyword)}
                      className="ml-1 text-red-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="Add custom keyword..."
                  onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                  className="flex-1 px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500/50"
                />
                <button
                  onClick={addKeyword}
                  className="px-4 py-2 bg-lb-muted hover:bg-lb-base text-lb-text-primary rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-lb-surface border border-lb-border rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('tone')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-lb-base transition-colors"
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-amber-400" />
              <div className="text-left">
                <h3 className="font-medium text-lb-text-primary">Response Tone</h3>
                <p className="text-sm text-lb-text-muted">How your bot sounds to tenants</p>
              </div>
            </div>
            {expandedSection === 'tone' ? (
              <ChevronUp className="w-5 h-5 text-lb-text-muted" />
            ) : (
              <ChevronDown className="w-5 h-5 text-lb-text-muted" />
            )}
          </button>
          
          {expandedSection === 'tone' && (
            <div className="px-6 pb-6 pt-2 border-t border-lb-border">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {toneOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                      botConfig.tone === option.value
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-lb-border hover:border-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tone"
                      value={option.value}
                      checked={botConfig.tone === option.value}
                      onChange={() => updateBotConfig({ tone: option.value })}
                      className="sr-only"
                    />
                    <div className="font-medium text-lb-text-primary">{option.label}</div>
                    <div className="text-xs text-lb-text-muted mt-1">{option.description}</div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Listing Defaults Section */}
        <div className="bg-lb-surface border border-lb-border rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('listings-defaults')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-lb-base transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-amber-400" />
              <div className="text-left">
                <h3 className="font-medium text-lb-text-primary">Listing Defaults</h3>
                <p className="text-sm text-lb-text-muted">Set these once — every listing you generate will use them automatically.</p>
              </div>
            </div>
            {expandedSection === 'listings-defaults' ? (
              <ChevronUp className="w-5 h-5 text-lb-text-muted" />
            ) : (
              <ChevronDown className="w-5 h-5 text-lb-text-muted" />
            )}
          </button>
          
          {expandedSection === 'listings-defaults' && (
            <div className="px-6 pb-6 pt-2 border-t border-lb-border space-y-6">
              {/* Laundry Control */}
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-3">Laundry</label>
                <div className="flex flex-wrap gap-2">
                  {['None', 'In Building', 'In Unit'].map((option) => (
                    <button
                      key={option}
                      onClick={() => handleLaundryChange(option.toLowerCase().replace(' ', '_'))}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        listingDefaults.listing_laundry === option.toLowerCase().replace(' ', '_')
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pets Control */}
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-3">Pets</label>
                <div className="flex flex-wrap gap-2">
                  {['Not Allowed', 'Case by Case', 'Allowed'].map((option) => (
                    <button
                      key={option}
                      onClick={() => handlePetsChange(option.toLowerCase().replace(/ /g, '_'))}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        listingDefaults.listing_pets === option.toLowerCase().replace(/ /g, '_')
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Heat & Hot Water Control */}
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-3">Heat & Hot Water Included</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleHeatChange(false)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      !listingDefaults.listing_heat_included
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    No
                  </button>
                  <button
                    onClick={() => handleHeatChange(true)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      listingDefaults.listing_heat_included
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    Yes
                  </button>
                </div>
              </div>

              {/* Parking Control */}
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-3">Parking Available</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleParkingChange(false)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      !listingDefaults.listing_parking
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    No
                  </button>
                  <button
                    onClick={() => handleParkingChange(true)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      listingDefaults.listing_parking
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    Yes
                  </button>
                </div>
              </div>

              {/* Saved Indicator */}
              {showListingSaved && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Saved</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rent Collection Setup Section */}
        <div className="bg-lb-surface border border-lb-border rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('payment-setup')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-lb-base transition-colors"
          >
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-amber-400" />
              <div className="text-left">
                <h3 className="font-medium text-lb-text-primary">Rent Collection Setup</h3>
                <p className="text-sm text-lb-text-muted">Enter your handles once - tenants get a one-tap pay button</p>
              </div>
            </div>
            {expandedSection === 'payment-setup' ? (
              <ChevronUp className="w-5 h-5 text-lb-text-muted" />
            ) : (
              <ChevronDown className="w-5 h-5 text-lb-text-muted" />
            )}
          </button>
          
          {expandedSection === 'payment-setup' && (
            <div className="px-6 pb-6 pt-2 border-t border-lb-border space-y-5">
              {/* Info Banner */}
              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                LandlordBot generates one-tap payment links for your tenants using your existing accounts. No fees. No processing. Tenants pay you directly as they always have.
              </div>

              {/* Venmo */}
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-2">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">V</span>
                    Venmo
                  </span>
                </label>
                <input
                  type="text"
                  value={paymentHandles.venmo_handle}
                  onChange={(e) => setPaymentHandles(prev => ({ ...prev, venmo_handle: e.target.value }))}
                  onBlur={() => savePaymentHandle('venmo_handle', paymentHandles.venmo_handle)}
                  placeholder="@your-venmo-username"
                  className="w-full px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Zelle */}
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-2">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">Z</span>
                    Zelle
                  </span>
                </label>
                <input
                  type="text"
                  value={paymentHandles.zelle_contact}
                  onChange={(e) => setPaymentHandles(prev => ({ ...prev, zelle_contact: e.target.value }))}
                  onBlur={() => savePaymentHandle('zelle_contact', paymentHandles.zelle_contact)}
                  placeholder="Phone number or email"
                  className="w-full px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Cash App */}
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-2">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs">$</span>
                    Cash App
                  </span>
                </label>
                <input
                  type="text"
                  value={paymentHandles.cashapp_tag}
                  onChange={(e) => setPaymentHandles(prev => ({ ...prev, cashapp_tag: e.target.value }))}
                  onBlur={() => savePaymentHandle('cashapp_tag', paymentHandles.cashapp_tag)}
                  placeholder="$YourCashTag"
                  className="w-full px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* PayPal */}
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-2">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">P</span>
                    PayPal
                  </span>
                </label>
                <input
                  type="text"
                  value={paymentHandles.paypal_handle}
                  onChange={(e) => setPaymentHandles(prev => ({ ...prev, paypal_handle: e.target.value }))}
                  onBlur={() => savePaymentHandle('paypal_handle', paymentHandles.paypal_handle)}
                  placeholder="paypal.me/yourname"
                  className="w-full px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Preferred Method */}
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-3">Preferred Method</label>
                <div className="flex flex-wrap gap-2">
                  {['venmo', 'zelle', 'cashapp', 'paypal', 'check'].map((method) => (
                    <button
                      key={method}
                      onClick={() => handlePreferredMethodChange(method)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        paymentHandles.preferred_payment_method === method
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Saved Indicator */}
              {showPaymentSaved && (
                <p className="text-xs text-green-500 text-right mt-2">✓ Saved</p>
              )}

              {/* Phase 2 Teaser */}
              <div className="mt-5 pt-5 border-t border-lb-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-lb-text-primary flex items-center gap-2">
                      Direct Bank Deposit
                      <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-medium">
                        Coming Soon
                      </span>
                    </p>
                    <p className="text-xs text-lb-text-muted mt-1">
                      Accept ACH bank transfers directly. Max $5 fee - no monthly cost.
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 opacity-40 pointer-events-none">
                  {['$0 setup', 'Max $5/payment', 'Direct to your bank'].map(f => (
                    <div key={f} className="text-center p-2 bg-lb-base rounded-lg">
                      <p className="text-xs text-lb-text-muted">{f}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Telegram Bot Setup Section */}
        <div className="bg-lb-surface border border-lb-border rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('telegram')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-lb-base transition-colors"
          >
            <div className="flex items-center gap-3">
              <Bot className="w-5 h-5 text-amber-400" />
              <div className="text-left">
                <h3 className="font-medium text-lb-text-primary">Telegram Bot Setup</h3>
                <p className="text-sm text-lb-text-muted">Connect your bot to message with tenants</p>
              </div>
            </div>
            {expandedSection === 'telegram' ? (
              <ChevronUp className="w-5 h-5 text-lb-text-muted" />
            ) : (
              <ChevronDown className="w-5 h-5 text-lb-text-muted" />
            )}
          </button>
          
          {expandedSection === 'telegram' && (
            <div className="px-6 pb-6 pt-2 border-t border-lb-border">
              {connectedBotUsername ? (
                // Connected state
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-emerald-800">Your bot is connected!</h4>
                      <p className="text-sm text-emerald-600">@{connectedBotUsername}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <a
                      href={`https://t.me/${connectedBotUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Test Bot
                    </a>
                    <button
                      onClick={() => {
                        setConnectedBotUsername('');
                        setBotStep(1);
                        setBotToken('');
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                // Wizard
                <div className="space-y-6">
                  {/* Step indicator */}
                  <div className="flex items-center justify-center gap-4 mb-6">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                            step < botStep
                              ? 'bg-[#1E3A5F] text-white'
                              : step === botStep
                              ? 'bg-white border-2 border-amber-500 text-amber-600'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {step < botStep ? '✓' : step}
                        </div>
                        {step < 3 && (
                          <div
                            className={`w-16 h-0.5 transition-all ${
                              step < botStep ? 'bg-[#1E3A5F]' : 'bg-slate-200'
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Step 1: Open BotFather */}
                  {botStep === 1 && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-lg text-slate-800">Step 1 — Create your bot in Telegram</h4>
                      <ol className="space-y-3 text-sm text-slate-600 list-decimal list-inside">
                        <li>Open Telegram and search for @BotFather</li>
                        <li>Tap Start, then send: <code className="bg-slate-100 px-2 py-0.5 rounded">/newbot</code></li>
                        <li>When asked for a name, type: <strong>{userData?.first_name || 'Your Name'} Properties</strong></li>
                        <li>When asked for a username, type anything ending in <code className="bg-slate-100 px-2 py-0.5 rounded">_bot</code></li>
                        <li>BotFather will give you a long token — copy it</li>
                      </ol>
                      <div className="flex flex-col gap-3">
                        <a
                          href="https://t.me/BotFather"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open BotFather in Telegram →
                        </a>
                        <button
                          onClick={() => setBotStep(3)}
                          className="text-sm text-slate-500 hover:text-slate-700 underline"
                        >
                          I already have a token — skip to step 3
                        </button>
                        <button
                          onClick={() => setBotStep(2)}
                          className="mt-2 inline-flex items-center justify-center gap-2 px-6 py-2 bg-[#1E3A5F] hover:bg-slate-800 text-white font-medium rounded-lg transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Copy snippets */}
                  {botStep === 2 && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-lg text-slate-800">Step 2 — What to type in BotFather</h4>
                      <p className="text-sm text-slate-600">Copy and paste these into your conversation with BotFather:</p>
                      
                      <div className="space-y-3">
                        {[
                          { text: '/newbot', label: 'Command to create a bot' },
                          { text: `${userData?.first_name || 'Landlord'} Properties`, label: 'Bot name' },
                          { text: `${(userData?.first_name || 'landlord').toLowerCase()}_properties_bot`, label: 'Bot username' },
                        ].map((snippet, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                          >
                            <div>
                              <code className="text-emerald-400 font-mono text-sm">{snippet.text}</code>
                              <p className="text-xs text-slate-400 mt-1">{snippet.label}</p>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(snippet.text);
                                setCopiedSnippet(index);
                                setTimeout(() => setCopiedSnippet(null), 2000);
                              }}
                              className="p-2 text-slate-400 hover:text-white transition-colors"
                            >
                              {copiedSnippet === index ? (
                                <span className="text-emerald-400 text-xs">✓ Copied</span>
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <p className="text-sm text-slate-500">
                        BotFather will reply with a token like: <code className="bg-slate-100 px-1 rounded">7234819203:ABCDef_ghIJKL...</code>
                      </p>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={() => setBotStep(1)}
                          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => setBotStep(3)}
                          className="px-4 py-2 bg-[#1E3A5F] hover:bg-slate-800 text-white font-medium rounded-lg transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Paste token */}
                  {botStep === 3 && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-lg text-slate-800">Step 3 — Paste your token here</h4>
                      
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={botToken}
                          onChange={(e) => {
                            setBotToken(e.target.value);
                            setBotTokenError('');
                          }}
                          placeholder="Paste your token from BotFather"
                          className="w-full px-4 py-3 bg-lb-muted border border-lb-border rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500/50"
                        />
                        <p className="text-xs text-slate-500">
                          It looks like: <code className="bg-slate-100 px-1 rounded">7234819203:ABCDef_ghIJKLmnop...</code>
                        </p>
                        {botTokenError && (
                          <p className="text-sm text-red-500">{botTokenError}</p>
                        )}
                      </div>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={() => setBotStep(2)}
                          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors"
                        >
                          Back
                        </button>
                        <button
                          onClick={async () => {
                            if (!botToken.trim()) {
                              setBotTokenError('Please enter your bot token');
                              return;
                            }
                            
                            setIsValidatingToken(true);
                            setBotTokenError('');
                            
                            const result = await validateBotToken(botToken);
                            
                            if (result.ok && result.username) {
                              // Save to Supabase
                              if (user) {
                                const { error } = await (supabase as any)
                                  .from('users')
                                  .update({ bot_phone_number: result.username })
                                  .eq('id', user.id);
                                
                                if (!error) {
                                  setConnectedBotUsername(result.username);
                                } else {
                                  setBotTokenError('Failed to save bot. Please try again.');
                                }
                              }
                            } else {
                              setBotTokenError(result.error || 'Invalid token');
                            }
                            
                            setIsValidatingToken(false);
                          }}
                          disabled={isValidatingToken}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-slate-950 font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                          {isValidatingToken ? (
                            <>
                              <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                              Validating...
                            </>
                          ) : (
                            'Connect My Bot'
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-lb-surface border border-lb-border rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('property')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-lb-base transition-colors"
          >
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-amber-400" />
              <div className="text-left">
                <h3 className="font-medium text-lb-text-primary">Property Rules</h3>
                <p className="text-sm text-lb-text-muted">Information your bot shares with tenants</p>
              </div>
            </div>
            {expandedSection === 'property' ? (
              <ChevronUp className="w-5 h-5 text-lb-text-muted" />
            ) : (
              <ChevronDown className="w-5 h-5 text-lb-text-muted" />
            )}
          </button>
          
          {expandedSection === 'property' && (
            <div className="px-6 pb-6 pt-2 border-t border-lb-border space-y-4">
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-2">Pet Policy</label>
                <textarea
                  value={botConfig.propertyRules.petPolicy}
                  onChange={(e) => updateBotConfig({
                    propertyRules: { ...botConfig.propertyRules, petPolicy: e.target.value }
                  })}
                  rows={2}
                  className="w-full px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-2">Parking</label>
                <textarea
                  value={botConfig.propertyRules.parking}
                  onChange={(e) => updateBotConfig({
                    propertyRules: { ...botConfig.propertyRules, parking: e.target.value }
                  })}
                  rows={2}
                  className="w-full px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-2">Amenities</label>
                <textarea
                  value={botConfig.propertyRules.amenities}
                  onChange={(e) => updateBotConfig({
                    propertyRules: { ...botConfig.propertyRules, amenities: e.target.value }
                  })}
                  rows={2}
                  className="w-full px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Late Fee Automation - Premium Feature */}
        <div className="bg-lb-surface border border-lb-border rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('latefees')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-lb-base transition-colors"
          >
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <div className="text-left">
                <h3 className="font-medium text-slate-800">Automated Late Fees</h3>
                <p className="text-sm text-lb-text-muted">Automatically charge late fees when rent is past due</p>
              </div>
              {!isFreeTier && (
                <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded">Concierge</span>
              )}
            </div>
            {expandedSection === 'latefees' ? (
              <ChevronUp className="w-5 h-5 text-lb-text-muted" />
            ) : (
              <ChevronDown className="w-5 h-5 text-lb-text-muted" />
            )}
          </button>
          
          {expandedSection === 'latefees' && (
            <div className="px-6 pb-6 pt-2 border-t border-lb-border space-y-4">
              {isFreeTier ? (
                <div className="text-center py-6">
                  <div className="mx-auto w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                    <Lock className="w-6 h-6 text-lb-text-secondary" />
                  </div>
                  <p className="text-lb-text-secondary mb-2">Automated late fees are a Concierge feature.</p>
                  <p className="text-lb-text-muted text-sm mb-6">Save time by automatically applying late fees when tenants miss rent due dates.</p>
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium rounded-lg transition-colors"
                  >
                    Upgrade to Concierge
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 bg-lb-base rounded-lg">
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={lateFeeConfig.enabled}
                          onChange={(e) => updateLateFeeConfig({ enabled: e.target.checked })}
                          className="w-5 h-5 accent-amber-500"
                        />
                        <span className="text-slate-800">Enable automated late fees</span>
                      </label>
                      <p className="text-sm text-lb-text-muted mt-1 ml-8">Late fees will be automatically applied when rent is past the grace period.</p>
                    </div>
                  </div>
                  
                  {lateFeeConfig.enabled && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-lb-text-secondary mb-2">Grace Period (days)</label>
                          <input
                            type="number"
                            value={lateFeeConfig.gracePeriodDays === 0 ? '' : lateFeeConfig.gracePeriodDays}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                              updateLateFeeConfig({ gracePeriodDays: isNaN(value) ? 0 : value });
                            }}
                            onBlur={(e) => {
                              const value = parseInt(e.target.value);
                              if (isNaN(value) || value < 0) {
                                updateLateFeeConfig({ gracePeriodDays: 5 });
                              }
                            }}
                            min={0}
                            max={30}
                            className="w-full px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-slate-800 focus:outline-none focus:border-amber-500/50"
                          />
                          <p className="text-xs text-lb-text-muted mt-1">Days after due date before late fee is applied</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-lb-text-secondary mb-2">Flat Fee Amount ($)</label>
                          <input
                            type="number"
                            value={lateFeeConfig.flatFee === undefined ? '' : lateFeeConfig.flatFee === 0 ? '' : lateFeeConfig.flatFee}
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                              updateLateFeeConfig({ flatFee: value });
                            }}
                            onBlur={(e) => {
                              const value = parseFloat(e.target.value);
                              if (isNaN(value) || value < 0) {
                                updateLateFeeConfig({ flatFee: undefined });
                              }
                            }}
                            min={0}
                            placeholder="e.g., 75"
                            className="w-full px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-slate-800 focus:outline-none focus:border-amber-500/50"
                          />
                          <p className="text-xs text-lb-text-muted mt-1">Or leave blank to use percentage</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-lb-text-secondary mb-2">Percentage of Rent (%)</label>
                          <input
                            type="number"
                            value={lateFeeConfig.percentageFee === undefined ? '' : lateFeeConfig.percentageFee === 0 ? '' : lateFeeConfig.percentageFee}
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                              updateLateFeeConfig({ percentageFee: value });
                            }}
                            onBlur={(e) => {
                              const value = parseFloat(e.target.value);
                              if (isNaN(value) || value < 0) {
                                updateLateFeeConfig({ percentageFee: undefined });
                              }
                            }}
                            min={0}
                            max={100}
                            step="0.1"
                            placeholder="e.g., 5"
                            className="w-full px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-slate-800 focus:outline-none focus:border-amber-500/50"
                          />
                          <p className="text-xs text-lb-text-muted mt-1">Or leave blank to use flat fee</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-lb-text-secondary mb-2">Maximum Late Fee ($)</label>
                          <input
                            type="number"
                            value={lateFeeConfig.maxLateFee === undefined ? '' : lateFeeConfig.maxLateFee === 0 ? '' : lateFeeConfig.maxLateFee}
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                              updateLateFeeConfig({ maxLateFee: value });
                            }}
                            onBlur={(e) => {
                              const value = parseFloat(e.target.value);
                              if (isNaN(value) || value < 0) {
                                updateLateFeeConfig({ maxLateFee: undefined });
                              }
                            }}
                            min={0}
                            placeholder="e.g., 150"
                            className="w-full px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-slate-800 focus:outline-none focus:border-amber-500/50"
                          />
                          <p className="text-xs text-lb-text-muted mt-1">Cap on total late fees</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          const result = calculateLateFees();
                          if (result.applied > 0) {
                            setShowLateFeeSuccess(true);
                            setTimeout(() => setShowLateFeeSuccess(false), 3000);
                          }
                        }}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                      >
                        Run Now
                      </button>
                      
                      {showLateFeeSuccess && (
                        <div className="mt-4 bg-emerald-100 border border-emerald-200 rounded-lg p-3 flex items-center gap-3">
                          <CheckCircle className="w-4 h-4 text-emerald-400"/>
                          <span className="text-emerald-400 text-sm">Late fees calculated and applied!</span>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="bg-lb-surface border border-lb-border rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('listings')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-lb-base transition-colors"
          >
            <div className="flex items-center gap-3">
              <Link className="w-5 h-5 text-emerald-400" />
              <div className="text-left">
                <h3 className="font-medium text-slate-800">Listing Platforms</h3>
                <p className="text-sm text-lb-text-muted">Connect Reddit, Facebook, Craigslist, StreetEasy, and more</p>
              </div>
            </div>
            {expandedSection === 'listings' ? (
              <ChevronUp className="w-5 h-5 text-lb-text-muted" />
            ) : (
              <ChevronDown className="w-5 h-5 text-lb-text-muted" />
            )}
          </button>
          
          {expandedSection === 'listings' && (
            <div className="border-t border-lb-border">
              <ListingsSettings />
            </div>
          )}
        </div>

        {/* Data Management Section */}
        <div className="bg-lb-surface border border-lb-border rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('data')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-lb-base transition-colors"
          >
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-blue-400" />
              <div className="text-left">
                <h3 className="font-medium text-slate-800">Data Management</h3>
                <p className="text-sm text-lb-text-muted">Manage your dashboard data and persistence settings</p>
              </div>
            </div>
            {expandedSection === 'data' ? (
              <ChevronUp className="w-5 h-5 text-lb-text-muted" />
            ) : (
              <ChevronDown className="w-5 h-5 text-lb-text-muted" />
            )}
          </button>
          
          {expandedSection === 'data' && (
            <div className="px-6 pb-6 pt-2 border-t border-lb-border space-y-6">
              {/* Persistence Status */}
              <div className="flex items-center gap-4 p-4 bg-lb-base rounded-lg">
                <div className={`p-2 rounded-lg ${persistenceEnabled ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                  <HardDrive className={`w-5 h-5 ${persistenceEnabled ? 'text-emerald-400' : 'text-amber-400'}`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-800">
                    Data Persistence is {persistenceEnabled ? 'Enabled' : 'Disabled'}
                  </h4>
                  <p className="text-sm text-lb-text-secondary">
                    {persistenceEnabled 
                      ? 'Your data is being saved to browser storage and will persist between sessions.'
                      : 'Your data will reset to demo data when you refresh the page.'}
                  </p>
                </div>
                <button
                  onClick={persistenceEnabled ? disablePersistence : enablePersistence}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    persistenceEnabled
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {persistenceEnabled ? 'Disable' : 'Enable'}
                </button>
              </div>

              {/* Reset to Demo Data */}
              <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <RotateCcw className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-amber-600">Reset to Demo Data</h4>
                    <p className="text-sm text-lb-text-secondary mt-1">
                      Restore all data to the original demo values. This will overwrite any custom units, leads, or settings you've added.
                    </p>
                    <button
                      onClick={() => setShowResetConfirm(true)}
                      className="mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-colors"
                    >
                      Reset to Demo
                    </button>
                  </div>
                </div>
              </div>

              {/* Clear All Data */}
              <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Trash2 className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-600">Clear All Data</h4>
                    <p className="text-sm text-lb-text-secondary mt-1">
                      Permanently delete all your data including units, leads, messages, and settings. This action cannot be undone.
                    </p>
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors"
                    >
                      Clear All Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-200/30 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 bg-emerald-500/20 rounded-lg">
            <User className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-medium text-emerald-400">Fair Housing Protection</h3>
            <p className="text-sm text-lb-text-secondary mt-2">
              This bot will <strong>NEVER</strong> ask about or reference:
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {['Race', 'National Origin', 'Family Status', 'Source of Income', 'Disability', 'Immigration Status'].map(
                (item) => (
                  <span
                    key={item}
                    className="px-2 py-1 bg-lb-base border border-lb-border rounded text-xs text-lb-text-secondary"
                  >
                    {item}
                  </span>
                )
              )}
            </div>
            <p className="text-sm text-lb-text-secondary mt-3">
              If a tenant volunteers this information, it is automatically excluded from bot responses.
            </p>
          </div>
        </div>
      </div>

      <ComplianceFooter />

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-lb-muted/80 flex items-center justify-center z-50 p-4">
          <div className="bg-lb-surface border border-lb-border rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-amber-600" />
              <h3 className="text-lg font-medium text-lb-text-primary">Reset Data?</h3>
            </div>
            <p className="text-lb-text-secondary mb-4">
              This will restore all data to the original demo values. Any custom units, leads, or settings will be lost.
            </p>
            <div className="mb-4">
              <label className="block text-sm text-lb-text-secondary mb-2">
                Type <strong>"reset"</strong> to confirm:
              </label>
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                className="w-full px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-slate-800 focus:outline-none focus:border-amber-500/50"
                placeholder="reset"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  setResetConfirmText('');
                }}
                className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetToDemo}
                disabled={resetConfirmText.toLowerCase() !== 'reset'}
                className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-200 disabled:text-lb-text-muted text-white font-medium rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Data Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-lb-muted/80 flex items-center justify-center z-50 p-4">
          <div className="bg-lb-surface border border-lb-border rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-medium text-lb-text-primary">Clear All Data?</h3>
            </div>
            <p className="text-lb-text-secondary mb-4">
              This will permanently delete all your data including units, leads, messages, and settings. This action <strong>cannot be undone</strong>.
            </p>
            <div className="mb-4">
              <label className="block text-sm text-lb-text-secondary mb-2">
                Type <strong>"delete"</strong> to confirm:
              </label>
              <input
                type="text"
                value={clearConfirmText}
                onChange={(e) => setClearConfirmText(e.target.value)}
                className="w-full px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-slate-800 focus:outline-none focus:border-red-500/50"
                placeholder="delete"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowClearConfirm(false);
                  setClearConfirmText('');
                }}
                className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllData}
                disabled={clearConfirmText.toLowerCase() !== 'delete'}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-200 disabled:text-lb-text-muted text-white font-medium rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="Automated Late Fees"
        featureDescription="Automatically calculate and apply late fees when rent is past due. Set grace periods and fee amounts per unit."
      />

    </div>
  );
}

