import { ChevronDown } from 'lucide-react';
import { useRef, useState } from 'react';
import { OPENAI_LANGUAGES, SARVAM_LANGUAGES, TranslationVendor } from '@/lib/translation/types';

interface TranslationDropdownProps {
  onTranslate: (vendor: TranslationVendor, language: string) => Promise<void>;
  isLoading: boolean;
}

export function TranslationDropdown({ onTranslate, isLoading }: TranslationDropdownProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [vendor, setVendor] = useState<TranslationVendor>('openai');
  const [language, setLanguage] = useState('en-IN');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleTranslate = async () => {
    await onTranslate(vendor, language);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex">
        <button
          onClick={handleTranslate}
          disabled={isLoading}
          className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-l-lg
                   hover:bg-blue-100 transition-colors disabled:opacity-50
                   flex items-center gap-2 border-r border-blue-200"
        >
          <span>Translate</span>
          {isLoading && <div className="animate-spin">⏳</div>}
        </button>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="px-2 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-r-lg
                   hover:bg-blue-100 transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg ring-1 ring-black
                      ring-opacity-5 bg-white z-50">
          <div className="p-3">
            <select
              value={vendor}
              onChange={(e) => setVendor(e.target.value as TranslationVendor)}
              className="w-full px-2 py-1.5 text-sm border rounded-md mb-3"
            >
              <option value="openai">OpenAI</option>
              <option value="sarvam">Sarvam AI</option>
            </select>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border rounded-md"
            >
              {vendor === "sarvam"
                ? SARVAM_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))
                : OPENAI_LANGUAGES.map(lang => (
                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                  ))
              }
            </select>
          </div>
        </div>
      )}
    </div>
  );
} 