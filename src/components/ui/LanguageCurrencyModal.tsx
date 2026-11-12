'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Globe, DollarSign, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

interface LanguageCurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLanguage?: string;
  defaultCurrency?: string;
  /** Pre-selected language/region code (e.g., 'id-ID') */
  selectedLanguage?: string;
  /** Pre-selected currency code (e.g., 'IDR') */
  selectedCurrency?: string;
  onLanguageSelect?: (code: string, name: string) => void;
  onCurrencySelect?: (code: string, symbol: string) => void;
}

/**
 * Modal for selecting Language & Region and Currency.
 * Uses a center-positioned overlay with tabs, scrollable content, and focus trap.
 */
export function LanguageCurrencyModal({
  isOpen,
  onClose,
  defaultLanguage = 'id-ID',
  defaultCurrency = 'IDR',
  selectedLanguage,
  selectedCurrency,
  onLanguageSelect,
  onCurrencySelect,
}: LanguageCurrencyModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const [activeTab, setActiveTab] = useState<'language' | 'currency'>('language');
  const [searchQuery, setSearchQuery] = useState('');

  // Keep the latest callback
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  // Focus trap + body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    previousFocus.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    const firstFocusable = panel?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();

    function trapTab(event: KeyboardEvent) {
      if (event.key !== 'Tab' || !panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', trapTab);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', trapTab);
      document.body.style.overflow = '';
      previousFocus.current?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Language & Region data (subset for demo; in production load from i18n)
  const suggestedLanguages = [
    { code: 'id-ID', language: 'Bahasa Indonesia', region: 'Indonesia', flag: '🇮🇩' },
  ];

  const allLanguages = [
    { code: 'en-US', language: 'English', region: 'United States', flag: '🇺🇸' },
    { code: 'en-GB', language: 'English', region: 'United Kingdom', flag: '🇬🇧' },
    { code: 'id-ID', language: 'Bahasa Indonesia', region: 'Indonesia', flag: '🇮🇩' },
    { code: 'az-AZ', language: 'Azərbaycanca', region: 'Azerbaijan', flag: '🇦🇿' },
    { code: 'bs-BA', language: 'Bosanski', region: 'Bosnia & Herzegovina', flag: '🇧🇦' },
    { code: 'ca-ES', language: 'Català', region: 'Spain', flag: '🇪🇸' },
    { code: 'cs-CZ', language: 'Čeština', region: 'Czech Republic', flag: '🇨🇿' },
    { code: 'da-DK', language: 'Dansk', region: 'Denmark', flag: '🇩🇰' },
    { code: 'de-DE', language: 'Deutsch', region: 'Germany', flag: '🇩🇪' },
    { code: 'el-GR', language: 'Ελληνικά', region: 'Greece', flag: '🇬🇷' },
    { code: 'es-ES', language: 'Español', region: 'Spain', flag: '🇪🇸' },
    { code: 'fi-FI', language: 'Suomi', region: 'Finland', flag: '🇫🇮' },
    { code: 'fr-FR', language: 'Français', region: 'France', flag: '🇫🇷' },
    { code: 'hi-IN', language: 'हिन्दी', region: 'India', flag: '🇮🇳' },
    { code: 'it-IT', language: 'Italiano', region: 'Italy', flag: '🇮🇹' },
    { code: 'ja-JP', language: '日本語', region: 'Japan', flag: '🇯🇵' },
    { code: 'ko-KR', language: '한국어', region: 'South Korea', flag: '🇰🇷' },
    { code: 'ms-MY', language: 'Bahasa Melayu', region: 'Malaysia', flag: '🇲🇾' },
    { code: 'nl-NL', language: 'Nederlands', region: 'Netherlands', flag: '🇳🇱' },
    { code: 'pl-PL', language: 'Polski', region: 'Poland', flag: '🇵🇱' },
    { code: 'pt-BR', language: 'Português', region: 'Brazil', flag: '🇧🇷' },
    { code: 'pt-PT', language: 'Português', region: 'Portugal', flag: '🇵🇹' },
    { code: 'ro-RO', language: 'Română', region: 'Romania', flag: '🇷🇴' },
    { code: 'ru-RU', language: 'Русский', region: 'Russia', flag: '🇷🇺' },
    { code: 'sv-SE', language: 'Svenska', region: 'Sweden', flag: '🇸🇪' },
    { code: 'th-TH', language: 'ไทย', region: 'Thailand', flag: '🇹🇭' },
    { code: 'tr-TR', language: 'Türkçe', region: 'Turkey', flag: '🇹🇷' },
    { code: 'vi-VN', language: 'Tiếng Việt', region: 'Vietnam', flag: '🇻🇳' },
    { code: 'zh-CN', language: '中文 (简体)', region: 'China', flag: '🇨🇳' },
    { code: 'zh-TW', language: '中文 (繁體)', region: 'Taiwan', flag: '🇹🇼' },
  ];

  const currencies = [
    { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', locale: 'id-ID' },
    { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
    { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
    { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
    { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', locale: 'ms-MY' },
    { code: 'THB', symbol: '฿', name: 'Thai Baht', locale: 'th-TH' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won', locale: 'ko-KR' },
    { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', locale: 'vi-VN' },
    { code: 'PHP', symbol: '₱', name: 'Philippine Peso', locale: 'en-PH' },
  ];

  const filteredLanguages = allLanguages.filter(
    (lang) =>
      lang.language.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCurrencies = currencies.filter(
    (cur) =>
      cur.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cur.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cur.symbol.includes(searchQuery)
  );

  const handleLanguageSelect = (lang: typeof allLanguages[0]) => {
    onLanguageSelect?.(lang.code, lang.language);
    onClose();
  };

  const handleCurrencySelect = (cur: typeof currencies[0]) => {
    onCurrencySelect?.(cur.code, cur.symbol);
    onClose();
  };

  const isLanguageSelected = (code: string) => selectedLanguage === code || (!selectedLanguage && code === defaultLanguage);
  const isCurrencySelected = (code: string) => selectedCurrency === code || (!selectedCurrency && code === defaultCurrency);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        className="relative w-full max-w-md max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
          <h2 id="modal-title" className="text-lg font-bold text-neutral-900">
            {activeTab === 'language' ? 'Language and region' : 'Currency'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-100 px-4" role="tablist" aria-label="Settings categories">
          <button
            role="tab"
            aria-selected={activeTab === 'language'}
            aria-controls="language-panel"
            id="language-tab"
            onClick={() => setActiveTab('language')}
            className={cn(
              'flex-1 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
              activeTab === 'language'
                ? 'text-brand-ink border-brand-ink'
                : 'text-neutral-500 hover:text-neutral-700 border-transparent'
            )}
          >
            Language and region
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'currency'}
            aria-controls="currency-panel"
            id="currency-tab"
            onClick={() => setActiveTab('currency')}
            className={cn(
              'flex-1 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
              activeTab === 'currency'
                ? 'text-brand-ink border-brand-ink'
                : 'text-neutral-500 hover:text-neutral-700 border-transparent'
            )}
          >
            Currency
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4">
          {activeTab === 'language' && (
            <div id="language-panel" role="tabpanel" aria-labelledby="language-tab">
              {/* Search */}
              <div className="mb-4 relative">
                <label htmlFor="language-search" className="sr-only">Search languages</label>
                <input
                  id="language-search"
                  type="search"
                  placeholder="Search languages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 pl-10 text-sm border border-neutral-200 rounded-xl focus:border-brand-ink focus:ring-2 focus:ring-brand/20 focus:outline-none"
                />
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" aria-hidden="true" />
              </div>

              {/* Suggested Language and Region */}
              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">Suggested Language and Region</h3>
                <div className="space-y-2">
                  {suggestedLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLanguageSelect(lang)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left min-h-[56px]',
                        isLanguageSelected(lang.code)
                          ? 'bg-brand/5 border-brand-ink'
                          : 'bg-white border-neutral-200 hover:bg-neutral-50 dark:bg-neutral-900 dark:border-white/10 dark:hover:bg-white/5'
                      )}
                    >
                      <span className="text-2xl" aria-hidden="true">{lang.flag}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 dark:text-white truncate">{lang.language}</p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">{lang.region}</p>
                      </div>
                      {isLanguageSelected(lang.code) && (
                        <Check className="w-5 h-5 text-brand-ink shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Choose a Language and Region */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Choose a Language and Region</h3>
                </div>
                <p className="text-xs text-neutral-500 mb-4 max-w-xs">
                  You can change this later in{' '}
                  <a href="/settings" className="text-brand-ink underline hover:text-brand" onClick={onClose}>
                    Account settings
                  </a>
                  .
                </p>

                <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                  {filteredLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLanguageSelect(lang)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors text-left min-h-[52px]',
                        isLanguageSelected(lang.code)
                          ? 'bg-brand/5 border-brand-ink'
                          : 'bg-white border-neutral-200 hover:bg-neutral-50 dark:bg-neutral-900 dark:border-white/10 dark:hover:bg-white/5'
                      )}
                    >
                      <span className="text-lg shrink-0" aria-hidden="true">{lang.flag}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{lang.language}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{lang.region}</p>
                      </div>
                      {isLanguageSelected(lang.code) && (
                        <Check className="w-4 h-4 text-brand-ink shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'currency' && (
            <div id="currency-panel" role="tabpanel" aria-labelledby="currency-tab">
              {/* Search */}
              <div className="mb-4 relative">
                <label htmlFor="currency-search" className="sr-only">Search currencies</label>
                <input
                  id="currency-search"
                  type="search"
                  placeholder="Search currencies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 pl-10 text-sm border border-neutral-200 rounded-xl focus:border-brand-ink focus:ring-2 focus:ring-brand/20 focus:outline-none"
                />
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" aria-hidden="true" />
              </div>

              {/* Currency List */}
              <div>
                <p className="text-xs text-neutral-500 mb-4 max-w-xs">
                  Prices are shown in the selected currency. You&apos;ll be charged in IDR. Other currencies are approximate.
                </p>

                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {filteredCurrencies.map((cur) => (
                    <button
                      key={cur.code}
                      type="button"
                      onClick={() => handleCurrencySelect(cur)}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors text-left min-h-[56px]',
                        isCurrencySelected(cur.code)
                          ? 'bg-brand/5 border-brand-ink'
                          : 'bg-white border-neutral-200 hover:bg-neutral-50 dark:bg-neutral-900 dark:border-white/10 dark:hover:bg-white/5'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-neutral-900 dark:text-white shrink-0">{cur.symbol}</span>
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">{cur.name}</p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">{cur.code}</p>
                        </div>
                      </div>
                      {isCurrencySelected(cur.code) && (
                        <Check className="w-5 h-5 text-brand-ink shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}