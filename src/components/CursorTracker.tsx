import { useEffect, useRef, useState } from 'react';

interface CursorPosition {
  line: number;
  column: number;
  coords?: { left: number; top: number };
}

interface CursorTrackerProps {
  content: string;
  onContentChange: (content: string) => void;
  onCursorChange: (position: CursorPosition | undefined) => void;
  onSelectionChange: (text: string) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}

export function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
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

  const textBeforeCursor = element.value.slice(0, position);
  const textNode = document.createTextNode(textBeforeCursor);
  const span = document.createElement('span');
  span.appendChild(textNode);
  mirror.appendChild(span);
  
  document.body.appendChild(mirror);
  
  const rect = element.getBoundingClientRect();
  const spanRect = span.getBoundingClientRect();
  
  const coordinates = {
    top: spanRect.height + rect.top - element.scrollTop,
    left: spanRect.width + rect.left - element.scrollLeft
  };

  document.body.removeChild(mirror);
  return coordinates;
}

export function CursorTracker({ 
  content, 
  onContentChange,
  onCursorChange, 
  onSelectionChange,
  textareaRef: externalRef
}: CursorTrackerProps) {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalRef || internalRef;

  const calculateCursorPosition = (textarea: HTMLTextAreaElement) => {
    const cursorIndex = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorIndex);
    const lines = textBeforeCursor.split('\n');
    const line = lines.length;
    const currentLine = lines[lines.length - 1] || '';
    
    let column = 1;
    for (let i = 0; i < currentLine.length; i++) {
      if (currentLine[i] === '\t') {
        column += 4 - (column - 1) % 4;
      } else {
        column++;
      }
    }

    const coords = getCaretCoordinates(textarea, cursorIndex);
    return { line, column, coords };
  };

  const handleCursorChange = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start !== end) {
      const selectedText = textarea.value.substring(start, end);
      onSelectionChange(selectedText);
      onCursorChange(undefined);
    } else {
      onSelectionChange('');
      const position = calculateCursorPosition(textarea);
      onCursorChange(position);
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={content}
      onChange={(e) => {
        onContentChange(e.target.value);
        handleCursorChange();
      }}
      onSelect={handleCursorChange}
      onMouseUp={handleCursorChange}
      onClick={handleCursorChange}
      onKeyUp={handleCursorChange}
      className="w-full h-full py-6 px-10 text-gray-800 bg-white rounded-lg
                border-2 border-gray-300 resize-none focus:outline-none focus:ring-2
                focus:ring-blue-500 focus:border-transparent"
      style={{ fontSize: '15px', lineHeight: '1.6' }}
    />
  );
} 