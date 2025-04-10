'use client'

import { useState } from 'react'
//import { X, ArrowUpCircle } from 'lucide-react'
import { AIWaveform } from './AIWaveform'
import { X, ArrowUpCircle, FilePlus } from 'lucide-react'
// add this import
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import mammoth from 'mammoth';

const extractTextFromDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;

interface AIPopupProps {
  position: { x: number; y: number }
  onClose: () => void
  onGenerate: (text: string) => void
  currentContent: string
  selectedText: string
}
const MAX_TOKENS = 16000;


export const estimateTokenCount = (text: string): number => {
  const words = text.trim().split(/\s+/).length;
  const chars = text.length;
  const tokens = Math.round(words + chars / 4);
  return tokens;
};


export function AIPopup({ position, onClose, onGenerate, currentContent, selectedText }: AIPopupProps) {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [error, setError] = useState('');


 
  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;

   
    let fullText = '';
  
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((item: any) => item.str).join(' ');
      fullText += `\n\nPage ${i}:\n${text}`;
    }
  
    return fullText;
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    
    
    const files = e.target.files
    if (files) {
      setUploadedFiles((prev) => [...prev, ...Array.from(files)])
    }
  }
  console.log("uploadfile",uploadedFiles)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); // reset previous error

    if (!prompt.trim()) return

    try {
      setIsLoading(true)
      let fileText = '';

      if (uploadedFiles.length > 0) {
        // const fileReadPromises = uploadedFiles.map((file) =>
        //   file.type === "application/pdf"
        //     ? extractTextFromPDF(file)
        //     : file.text() // fallback for .txt or other formats
        // );
        const fileReadPromises = uploadedFiles.map((file) => {
          if (file.type === "application/pdf") {
            return extractTextFromPDF(file);
          } else if (file.name.endsWith(".docx")) {
            return extractTextFromDocx(file);
          } else {
            return file.text(); // fallback
          }
        });
        const fileContents = await Promise.all(fileReadPromises);
        fileText = fileContents.join('\n\n');
      }
      const finalPrompt = selectedText ? 
      `Given this text: "${selectedText}", ${prompt}` :prompt;

      const fullText = `${currentContent}\n\n${fileText}`;
      const totalTokens = estimateTokenCount(fullText + finalPrompt);
  
      if (totalTokens > MAX_TOKENS) {
        setError(`Input too long (${totalTokens} tokens). Please reduce the text or file size.`);
        setIsLoading(false);
        console.log("Token limit exceeded. Not calling API.");
        return;
      }
      
      console.log("Calling API...");
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: fullText,// currentContent,
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
      setError('Something went wrong during generation.');
    } finally {
      setIsLoading(false)
    }
  }
  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };
  
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
                AI Assistantw
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

               {/* File upload icon */}
             <label className="cursor-pointer text-gray-500 hover:text-indigo-600">
              <FilePlus className="w-5 h-5" />
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </label> 
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
          {error && (
  <p className="text-red-500 text-sm mt-2 px-2">{error}</p>
)}

            {/* Show uploaded files */}
            {/* {uploadedFiles.length > 0 && (
            <div className="mt-1 max-h-20 overflow-y-auto text-xs text-gray-600 space-y-1">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="truncate">{file.name}</div>
              ))}
            </div>
          )} */}

{uploadedFiles.map((file, idx) => (
  <div
    key={idx}
    className="flex items-center justify-between bg-gray-100 px-2 py-1 rounded text-xs text-gray-700"
  >
    <span className="truncate max-w-[160px]">{file.name}</span>
    <button onClick={() => handleRemoveFile(idx)} className="text-red-500 hover:text-red-700">
      ❌
    </button>
  </div>
))}

        </form>
      </div>
    </div>
  )
} 