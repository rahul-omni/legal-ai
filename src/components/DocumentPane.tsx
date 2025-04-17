"use client";

import { useLoading } from "@/context/loadingContext";
import { RiskFinding } from "@/lib/riskAnalyzer";
import {
  OPENAI_LANGUAGES,
  SARVAM_LANGUAGES,
  TranslationVendor,
} from "@/lib/translation/types";
import {
  AlertOctagon,
  Save,
  ChevronDown
} from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import { AIPopup } from "./AIPopup";

interface DocumentPaneProps {
  content: string;
  onContentChange: (content: string) => void;
  fileName: string;
  onSave: () => Promise<void>;
  onSaveAs: () => Promise<void>;
  onAnalyzeRisks: () => Promise<void>;
}

export function DocumentPane({
  content,
  onContentChange,
  fileName,
  onSave,
  onSaveAs,
  onAnalyzeRisks,
}: DocumentPaneProps) {
  const [showAIPopup, setShowAIPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState("");
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveDropdownRef = useRef<HTMLDivElement>(null);
  const [highlightRange, setHighlightRange] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [risks, setRisks] = useState<RiskFinding[]>([]);
  const [rightTab, setRightTab] = useState<"templates" | "risks">("templates");
  const [translationVendor, setTranslationVendor] =
    useState<TranslationVendor>("openai");
  const [selectedLanguage, setSelectedLanguage] = useState("en-IN");
  const { isLoading, startLoading, stopLoading } = useLoading();
  const [showTranslateDropdown, setShowTranslateDropdown] = useState(false);
  const translationDropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside for save dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (saveDropdownRef.current && !saveDropdownRef.current.contains(event.target as Node)) {
        setShowSaveDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (translationDropdownRef.current && !translationDropdownRef.current.contains(event.target as Node)) {
        setShowTranslateDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Show popup on Ctrl+Space
    if (e.ctrlKey && e.code === "Space") {
      e.preventDefault();
      const textarea = textareaRef.current;
      const container = containerRef.current;
      if (textarea && container) {
        const { selectionStart, selectionEnd } = textarea;
        const selectedText = content.slice(selectionStart, selectionEnd);
        setSelectedText(selectedText);

        const containerRect = container.getBoundingClientRect();
        const textareaRect = textarea.getBoundingClientRect();

        // Get cursor position relative to textarea
        const cursorPos = getCaretCoordinates(textarea, selectionEnd);

        // Account for scroll position
        const scrollTop = textarea.scrollTop;

        // Calculate position relative to the container
        setPopupPosition({
          x: cursorPos.left - textareaRect.left + 20,
          y: cursorPos.top - textareaRect.top - scrollTop + 20,
        });
        setShowAIPopup(true);
      }
    }
  };

  const handleGeneratedText = (generatedText: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = start + generatedText.length;
      const newContent =
        content.slice(0, start) +
        generatedText +
        content.slice(textarea.selectionEnd);

      onContentChange(newContent);

      // Set highlight range
      setHighlightRange({ start, end });

      // Clear highlight after 5 seconds
      setTimeout(() => {
        setHighlightRange(null);
      }, 5000);

      // Set cursor position after inserted text
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = end;
      }, 0);
    }
  };

  const renderContent = () => {
    if (!highlightRange) return content;

    return (
      <>
        {content.slice(0, highlightRange.start)}
        <span className="highlight-new-text">
          {content.slice(highlightRange.start, highlightRange.end)}
        </span>
        {content.slice(highlightRange.end)}
      </>
    );
  };

  const handleRiskClick = (risk: RiskFinding) => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        risk.location.start,
        risk.location.end
      );
    }
  };

  const handleTranslate = async () => {
    try {
      startLoading("TRANSLATE_TEXT");
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor: translationVendor,
          sourceText: content,
          targetLanguage: selectedLanguage,
          mode: "formal",
        }),
      });

      if (!response.ok) throw new Error("Translation failed");
      const data = await response.json();
      onContentChange(data.translation);
    } catch (error) {
      console.error("Translation error:", error);
      alert("Failed to translate text");
    } finally {
      stopLoading("TRANSLATE_TEXT");
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#f9f9f9]">
      {/* Header */}
      <div className="p-4 bg-[#f9f9f9]">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800/80">
                {fileName || "New Document"}
              </h1>
              <p className="text-sm text-gray-500/80">
                Last edited: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex items-center gap-3">
            {/* Translation Controls */}
            <div className="flex items-center gap-2">
              <div className="relative" ref={translationDropdownRef}>
                <div className="flex">
                  <button
                    onClick={handleTranslate}
                    disabled={isLoading("TRANSLATE_TEXT")}
                    className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-l-lg
                             hover:bg-blue-100 transition-colors disabled:opacity-50
                             flex items-center gap-2 border-r border-blue-200"
                  >
                    <span>Translate</span>
                    {isLoading("TRANSLATE_TEXT") && (
                      <div className="animate-spin">⏳</div>
                    )}
                  </button>
                  <button
                    onClick={() => setShowTranslateDropdown(!showTranslateDropdown)}
                    className="px-2 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-r-lg
                             hover:bg-blue-100 transition-colors"
                    aria-label="Show translation options"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Translation Dropdown Menu */}
                {showTranslateDropdown && (
                  <div className="absolute left-0 mt-2 w-56 rounded-lg shadow-lg ring-1 ring-black 
                                ring-opacity-5 bg-white transform origin-top-left z-50">
                    <div className="py-1 divide-y divide-gray-100">
                      <div className="px-4 py-3 bg-gray-50 rounded-t-lg">
                        <p className="text-sm font-medium text-gray-900">Translation Options</p>
                        <p className="text-xs text-gray-500 mt-1">Choose translation settings</p>
                      </div>
                      
                      <div className="p-3">
                        <label className="text-xs font-medium text-gray-500 block mb-2">Translation Service</label>
                        <select
                          value={translationVendor}
                          onChange={(e) => setTranslationVendor(e.target.value as TranslationVendor)}
                          className="w-full px-2 py-1.5 text-sm border rounded-md bg-white text-gray-600/70
                                   focus:ring-1 focus:ring-blue-500 focus:border-blue-500 mb-3"
                        >
                          <option value="openai">OpenAI</option>
                          <option value="sarvam">Sarvam AI</option>
                        </select>

                        <label className="text-xs font-medium text-gray-500 block mb-2">Target Language</label>
                        <select
                          value={selectedLanguage}
                          onChange={(e) => setSelectedLanguage(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border rounded-md bg-white text-gray-600/70
                                   focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {translationVendor === "sarvam"
                            ? SARVAM_LANGUAGES.map((lang) => (
                                <option key={lang.code} value={lang.code}>
                                  {lang.name}
                                </option>
                              ))
                            : OPENAI_LANGUAGES.map((lang) => (
                                <option key={lang.value} value={lang.value}>
                                  {lang.label}
                                </option>
                              ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={onAnalyzeRisks}
                className="px-3 py-1.5 text-sm bg-amber-50 text-amber-600 rounded-lg
                         hover:bg-amber-100 transition-colors flex items-center gap-2"
              >
                <AlertOctagon className="w-4 h-4" />
                Analyze Risks
              </button>

              {/* Save Dropdown Button */}
              <div className="relative" ref={saveDropdownRef}>
                <div className="flex">
                  <button
                    onClick={onSave}
                    className="px-3 py-1.5 text-sm bg-green-50 text-green-600 rounded-l-lg
                             hover:bg-green-100 transition-colors flex items-center gap-2
                             border-r border-green-200"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => setShowSaveDropdown(!showSaveDropdown)}
                    className="px-2 py-1.5 text-sm bg-green-50 text-green-600 rounded-r-lg
                             hover:bg-green-100 transition-colors"
                    aria-label="Show save options"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Improved Dropdown Menu */}
                {showSaveDropdown && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg ring-1 ring-black 
                                ring-opacity-5 bg-white transform origin-top-right z-50">
                    <div className="py-1 divide-y divide-gray-100">
                      <div className="px-4 py-3 bg-gray-50 rounded-t-lg">
                        <p className="text-sm font-medium text-gray-900">Save Options</p>
                        <p className="text-xs text-gray-500 mt-1">Choose how to save your document</p>
                      </div>
                      
                      <div className="py-1">
                        <button
                          onClick={() => {
                            onSave();
                            setShowSaveDropdown(false);
                          }}
                          className="group flex w-full items-center px-4 py-2.5 text-sm text-gray-700
                                   hover:bg-green-50 hover:text-green-700 transition-colors"
                        >
                          <Save className="w-4 h-4 mr-3 text-gray-400 group-hover:text-green-500" />
                          <div className="flex flex-col items-start">
                            <span className="font-medium">Save</span>
                            <span className="text-xs text-gray-500">Save changes to current file</span>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => {
                            onSaveAs();
                            setShowSaveDropdown(false);
                          }}
                          className="group flex w-full items-center px-4 py-2.5 text-sm text-gray-700
                                   hover:bg-green-50 hover:text-green-700 transition-colors"
                        >
                          <Save className="w-4 h-4 mr-3 text-gray-400 group-hover:text-green-500" />
                          <div className="flex flex-col items-start">
                            <span className="font-medium">Save As...</span>
                            <span className="text-xs text-gray-500">Save as a new file</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative p-6 bg-white" ref={containerRef}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full h-full p-6 text-gray-800 bg-white rounded-lg 
                   border-2 border-gray-300 resize-none focus:outline-none focus:ring-2 
                   focus:ring-blue-500 focus:border-transparent"
          style={{ fontSize: '15px', lineHeight: '1.6' }}
        />
        {showAIPopup && (
          <AIPopup
            position={popupPosition}
            onClose={() => setShowAIPopup(false)}
            onGenerate={handleGeneratedText}
            currentContent={content}
            selectedText={selectedText}
            userId="1"
            documents={[]}
            files={[]}
          />
        )}
      </div>
    </div>
  );
}

// Helper function to get caret coordinates
function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
  const { offsetLeft, offsetTop } = element;
  const div = document.createElement("div");
  const styles = getComputedStyle(element);
  const safeProperties = [
    "fontFamily",
    "fontSize",
    "fontWeight",
    "wordWrap",
    "whiteSpace",
    "padding",
    "width",
    "lineHeight",
    "letterSpacing",
    "wordSpacing",
    "textTransform",
  ] as const;

  safeProperties.forEach((prop) => {
    if (styles[prop]) {
      div.style[prop] = styles[prop];
    }
  });

  div.textContent = element.value.slice(0, position);
  div.style.position = "absolute";
  div.style.visibility = "hidden";
  document.body.appendChild(div);

  const coordinates = {
    left: div.offsetWidth + offsetLeft,
    top: div.offsetHeight + offsetTop,
  };

  document.body.removeChild(div);
  return coordinates;
}
