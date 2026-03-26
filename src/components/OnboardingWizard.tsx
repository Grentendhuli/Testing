import { useState, useCallback, useEffect } from 'react';
import { 
  Building2, Phone, ShieldCheck, FileText, CheckCircle, 
  ChevronRight, ChevronLeft, Home, MessageSquare, 
  Sparkles, Loader2, DollarSign, TrendingUp, MapPin,
  AlertTriangle, Save, Copy, Check
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
// Twilio removed - using plain text input for phone numbers
import { propertyValuationService, type PropertyValuation } from '../services/propertyValuation';
import { listingsAPIService } from '../services/listingsAPI';
import { AddressAutocomplete } from './AddressAutocomplete';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  { id: 'welcome', title: 'Welcome', description: 'Get to know LandlordBot', icon: Sparkles },
  { id: 'property', title: 'Your Property', description: 'Add your building info', icon: Building2 },
  { id: 'phone', title: 'Phone Number', description: 'Set up your bot phone', icon: Phone },
  { id: 'compliance', title: 'NYC Compliance', description: 'Required checklists', icon: ShieldCheck },
  { id: 'units', title: 'Number of Units', description: 'Create your units', icon: FileText },
  { id: 'ready', title: 'Ready!', description: "You're all set", icon: CheckCircle },
];

