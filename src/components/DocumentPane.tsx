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
import { CursorTracker } from "./CursorTracker";
import { SaveDropdown } from "./SaveDropdown";
import { TranslationDropdown } from "./TranslationDropdown";
import { SmartPrompts } from "./SmartPrompts";

interface DocumentPaneProps {
  content: string;
  onContentChange: (content: string) => void;
  fileName: string;
  onSave: () => Promise<void>;
  onSaveAs: () => Promise<void>;
  // userId: string;
  // documents: any[];
  // files: any[];
}

// Add this interface to track generation state
interface GenerationState {
  isGenerating: boolean;
  insertPosition?: {
    line: number;
    column: number;
    coords: { left: number; top: number };
  };
}

export function DocumentPane({
  content,
  onContentChange,
  fileName,
  onSave,
  onSaveAs,
  // userId,
  // documents,
  // files,
}: DocumentPaneProps) {
  const [showAIPopup, setShowAIPopup] = useState(true);
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
  const [rightTab, setRightTab] = useState<"prompts" | "risks">("prompts");
  const [translationVendor, setTranslationVendor] =
    useState<TranslationVendor>("openai");
  const [selectedLanguage, setSelectedLanguage] = useState("en-IN");
  const { isLoading, startLoading, stopLoading } = useLoading();
  const [showTranslateDropdown, setShowTranslateDropdown] = useState(false);
  const translationDropdownRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState<{
    line: number;
    column: number;
    coords?: { left: number; top: number };
  }>();
  const [cursorIndicatorPosition, setCursorIndicatorPosition] = useState<{
    line: number;
    column: number;
    coords: { left: number; top: number };
  } | null>(null);
  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false
  });

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

  const calculateCursorPosition = (textarea: HTMLTextAreaElement) => {
    const cursorIndex = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorIndex);
    
    // Split into lines and count up to cursor
    const lines = textBeforeCursor.split('\n');
    
    // Line number (1-based)
    const line = lines.length;
    
    // Get the current line's content
    const currentLine = lines[lines.length - 1] || '';
    
    // Debug logging
    console.log("Cursor position details:", {
      cursorIndex,
      totalLines: lines.length,
      currentLine,
      allLines: lines.map((l, i) => `Line ${i + 1}: "${l}"`)
    });
    
    // Calculate visual column position (1-based)
    let column = 1;
    for (let i = 0; i < currentLine.length; i++) {
      if (currentLine[i] === '\t') {
        column += 4 - (column - 1) % 4;
      } else {
        column++;
      }
    }

    return { line, column };
  };

  const updateCursorIndicator = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const position = calculateCursorPosition(textarea);
    const coordinates = getCaretCoordinates(textarea, textarea.selectionStart);
    
    setCursorIndicatorPosition({
      ...position,
      coords: coordinates
    });
  };

  // Add this to handle scroll events
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleScroll = () => {
      if (!selectedText) {
        updateCursorIndicator();
      }
    };

    textarea.addEventListener('scroll', handleScroll);
    return () => textarea.removeEventListener('scroll', handleScroll);
  }, [selectedText]);

  // Update cursor indicator when cursor position changes
  const handleCursorChange = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      if (start !== end) {
        const currentSelection = textarea.value.substring(start, end);
        setSelectedText(currentSelection);
        setCursorIndicatorPosition(null);
      } else {
        setSelectedText("");
        const position = calculateCursorPosition(textarea);
        const coords = getCaretCoordinates(textarea, start);
        
        setCursorIndicatorPosition({
          ...position,
          coords: coords
        });
      }
      
      const position = calculateCursorPosition(textarea);
      setCursorPosition(position);
    }
  };

  const handleTranslate = async (vendor: TranslationVendor, language: string) => {
    try {
      startLoading("TRANSLATE_TEXT");
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor,
          sourceText: content,
          targetLanguage: language,
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

  const handleGeneratedText = async (prompt: string) => {
    try {
      setGenerationState({
        isGenerating: true,
        insertPosition: cursorIndicatorPosition || undefined
      });

      const textarea = textareaRef.current;
      if (!textarea) return;

      const insertAt = textarea.selectionStart;
      let accumulatedText = '';

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Decode and accumulate the chunk
        const chunk = decoder.decode(value);
        accumulatedText += chunk;

        // Update content with accumulated text
        const newContent = content.slice(0, insertAt) + accumulatedText + content.slice(insertAt);
      onContentChange(newContent);

        // Keep cursor at end of inserted text
        const newPosition = insertAt + accumulatedText.length;
        textarea.selectionStart = textarea.selectionEnd = newPosition;
        textarea.focus();
      }

    } catch (error) {
      console.error('Error generating text:', error);
    } finally {
      setGenerationState({ isGenerating: false });
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

  return (
    <div className="h-full flex">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col bg-[#f9f9f9]">
        {/* Header */}
        <div className="p-4 bg-[#f9f9f9]">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-800/80">
              {fileName || "New Document"}
            </h1>

        <div className="flex items-center gap-2">
              <TranslationDropdown 
                onTranslate={handleTranslate}
                isLoading={isLoading("TRANSLATE_TEXT")}
              />
              <SaveDropdown onSave={onSave} onSaveAs={onSaveAs} />
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 relative p-6 bg-white" ref={containerRef}>
          <CursorTracker
            content={content}
            onContentChange={onContentChange}
            onCursorChange={setCursorPosition}
            onSelectionChange={setSelectedText}
            textareaRef={textareaRef}
          />

          {showAIPopup && (
            <AIPopup
              onGenerate={handleGeneratedText}
              currentContent={content}
              selectedText={selectedText}
              cursorPosition={cursorPosition}
              cursorIndicatorPosition={cursorIndicatorPosition}
              userId="1"
              documents={[]}
              files={[]}
            />
          )}

          {generationState.isGenerating && cursorIndicatorPosition && (
            <div 
              className="pointer-events-none absolute z-50"
              style={{
                top: `${cursorIndicatorPosition.coords.top - 8}px`,
                left: `${cursorIndicatorPosition.coords.left}px`,
              }}
            >
              <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full shadow-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse [animation-delay:150ms]" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse [animation-delay:300ms]" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-80 border-l border-gray-200 bg-white">
        <div className="flex border-b">
          <button
            onClick={() => setRightTab("prompts")}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              rightTab === "prompts"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Smart Prompts
          </button>
          <button
            onClick={() => setRightTab("risks")}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              rightTab === "risks"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Risks
          </button>
        </div>

        {rightTab === "prompts" && (
          <SmartPrompts />
        )}
        {rightTab === "risks" && (
          <div className="p-4">
            {/* Existing risks content */}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to get caret coordinates
function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
  // Create a mirror div with exact same content and styling
  const mirror = document.createElement('div');
  mirror.style.cssText = `
    position: absolute;
    visibility: hidden;
    white-space: pre-wrap;
    word-wrap: break-word;
    box-sizing: border-box;
    width: ${element.offsetWidth}px;
    font: ${getComputedStyle(element).font};
    line-height: ${getComputedStyle(element).lineHeight};
    padding: ${getComputedStyle(element).padding};
  `;

  // Add text content up to cursor position
  const textBeforeCursor = element.value.slice(0, position);
  const textNode = document.createTextNode(textBeforeCursor);
  const span = document.createElement('span');
  span.appendChild(textNode);
  mirror.appendChild(span);
  
  // Add to DOM temporarily for measurement
  document.body.appendChild(mirror);
  
  // Get exact coordinates
  const rect = element.getBoundingClientRect();
  const spanRect = span.getBoundingClientRect();

  const coordinates = {
    top: spanRect.height + rect.top - element.scrollTop,
    left: spanRect.width + rect.left - element.scrollLeft
  };

  document.body.removeChild(mirror);
  return coordinates;
}
