import {
  OPENAI_LANGUAGES,
  SARVAM_LANGUAGES,
  TranslationVendor,
} from "@/lib/translation/types";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useDocumentEditor } from "./LegalEditor/reducersContexts/documentEditorReducerContext";

interface TranslationDropdownProps {
  onTranslate: (_vendor: TranslationVendor, _language: string) => Promise<void>;
  isLoading: boolean;
  selectedLanguage: string;
  onLanguageChange: (_language: string) => void;
  selectedVendor: TranslationVendor;
  onVendorChange: (_vendor: TranslationVendor) => void;
}

export function TranslationDropdown({ 
  onTranslate, 
  isLoading,
  selectedLanguage,
  onLanguageChange,
  selectedVendor,
  onVendorChange
}: TranslationDropdownProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { docEditorState } = useDocumentEditor();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Close dropdown when pressing Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDropdown]);

  const handleTranslate = async () => {
    setShowDropdown(false);
    await onTranslate(selectedVendor, selectedLanguage);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="inline-flex border border-border rounded-lg">
        {/* Main Action Button */}
        <button
          onClick={()=>{
            handleTranslate();
          }}
          disabled={docEditorState.isTranslating}
          className="pl-3 pr-1 py-2 text-sm bg-white text-text hover:bg-background-dark focus:ring-border/50 shadow-sm rounded-l-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span>Translate</span>
        </button>
        
        {/* Dropdown Toggle Button */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="pl-1 pr-3 py-2 text-sm bg-white text-text hover:bg-background-dark focus:ring-border/50 shadow-sm rounded-r-lg -ml-px transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={docEditorState.isTranslating}
        >
          {docEditorState.isTranslating ? 
          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div> 
          : showDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg ring-1 ring-black
                      ring-opacity-5 bg-white z-50">
          <div className="p-3">
            <select
              value={selectedVendor}
              onChange={(e) => onVendorChange(e.target.value as TranslationVendor)}
              className="w-full px-2 py-1.5 text-sm border rounded-md mb-3"
            >
              <option value="openai">OpenAI</option>
              <option value="sarvam">Sarvam AI</option>
            </select>

            <select
              value={selectedLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border rounded-md"
            >
              {selectedVendor === "sarvam"
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