export function OnboardingWizard({ isOpen, onClose }: OnboardingWizardProps) {
  const { t, currentLanguage, setLanguage } = useLanguage();
  const { addUnit } = useApp();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Step data
  const [propertyAddress, setPropertyAddress] = useState('');
  const [unitCount, setUnitCount] = useState(1);
  const [botPhone, setBotPhone] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  
  // Phone input (plain text, no verification)
  const [phoneCopied, setPhoneCopied] = useState(false);
  
  // New: Property valuation
  const [valuation, setValuation] = useState<PropertyValuation | null>(null);
  const [valuationLoading, setValuationLoading] = useState(false);
  
  const [complianceItems, setComplianceItems] = useState([
    { id: 'hpd', label: 'HPD Registration', description: 'Register with NYC Housing Preservation & Development', required: true, checked: false },
    { id: 'lead', label: 'Lead Paint Form', description: 'Complete NYC lead paint disclosure forms', required: true, checked: false },
    { id: 'smoke', label: 'Smoke Detectors', description: 'Install in every unit (required by law)', required: true, checked: false },
    { id: 'co', label: 'CO Detectors', description: 'Install carbon monoxide detectors in all units', required: true, checked: false },
    { id: 'fairhousing', label: 'Fair Housing Notice', description: 'Post NYC Commission on Human Rights notice', required: true, checked: false },
  ]);
  
  const [units, setUnits] = useState([{
    unitNumber: '1A',
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 600,
    rentAmount: 2200,
  }]);
  
  // Fetch phone numbers on step 2
  useEffect(() => {
    if (currentStep === 2 && availableNumbers.length === 0) {
      fetchAvailableNumbers();
    }
  }, [currentStep]);

  // Fetch property valuation when we reach step 4 (units)
  useEffect(() => {
    if (currentStep === 4 && propertyAddress && !valuation) {
      fetchPropertyValuation();
    }
  }, [currentStep, propertyAddress]);
  
  const fetchPropertyValuation = async () => {
    if (!propertyAddress) return;
    setValuationLoading(true);
    try {
      const val = await propertyValuationService.getValuation({
        address: propertyAddress,
        bedrooms: units[0]?.bedrooms || 1,
        bathrooms: units[0]?.bathrooms || 1,
      });
      setValuation(val);
    } catch (err) {
      console.error('Valuation error:', err);
    } finally {
      setValuationLoading(false);
    }
  };
  
  const copyPhoneToClipboard = () => {
    if (botPhone) {
      navigator.clipboard.writeText(botPhone);
      setPhoneCopied(true);
      setTimeout(() => setPhoneCopied(false), 3000);
    }
  };
  
  const progress = ((currentStep + 1) / STEPS.length) * 100;
  
  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 150);
    }
  }, [currentStep]);
  
  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 150);
    }
  }, [currentStep]);
  
  const handleComplete = useCallback(() => {
    // Save bot phone number for listings use
    if (botPhone) {
      // Removed;
    }
    onClose();
  }, [botPhone, onClose]);
  
  const updateUnitInfo = (index: number, field: string, value: any) => {
    setUnits(prev => prev.map((unit, i) => 
      i === index ? { ...unit, [field]: value } : unit
    ));
  };
  
  const addNewUnit = () => {
    setUnits(prev => [...prev, {
      unitNumber: `${prev.length + 1}A`,
      bedrooms: 1,
      bathrooms: 1,
      squareFeet: 600,
      rentAmount: 2200,
    }]);
  };
  
  const toggleCompliance = (id: string) => {
    setComplianceItems(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };
  
  const canProceed = () => {
    switch (currentStep) {
      case 1: // Property
        return propertyAddress.length > 5 && unitCount > 0;
      case 2: // Phone
        return botPhone.length >= 10 && ownerPhone.length >= 10 && selectedPhoneId !== '';
      case 3: // Compliance
        return complianceItems.every(item => item.checked);
      case 4: // Units
        return units.length > 0 && units.every(u => u.unitNumber && u.rentAmount > 0);
      default:
        return true;
    }
  };
  
  if (!isOpen) return null;
  
  const StepIcon = STEPS[currentStep].icon;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900/30 to-slate-900/50 border-b border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Sparkles className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">{t('onboarding.welcome')}</h2>
                <p className="text-sm text-slate-400">{t('onboarding.getStarted')}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              {t('common.close')}
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm text-slate-500">
              {currentStep + 1} / {STEPS.length}
            </span>
          </div>
        </div>
        
        {/* Step Indicators */}
        <div className="flex items-center gap-1 px-6 py-3 bg-slate-800/30 overflow-x-auto">
          {STEPS.map((step, index) => (
            <div 
              key={step.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                index === currentStep 
                  ? 'bg-amber-500/20 text-amber-400'
                  : index < currentStep
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-slate-500'
              }`}
            >
              <step.icon className="w-4 h-4" />
              <span className="text-sm font-medium whitespace-nowrap hidden sm:inline">{step.title}</span>
              {index < STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 ml-2 opacity-50" />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto p-6 ${isAnimating ? 'opacity-0' : 'opacity-100'} transition-opacity duration-150`}>
          
          {/* STEP 0: Welcome */}
          {currentStep === 0 && (
            <div className="text-center space-y-8">
              <div className="flex justify-center">
                <div className="p-4 bg-gradient-to-br from-amber-500/20 to-purple-500/20 rounded-2xl">
                  <Sparkles className="w-16 h-16 text-amber-400" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-slate-100">Welcome to LandlordBot</h3>
              <p className="text-slate-400 max-w-md mx-auto">
                Your AI-powered property manager for NYC. We'll get you set up in just a few minutes.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto pt-4">
                {[
                  { icon: MessageSquare, title: '24/7 AI Assistant', desc: 'Answers tenant calls/texts instantly' },
                  { icon: ShieldCheck, title: 'NYC Compliance', desc: 'Automated HPD, lead paint reminders' },
                  { icon: Phone, title: 'Rent Collection', desc: 'Automated reminders & late fee tracking' },
                  { icon: Building2, title: 'Maintenance', desc: 'Triage issues & dispatch vendors' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-xl text-left">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                      <Icon className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">{title}</p>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Language Picker in Onboarding */}
              <div className="pt-6 border-t border-slate-800">
                <p className="text-sm text-slate-400 mb-4">
                  Choose your language / Elija su idioma / 选择您的语言 / भाषा चुनें
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-2">
                  {[
                    { code: 'en', name: 'English', flag: '🇺🇸' },
                    { code: 'es', name: 'Español', flag: '🇪🇸' },
                    { code: 'zh', name: '中文', flag: '🇨🇳' },
                    { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
                    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
                    { code: 'ur', name: 'اردو', flag: '🇵🇰' },
                    { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
                    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
                    { code: 'uk', name: 'Українська', flag: '🇺🇦' },
                    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
                    { code: 'sq', name: 'Shqip', flag: '🇦🇱' },
                    { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
                    { code: 'ht', name: 'Kreyòl', flag: '🇭🇹' },
                    { code: 'pt', name: 'Português', flag: '🇧🇷' },
                    { code: 'tl', name: 'Filipino', flag: '🇵🇭' },
                    { code: 'yi', name: 'ייִדיש', flag: '✡️' },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code as any)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors justify-start ${
                        currentLanguage === lang.code
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-3 text-center">
                  20 languages supported — reflecting NYC's diverse immigrant communities
                </p>
              </div>
            </div>
          )}
          
          {/* STEP 1: Property */}
          {currentStep === 1 && (
            <div className="max-w-lg mx-auto space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Property Address</label>
                <AddressAutocomplete
                  value={propertyAddress}
                  onChange={(value) => setPropertyAddress(value)}
                  placeholder="123 Main St, Brooklyn, NY 11201"
                  useGooglePlaces={!!(import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY}
                />
                <p className="text-xs text-slate-500 mt-2">Enter the street address of your NYC property</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Number of Units</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setUnitCount(Math.max(1, unitCount - 1))}
                    className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <span className="text-xl">−</span>
                  </button>
                  <input
                    type="number"
                    value={unitCount}
                    onChange={(e) => setUnitCount(parseInt(e.target.value) || 1)}
                    className="w-24 text-center py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-semibold text-xl"
                  />
                  <button
                    onClick={() => setUnitCount(unitCount + 1)}
                    className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <span className="text-xl">+</span>
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Unlimited units on free tier — no restrictions
                </p>
              </div>
            </div>
          )}
          
          {/* STEP 2: Phone - Plain Text Input (No SMS/Verification) */}
          {currentStep === 2 && (
            <div className="max-w-lg mx-auto space-y-6">
              {/* Your Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Your Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-amber-500 outline-none"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">Used for notifications about tenant issues</p>
              </div>
              
              {/* Bot Phone Number */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Bot Phone Number</label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="tel"
                    placeholder="(555) 987-6543"
                    value={botPhone}
                    onChange={(e) => setBotPhone(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
              
              {/* PROMINENT SPAM PREVENTION NOTE */}
              {botPhone && (
                <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Save className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-emerald-400">⚠️ Important: Save This Number!</p>
                      <p className="text-sm text-slate-300 mt-1">
                        Your bot number is: <strong className="text-emerald-300">{botPhone}</strong>
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={copyPhoneToClipboard}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm rounded-lg transition-colors"
                        >
                          {phoneCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {phoneCopied ? 'Copied!' : 'Copy Number'}
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 mt-3">
                        ✅ <strong>Save this number to your contacts as "LandlordBot"</strong> to prevent texts/calls from going to spam. <br/>
                        Tenants will be texting this number, so make sure it looks legitimate!
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-xs text-amber-400"><span className="font-semibold">💡 Pro Tip:</span> Use a local NYC area code (212, 646, 718, 917, 929) for better tenant response rates.</p>
              </div>
            </div>
          )}
          
          {/* STEP 3: Compliance */}
          {currentStep === 3 && (
            <div className="max-w-lg mx-auto space-y-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-400">
                  <span className="font-semibold">NYC Landlord Requirements:</span> These are legally required for all NYC residential properties. Skipping them can result in fines.
                </p>
              </div>
              
              {complianceItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleCompliance(item.id)}
                  className={`flex items-start gap-4 p-4 bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-800 transition-all ${
                    item.checked ? 'border-2 border-emerald-500/50' : 'border-2 border-transparent'
                  }`}
                >
                  <div className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                    item.checked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
                  }`}>
                    {item.checked && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-medium text-slate-200">{item.label}</p>
                    <p className="text-sm text-slate-500">{item.description}</p>
                  </div>
                  {item.required && (
                    <span className="flex-shrink-0 px-2 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded">
                      Required
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* STEP 4: Number of Units (CHANGED FROM LISTINGS) - WITH PROPERTY VALUATION */}
          {currentStep === 4 && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Property Valuation Card */}
              {valuation && (
                <div className="p-5 bg-gradient-to-r from-amber-900/30 to-slate-900/50 border border-amber-500/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-5 h-5 text-amber-400" />
                    <h4 className="font-semibold text-slate-200">Property Valuation Estimate</h4>
                    {valuation.dataSource === 'estimated' && (
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 text-xs font-semibold rounded-full border border-amber-500/30">
                        Estimated
                      </span>
                    )}
                    <span className="ml-auto text-xs text-slate-500">
                      {new Date(valuation.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-xs text-slate-500">Est. Market Value</p>
                      <p className="text-lg font-semibold text-emerald-400">
                        {propertyValuationService.formatCurrency(valuation.estimatedValue)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {valuation.pricePerSqft.toLocaleString()}/sqft
                      </p>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-xs text-slate-500">Est. Monthly Rent</p>
                      <p className="text-lg font-semibold text-amber-400">
                        {propertyValuationService.formatCurrency(valuation.estimatedRent)}
                      </p>
                      <p className="text-xs text-slate-500">
                        range: {propertyValuationService.formatCurrency(valuation.estimatedRentLow)}-{propertyValuationService.formatCurrency(valuation.estimatedRentHigh)}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-xs text-slate-500">Cap Rate</p>
                      <p className="text-lg font-semibold text-blue-400">{valuation.capRate.toFixed(2)}%</p>
                      <p className="text-xs text-slate-500">GRM: {valuation.grossRentMultiplier}</p>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-xs text-slate-500">Market Trend</p>
                      <p className={`text-lg font-semibold ${valuation.valueChange30Days >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {valuation.valueChange30Days >= 0 ? '+' : ''}{valuation.valueChange30Days.toFixed(1)}%
                      </p>
                      <p className="text-xs text-slate-500">30 day change</p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {valuation.dataSource === 'estimated'
                      ? `Estimated from ${valuation.comparables.length} comparable properties in the area`
                      : `Based on ${valuation.comparables.length} comparable properties in the area`}
                  </p>
                </div>
              )}
              
              {valuationLoading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                  <span className="ml-2 text-slate-400 text-sm">Loading market data...</span>
                </div>
              )}
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-slate-200">Unit Details</h4>
                  <span className="text-xs text-slate-500">
                    {units.length} unit{units.length !== 1 ? 's' : ''} configured
                  </span>
                </div>
                
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                  {units.map((unit, index) => (
                    <div key={index} className="p-4 bg-slate-800/50 rounded-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-slate-200">Unit {unit.unitNumber}</h5>
                        <span className="text-sm text-slate-500">#{index + 1}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Unit #</label>
                          <input
                            type="text"
                            value={unit.unitNumber}
                            onChange={(e) => updateUnitInfo(index, 'unitNumber', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">BR</label>
                          <input
                            type="number"
                            value={unit.bedrooms}
                            onChange={(e) => updateUnitInfo(index, 'bedrooms', parseInt(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">BA</label>
                          <input
                            type="number"
                            step="0.5"
                            value={unit.bathrooms}
                            onChange={(e) => updateUnitInfo(index, 'bathrooms', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">SqFt</label>
                          <input
                            type="number"
                            value={unit.squareFeet}
                            onChange={(e) => updateUnitInfo(index, 'squareFeet', parseInt(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Rent</label>
                          <input
                            type="number"
                            value={unit.rentAmount}
                            onChange={(e) => updateUnitInfo(index, 'rentAmount', parseInt(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <button
                onClick={addNewUnit}
                className="w-full py-3 border-2 border-dashed border-slate-700 hover:border-amber-500 text-slate-500 hover:text-amber-400 rounded-xl transition-colors font-medium"
              >
                + Add Unit
              </button>
            </div>
          )}
          
          {/* STEP 5: Ready */}
          {currentStep === 5 && (
            <div className="text-center space-y-6">
              <div className="flex justify-center pt-4">
                <div className="p-6 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-full">
                  <CheckCircle className="w-20 h-20 text-emerald-400" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-slate-100">You're Ready!</h3>
              <p className="text-slate-400 max-w-md mx-auto">
                Your property is set up. Your AI assistant is ready to handle tenant calls.
              </p>
              
              {/* Recap Card */}
              <div className="max-w-md mx-auto p-4 bg-slate-800/50 rounded-xl text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Bot Number:</span>
                  <span className="font-medium text-amber-400">{botPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Property:</span>
                  <span className="font-medium text-slate-300">{propertyAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Units:</span>
                  <span className="font-medium text-slate-300">{units.length} units configured</span>
                </div>
              </div>
              
              {/* Spam Warning Recap */}
              <div className="max-w-md mx-auto p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <p className="text-sm text-yellow-400 text-left">
                    <strong>Remember:</strong> Save {botPhone} to your contacts as "LandlordBot" 
                    to prevent messages from going to spam!
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="p-4 bg-slate-800/50 rounded-xl text-left">
                  <p className="text-sm text-slate-400">What happens next:</p>
                  <ul className="mt-2 space-y-2 text-sm text-slate-300">
                    <li>• Tenants text your bot number</li>
                    <li>• AI answers 24/7</li>
                    <li>• You get summaries</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-slate-800/50 rounded-xl text-left">
                  <p className="text-sm text-slate-400">You'll track:</p>
                  <ul className="mt-2 space-y-2 text-sm text-slate-300">
                    <li>• Rent collection</li>
                    <li>• Maintenance issues</li>
                    <li>• Lease renewals</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              currentStep === 0
                ? 'text-slate-600 cursor-not-allowed'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            {t('onboarding.back') || 'Back'}
          </button>
          
          {currentStep === STEPS.length - 1 ? (
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-semibold rounded-lg transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              {t('onboarding.complete') || 'Complete Setup'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed() || isLoading}
              className={`flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-all ${
                canProceed() && !isLoading
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>{currentStep === 0 ? 'Get Started' : 'Continue'}</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
