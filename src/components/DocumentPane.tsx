'use client'

import React, { useState, useRef } from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Save, SaveAll, AlertOctagon, FileText } from 'lucide-react'
import { AIPopup } from './AIPopup'
import { RiskAnalyzer, RiskFinding } from '@/lib/riskAnalyzer'
import { RiskHighlighter } from './RiskHighlighter'
import { LegalTemplates } from './LegalTemplates'
import { 
  TranslationVendor, 
  SARVAM_LANGUAGES, 
  OPENAI_LANGUAGES 
} from '@/lib/translation/types'

interface DocumentPaneProps {
  content: string;
  onContentChange: (content: string) => void;
  fileName: string;
  onSave: () => Promise<void>;
  onSaveAs: () => Promise<void>;
  onAnalyzeRisks: () => Promise<void>;
  isAnalyzing: boolean;
}

export function DocumentPane({ content, onContentChange, fileName, onSave, onSaveAs, onAnalyzeRisks, isAnalyzing }: DocumentPaneProps) {
  const [showAIPopup, setShowAIPopup] = useState(false)
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })
  const [selectedText, setSelectedText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [highlightRange, setHighlightRange] = useState<{ start: number; end: number } | null>(null)
  const [risks, setRisks] = useState<RiskFinding[]>([])
  const [rightTab, setRightTab] = useState<'templates' | 'risks'>('templates')
  const [translationVendor, setTranslationVendor] = useState<TranslationVendor>('openai')
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN')
  const [isLoading, setIsLoading] = useState(false)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Show popup on Ctrl+Space
    if (e.ctrlKey && e.code === 'Space') {
      e.preventDefault()
      const textarea = textareaRef.current
      const container = containerRef.current
      if (textarea && container) {
        const { selectionStart, selectionEnd } = textarea
        const selectedText = content.slice(selectionStart, selectionEnd)
        setSelectedText(selectedText)

        const containerRect = container.getBoundingClientRect()
        const textareaRect = textarea.getBoundingClientRect()
        
        // Get cursor position relative to textarea
        const cursorPos = getCaretCoordinates(textarea, selectionEnd)
        
        // Account for scroll position
        const scrollTop = textarea.scrollTop
        
        // Calculate position relative to the container
        setPopupPosition({
          x: cursorPos.left - textareaRect.left + 20,
          y: cursorPos.top - textareaRect.top - scrollTop + 20
        })
        setShowAIPopup(true)
      }
    }
  }

  const handleGeneratedText = (generatedText: string) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = start + generatedText.length
      const newContent = 
        content.slice(0, start) + 
        generatedText + 
        content.slice(textarea.selectionEnd)
      
      onContentChange(newContent)
      
      // Set highlight range
      setHighlightRange({ start, end })
      
      // Clear highlight after 5 seconds
      setTimeout(() => {
        setHighlightRange(null)
      }, 5000)
      
      // Set cursor position after inserted text
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = end
      }, 0)
    }
  }

  const renderContent = () => {
    if (!highlightRange) return content

    return (
      <>
        {content.slice(0, highlightRange.start)}
        <span className="highlight-new-text">
          {content.slice(highlightRange.start, highlightRange.end)}
        </span>
        {content.slice(highlightRange.end)}
      </>
    )
  }

  const analyzeRisks = async () => {
    try {
      setIsAnalyzing(true)
      const findings = await RiskAnalyzer.analyzeContract(content)
      setRisks(findings)
    } catch (error) {
      console.error('Risk analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleRiskClick = (risk: RiskFinding) => {
    if (textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(risk.location.start, risk.location.end)
    }
  }

  const handleTranslate = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor: translationVendor,
          sourceText: content,
          targetLanguage: selectedLanguage,
          mode: 'formal'
        })
      })

      if (!response.ok) throw new Error('Translation failed')
      const data = await response.json()
      onContentChange(data.translation)
    } catch (error) {
      console.error('Translation error:', error)
      alert('Failed to translate text')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-medium">{fileName}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={analyzeRisks}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded inline-flex items-center gap-2 hover:bg-gray-50"
            disabled={isAnalyzing}
          >
            <AlertOctagon className="w-4 h-4" />
            {isAnalyzing ? 'Analyzing...' : 'Analyze Risks'}
          </button>
          <button
            onClick={onSave}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded inline-flex items-center gap-2 hover:bg-gray-50"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={onSaveAs}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded inline-flex items-center gap-2 hover:bg-gray-50"
          >
            <SaveAll className="w-4 h-4" />
            Save As
          </button>
          <select
            value={translationVendor}
            onChange={(e) => setTranslationVendor(e.target.value as TranslationVendor)}
            className="px-2 py-1 border rounded text-sm"
          >
            <option value="openai">OpenAI</option>
            <option value="sarvam">Sarvam AI</option>
          </select>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-2 py-1 border rounded text-sm"
          >
            {translationVendor === 'sarvam' 
              ? SARVAM_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))
              : OPENAI_LANGUAGES.map(lang => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))
            }
          </select>
          <button onClick={handleTranslate} disabled={isLoading}>
            {isLoading ? 'Translating...' : 'Translate'}
          </button>
        </div>
      </div>
      <div className="flex-1 relative" ref={containerRef}>
        {highlightRange ? (
          <div 
            className="w-full h-full p-4 border rounded"
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {renderContent()}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-full p-4 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
        )}
        {showAIPopup && (
          <AIPopup
            position={popupPosition}
            onClose={() => setShowAIPopup(false)}
            onGenerate={handleGeneratedText}
            currentContent={content}
            selectedText={selectedText}
          />
        )}
      </div>
    </div>
  )
}

// Helper function to get caret coordinates
function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
  const { offsetLeft, offsetTop } = element
  const div = document.createElement('div')
  const styles = getComputedStyle(element)
  const properties = [
    'fontFamily',
    'fontSize',
    'fontWeight',
    'wordWrap',
    'whiteSpace',
    'padding',
    'width',
    'lineHeight',
    'letterSpacing',  // Add these for more accurate positioning
    'wordSpacing',
    'textTransform'
  ]

  properties.forEach(prop => {
    div.style[prop as any] = styles[prop]
  })

  div.textContent = element.value.slice(0, position)
  div.style.position = 'absolute'
  div.style.visibility = 'hidden'
  document.body.appendChild(div)

  const coordinates = {
    left: div.offsetWidth + offsetLeft,
    top: div.offsetHeight + offsetTop
  }

  document.body.removeChild(div)
  return coordinates
} 