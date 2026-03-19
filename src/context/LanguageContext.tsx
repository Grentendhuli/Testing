import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type Language = 
  | 'en' // English
  | 'es' // Spanish
  | 'zh' // Chinese
  | 'bn' // Bengali
  | 'hi' // Hindi
  | 'ur' // Urdu
  | 'pa' // Punjabi
  | 'ru' // Russian
  | 'uk' // Ukrainian
  | 'pl' // Polish
  | 'sq' // Albanian
  | 'el' // Greek
  | 'ht' // Haitian Creole
  | 'fr' // French
  | 'pt' // Portuguese
  | 'ar' // Arabic
  | 'tl' // Tagalog
  | 'ko' // Korean
  | 'it' // Italian
  | 'yi' // Yiddish;

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip', flag: '🇦🇱' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'ht', name: 'Haitian Creole', nativeName: 'Kreyòl', flag: '🇭🇹' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'tl', name: 'Tagalog', nativeName: 'Filipino', flag: '🇵🇭' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'yi', name: 'Yiddish', nativeName: 'ייִדיש', flag: '✡️' },
];

// Translation keys type
export type TranslationKey = 
  // Navigation
  | 'nav.dashboard' | 'nav.units' | 'nav.leads' | 'nav.maintenance' 
  | 'nav.rent' | 'nav.assistant' | 'nav.reports' | 'nav.compliance'
  | 'nav.settings' | 'nav.billing' | 'nav.market'
  // Dashboard
  | 'dashboard.title' | 'dashboard.portfolio' | 'dashboard.occupancy' 
  | 'dashboard.revenue' | 'dashboard.growth' | 'dashboard.quicklinks'
  | 'dashboard.estimatedValue' | 'dashboard.monthlyRevenue' | 'dashboard.unitStatus'
  | 'dashboard.newLeads' | 'dashboard.pendingMaintenance'
  // Assistant
  | 'assistant.title' | 'assistant.subtitle' | 'assistant.online' | 'assistant.offline'
  | 'assistant.timeSaved' | 'assistant.totalActions' | 'assistant.autoCompleted'
  | 'assistant.pending' | 'assistant.escalated'
  // Onboarding
  | 'onboarding.welcome' | 'onboarding.getStarted' | 'onboarding.step1'
  | 'onboarding.step2' | 'onboarding.step3' | 'onboarding.step4'
  | 'onboarding.step5' | 'onboarding.propertyAddress' | 'onboarding.units'
  | 'onboarding.phoneNumber' | 'onboarding.compliance' | 'onboarding.listings'
  | 'onboarding.finish' | 'onboarding.next' | 'onboarding.back'
  | 'onboarding.skip' | 'onboarding.complete'
  // Common
  | 'common.language' | 'common.save' | 'common.cancel' | 'common.continue' | 'common.close'
  | 'common.edit' | 'common.delete' | 'common.add' | 'common.search'
  | 'common.loading' | 'common.error' | 'common.success'
  // Units
  | 'units.title' | 'units.occupied' | 'units.vacant' | 'units.rent'
  | 'units.bedrooms' | 'units.bathrooms' | 'units.tenant'
  // Compliance
  | 'compliance.title' | 'compliance.leadPaint' | 'compliance.hpd'
  | 'compliance.fireSafety' | 'compliance.carbonMonoxide'
  // Rent
  | 'rent.collect' | 'rent.upcoming' | 'rent.late' | 'rent.paid';

