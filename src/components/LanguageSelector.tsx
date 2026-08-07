import React, { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageCode } from '../contexts/translations';

const LanguageSelector: React.FC = () => {
  const { currentLanguage, setLanguage, availableLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (code: string) => {
    const language = availableLanguages.find(l => l.code === code);
    if (language) setLanguage(language);
    setIsOpen(false);
    // Reload page to apply translations
    window.location.reload();
  };

  const currentLang = availableLanguages.find(l => l.code === currentLanguage.code);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 transition-all duration-200 border border-pink-500/30"
        aria-label="Select language"
      >
        <Globe className="w-4 h-4 text-pink-400" />
        <span className="text-sm font-medium text-white">
          {currentLang?.flag} {currentLang?.name}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-56 bg-slate-900 border border-pink-500/30 rounded-xl shadow-2xl shadow-pink-500/20 z-50 overflow-hidden">
            <div className="p-3 border-b border-white/10">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                Select Language
              </p>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {availableLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-pink-500/10 ${
                    currentLanguage.code === lang.code
                      ? 'bg-pink-500/20 text-pink-300'
                      : 'text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{lang.flag}</span>
                    <span className="text-sm font-medium">{lang.name}</span>
                  </div>
                  {currentLanguage.code === lang.code && (
                    <Check className="w-4 h-4 text-pink-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
