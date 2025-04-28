import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import 'react-quill/dist/quill.snow.css';
import "../styles/editor.css"
// Dynamic import to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-white animate-pulse" />
});

interface QuillEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  onSelectionChange?: (range: { index: number; length: number } | null) => void;
}

const modules = {
  toolbar: [
    // Headers
    [{ 'header': [1, 2, false] }],
    
    // Text styling
    ['bold', 'italic', 'underline'],
    
    // Lists and indentation
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    
    // Clean formatting
    ['clean']
  ],
  clipboard: {
    matchVisual: false
  }
};

const formats = [
  'header',
  'bold',
  'italic',
  'underline',
  'list',
  'bullet',
  'indent'
];

export function QuillEditor({ content, onContentChange, onSelectionChange }: QuillEditorProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="relative flex-1">
        {/* 3D Paper Effect Container */}
        <div className="absolute inset-0 bg-white shadow-paper transform-gpu perspective-1000 editor-container">
          <ReactQuill
            theme="snow"
            value={content}
            onChange={onContentChange}
            onChangeSelection={onSelectionChange}
            modules={modules}
            formats={formats}
            className="h-full"
            preserveWhitespace={true}
          />
        </div>
      </div>
    </div>
  );
} 