// Initial translations (can be expanded)
const TRANSLATIONS: Record<Language, Partial<Record<TranslationKey, string>>> = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.units': 'Units',
    'nav.leads': 'Leads',
    'nav.maintenance': 'Maintenance',
    'nav.rent': 'Rent Collection',
    'nav.assistant': 'Assistant',
    'nav.reports': 'Reports',
    'nav.compliance': 'NYC Compliance',
    'nav.settings': 'Settings',
    'nav.billing': 'Billing',
    'nav.market': 'Market',
    'dashboard.title': 'Portfolio Overview',
    'dashboard.portfolio': 'Property Portfolio',
    'dashboard.occupancy': 'Occupancy',
    'dashboard.revenue': 'Revenue',
    'dashboard.growth': 'Growth Opportunities',
    'dashboard.quicklinks': 'Quick Links',
    'dashboard.estimatedValue': 'Estimated Portfolio Value',
    'dashboard.monthlyRevenue': 'Monthly Revenue',
    'dashboard.unitStatus': 'Unit Status',
    'dashboard.newLeads': 'New Leads',
    'dashboard.pendingMaintenance': 'Pending Maintenance',
    'assistant.title': 'Landlord Assistant',
    'assistant.subtitle': 'Your AI-powered property management partner',
    'assistant.online': 'Assistant Online',
    'assistant.offline': 'Offline',
    'assistant.timeSaved': 'Time Saved This Month',
    'assistant.totalActions': 'Total Actions',
    'assistant.autoCompleted': 'Auto-Completed',
    'assistant.pending': 'Pending Review',
    'assistant.escalated': 'Escalated',
    'onboarding.welcome': 'Welcome to LandlordBot',
    'onboarding.getStarted': "Let's set up your property",
    'onboarding.step1': 'Property Info',
    'onboarding.step2': 'Phone Setup',
    'onboarding.step3': 'Compliance',
    'onboarding.step4': 'Listings',
    'onboarding.step5': 'Ready',
    'onboarding.propertyAddress': 'Property Address',
    'onboarding.units': 'Number of Units',
    'onboarding.phoneNumber': 'Bot Phone Number',
    'onboarding.compliance': 'NYC Compliance Check',
    'onboarding.listings': 'Create Listings',
    'onboarding.finish': "You're Ready",
    'onboarding.next': 'Continue',
    'onboarding.back': 'Back',
    'onboarding.skip': 'Skip for Now',
    'onboarding.complete': 'Complete Setup',
    'common.language': 'Language',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.continue': 'Continue',
    'common.close': 'Close',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'units.title': 'Units',
    'units.occupied': 'Occupied',
    'units.vacant': 'Vacant',
    'units.rent': 'Monthly Rent',
    'units.bedrooms': 'Bedrooms',
    'units.bathrooms': 'Bathrooms',
    'units.tenant': 'Current Tenant',
    'compliance.title': 'Compliance',
    'compliance.leadPaint': 'Lead Paint Disclosure',
    'compliance.hpd': 'HPD Registration',
    'compliance.fireSafety': 'Fire Safety',
    'compliance.carbonMonoxide': 'Carbon Monoxide Detectors',
    'rent.collect': 'Collect Rent',
    'rent.upcoming': 'Upcoming',
    'rent.late': 'Late',
    'rent.paid': 'Paid',
  },
  es: {
    'nav.dashboard': 'Panel de Control',
    'nav.units': 'Unidades',
    'nav.leads': 'Prospectos',
    'nav.maintenance': 'Mantenimiento',
    'nav.rent': 'Cobro',
    'nav.assistant': 'Asistente',
    'dashboard.title': 'Resumen de Propiedad',
    'dashboard.estimatedValue': 'Valor Estimado',
    'dashboard.occupancy': 'Ocupación',
    'assistant.title': 'Asistente del Propietario',
    'assistant.subtitle': 'Su socio de gestión de propiedades con IA',
    'onboarding.welcome': 'Bienvenido a LandlordBot',
    'onboarding.getStarted': 'Configuremos su propiedad',
    'onboarding.propertyAddress': 'Dirección de la Propiedad',
    'onboarding.units': 'Número de Unidades',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.continue': 'Continuar',
  },
  zh: {
    'nav.dashboard': '仪表板',
    'nav.units': '单元',
    'nav.leads': '潜在客户',
    'nav.rent': '收款',
    'nav.assistant': '助手',
    'dashboard.title': '房产概览',
    'dashboard.estimatedValue': '估计价值',
    'dashboard.occupancy': '入住率',
    'assistant.title': '房东助手',
    'onboarding.welcome': '欢迎使用LandlordBot',
    'onboarding.propertyAddress': '物业地址',
    'onboarding.units': '单元数量',
    'common.save': '保存',
    'common.continue': '继续',
  },
  bn: {
    'nav.dashboard': 'ড্যাশবোর্ড',
    'nav.units': 'ইউনিট',
    'nav.leads': 'সম্ভাব্য ভাড়াটে',
    'dashboard.title': 'সম্পত্তির সারসংক্ষেপ',
    'onboarding.welcome': 'LandlordBot এ স্বাগতম',
  },
  ru: {
    'nav.dashboard': 'Панель управления',
    'nav.units': 'Квартиры',
    'nav.leads': 'Клиенты',
    'dashboard.title': 'Обзор недвижимости',
    'assistant.title': 'Помощник арендодателя',
    'onboarding.welcome': 'Добро пожаловать в LandlordBot',
  },
  ht: {
    'nav.dashboard': 'Tablo',
    'nav.units': 'Inite yo',
    'dashboard.title': 'Apèsi sou pwopriyete',
    'onboarding.welcome': 'Byenveni nan LandlordBot',
  },
  fr: {
    'nav.dashboard': 'Tableau de bord',
    'nav.units': 'Unités',
    'nav.leads': 'Prospects',
    'dashboard.title': "Vue d'ensemble",
  },
  ar: {
    'nav.dashboard': 'لوحة التحكم',
    'nav.units': 'الوحدات',
    'dashboard.title': 'نظرة عامة',
  },
  ko: {
    'nav.dashboard': '대시보드',
    'nav.units': '유닛',
    'dashboard.title': '자산 개요',
  },
  it: {
    'nav.dashboard': 'Pannello',
    'nav.units': 'Unità',
    'dashboard.title': 'Panoramica',
  },
  hi: {
    'nav.dashboard': 'डैशबोर्ड',
    'nav.units': 'यूनिट',
    'nav.leads': 'ग्राहक',
    'dashboard.title': 'संपत्ति अवलोकन',
    'assistant.title': 'मकान मालिक सहायक',
    'onboarding.welcome': 'LandlordBot में आपका स्वागत है',
    'onboarding.propertyAddress': 'संपत्ति का पता',
  },
  ur: {
    'nav.dashboard': 'ڈیش بورڈ',
    'nav.units': 'یونٹس',
    'dashboard.title': 'پراپرٹی کا جائزہ',
    'assistant.title': 'لینڈ لارڈ اسسٹنٹ',
    'onboarding.welcome': 'LandlordBot میں خوش آمدید',
  },
  pa: {
    'nav.dashboard': 'ਡੈਸ਼ਬੋਰਡ',
    'nav.units': 'ਯੂਨਿਟ',
    'dashboard.title': 'ਜਾਇਦਾਦ ਸਾਰ',
    'onboarding.welcome': 'LandlordBot ਵਿਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ',
  },
  uk: {
    'nav.dashboard': 'Панель керування',
    'nav.units': 'Квартири',
    'nav.leads': 'Клієнти',
    'dashboard.title': 'Огляд нерухомості',
    'assistant.title': 'Помічник орендодавця',
    'onboarding.welcome': 'Ласкаво просимо до LandlordBot',
  },
  pl: {
    'nav.dashboard': 'Panel',
    'nav.units': 'Jednostki',
    'nav.leads': 'Klienci',
    'dashboard.title': 'Przegląd nieruchomości',
    'assistant.title': 'Asystent wynajmującego',
    'onboarding.welcome': 'Witamy w LandlordBot',
  },
  sq: {
    'nav.dashboard': 'Paneli',
    'nav.units': 'Njësi',
    'nav.leads': 'Klientë',
    'dashboard.title': 'Përmbledhja e Pronës',
    'assistant.title': 'Asistenti i Pronarit',
    'onboarding.welcome': 'Mirë se vini në LandlordBot',
  },
  el: {
    'nav.dashboard': 'Πίνακας',
    'nav.units': 'Μονάδες',
    'nav.leads': 'Πελάτες',
    'dashboard.title': 'Επισκόπηση Ακινήτου',
    'assistant.title': 'Βοηθός Ιδιοκτήτη',
    'onboarding.welcome': 'Καλώς ήρθατε στο LandlordBot',
  },
  pt: {
    'nav.dashboard': 'Painel',
    'nav.units': 'Unidades',
    'nav.leads': 'Clientes',
    'dashboard.title': 'Visão Geral',
    'assistant.title': 'Assistente do Proprietário',
    'onboarding.welcome': 'Bem-vindo ao LandlordBot',
    'onboarding.propertyAddress': 'Endereço da Propriedade',
  },
  tl: {
    'nav.dashboard': 'Dashboard',
    'nav.units': 'Units',
    'nav.leads': 'Kliyente',
    'dashboard.title': 'Pagtataya',
    'assistant.title': 'Assistant ng Landlord',
    'onboarding.welcome': 'Maligayang pagdating sa LandlordBot',
  },
  yi: {
    'nav.dashboard': 'דאַשבאָרד',
    'nav.units': 'יוניטס',
    'dashboard.title': 'פּאָרטפעליוו',
    'assistant.title': 'לאַנדלאָרד אַסיסטאַנט',
    'onboarding.welcome': 'ברוכים הבאים צו LandlordBot',
  },
};

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  tWithVars: (key: TranslationKey, vars: Record<string, string>) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  // Initialize after mount
  useEffect(() => {
    const saved = localStorage.getItem('landlord_language');
    const initialLang = (saved as Language) || 'en';
    setCurrentLanguage(initialLang);
    document.documentElement.lang = initialLang;
    document.documentElement.dir = initialLang === 'ar' ? 'rtl' : 'ltr';
    setMounted(true);
  }, []);

  const isRTL = currentLanguage === 'ar';

  const setLanguage = useCallback((lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem('landlord_language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    const translation = TRANSLATIONS[currentLanguage]?.[key];
    return translation || TRANSLATIONS['en']?.[key] || key;
  }, [currentLanguage]);

  const tWithVars = useCallback((key: TranslationKey, vars: Record<string, string>): string => {
    let text = t(key);
    Object.entries(vars).forEach(([varKey, value]) => {
      text = text.replace(new RegExp(`{{${varKey}}}`, 'g'), value);
    });
    return text;
  }, [t]);

  // Prevent hydration mismatch
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      setLanguage,
      t,
      tWithVars,
      isRTL,
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
