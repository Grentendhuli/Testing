import { useState } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';

export function LanguagePicker() {
  const { currentLanguage, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
        aria-label={t('common.language') || 'Language'}
      >
        <Globe className="w-4 h-4 text-amber-400" />
        <span className="hidden sm:inline text-slate-300">
          {currentLang?.nativeName}
        </span>
        <span className="sm:hidden">{currentLang?.flag}</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 max-h-[70vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 py-2">
            <div className="px-3 py-2 border-b border-slate-800">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                🌍 NYC's Most Spoken Languages
              </p>            </div>
            
            <div className="py-1">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-800 transition-colors ${
                    currentLanguage === lang.code ? 'bg-slate-800/50' : ''
                  }`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-200">{lang.nativeName}</p>
                    <p className="text-xs text-slate-500">{lang.name}</p>
                  </div>
                  {currentLanguage === lang.code && (
                    <Check className="w-4 h-4 text-amber-400" />
                  )}
                </button>              ))}
            </div>
            
            <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-500">
              These are the most spoken non-English languages among NYC's 3.1 million foreign-born residents.
            </div>
          </div>        </>
      )}
    </div>
  );
}
