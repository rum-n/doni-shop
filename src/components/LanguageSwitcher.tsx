'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGE_STORAGE_KEY = 'userLanguagePreference';

export default function LanguageSwitcher() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState('en'); // Default to English
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'EN' },
    { code: 'bg', name: 'BG' },
    { code: 'de', name: 'DE' },
  ];

  // Initialize locale from localStorage or browser settings
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // First check localStorage for saved preference
    const savedLocale = localStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (savedLocale && languages.some(lang => lang.code === savedLocale)) {
      setCurrentLocale(savedLocale);
      // Try to change i18n language if available
      if (i18n && typeof i18n.changeLanguage === 'function') {
        i18n.changeLanguage(savedLocale);
      }
      return;
    }

    // Fall back to browser locale detection if no saved preference
    const detectBrowserLocale = () => {
      if (navigator) {
        // Get browser language (e.g., 'en-US', 'bg', etc.)
        const browserLang = navigator.language || (navigator as any).userLanguage;

        // Extract the base language code (e.g., 'en' from 'en-US')
        const baseLang = browserLang.split('-')[0].toLowerCase();

        // Check if we support this language
        const isSupported = languages.some(lang => lang.code === baseLang);

        // Set the locale (use browser's if supported, otherwise default to 'en')
        const detectedLocale = isSupported ? baseLang : 'en';
        setCurrentLocale(detectedLocale);

        // Also store this initial detected preference
        localStorage.setItem(LANGUAGE_STORAGE_KEY, detectedLocale);

        // Try to change i18n language if available
        if (i18n && typeof i18n.changeLanguage === 'function') {
          i18n.changeLanguage(detectedLocale);
        }
      }
    };

    detectBrowserLocale();
  }, [i18n]);

  // Update currentLocale when i18n language changes
  useEffect(() => {
    if (i18n && i18n.language) {
      setCurrentLocale(i18n.language);
    }
  }, [i18n?.language]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLocaleChange = (locale: string) => {
    // Update state
    setCurrentLocale(locale);
    setIsDropdownOpen(false);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, locale);
    }

    // Change i18n language if available
    if (i18n && typeof i18n.changeLanguage === 'function') {
      i18n.changeLanguage(locale);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-600 hover:text-gray-900 focus:outline-none cursor-pointer"
      >
        <span>{currentLocale.toUpperCase()}</span>
        <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-20 bg-white rounded-md shadow-lg z-100">
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLocaleChange(lang.code)}
                className={`block px-4 py-2 text-sm cursor-pointer ${currentLocale === lang.code
                  ? 'text-gray-900 bg-gray-100'
                  : 'text-gray-700 hover:bg-gray-100'
                  } w-full text-left cursor-pointer`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}