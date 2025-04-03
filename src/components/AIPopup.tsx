'use client'

import { useState } from 'react'
import { X, ArrowUpCircle } from 'lucide-react'
import { AIWaveform } from './AIWaveform'

interface AIPopupProps {
  position: { x: number; y: number }
  onClose: () => void
  onGenerate: (text: string) => void
  currentContent: string
  selectedText: string
}

export function AIPopup({ position, onClose, onGenerate, currentContent, selectedText }: AIPopupProps) {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    try {
      setIsLoading(true)
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentContent,
          prompt: selectedText ? 
            `Given this text: "${selectedText}", ${prompt}` :
            prompt
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      onGenerate(data.summary)
      onClose()
    } catch (error) {
      console.error('Generation error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="absolute z-50 bg-white rounded-lg shadow-xl w-72 p-[1px] overflow-hidden"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        background: 'linear-gradient(to right, #0EA5E9, #6366F1)',
        boxShadow: '0 0 20px rgba(99, 102, 241, 0.15)'
      }}
    >
      <div className="bg-white rounded-lg w-full h-full">
        <div className="p-2.5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <h3 className="text-sm font-medium bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent flex items-center gap-1.5">
            {selectedText ? 'Edit Selected Text' : (
              <>
                AI Assistant
                <AIWaveform />
              </>
            )}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-2.5 bg-white">
          {selectedText && (
            <div className="mb-2 text-sm text-gray-500 line-clamp-1">
              Selected: "{selectedText}"
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={selectedText ? "How should I modify this?" : "Type your request..."}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent bg-gray-50/50"
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="p-1.5 text-indigo-600 hover:text-indigo-700 disabled:opacity-50 transition-colors"
            >
              <ArrowUpCircle className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 