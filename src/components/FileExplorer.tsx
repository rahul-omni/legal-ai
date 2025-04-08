'use client'

import { useState, useEffect } from 'react'
import { File, FolderOpen, Upload, Clock, Languages, List, Plus, Search } from 'lucide-react'
import { FileService, type FileData } from '@/lib/fileService'
import { useToast } from '@/components/ui/toast'

type FileItem = FileData

const INITIAL_FILES: FileItem[] = [
  {
    id: '1',
    name: 'Contracts',
    type: 'folder',
    content: '',
    lastModified: '2024-01-20',
    children: [
      {
        id: '2',
        name: 'Service Agreement.docx',
        type: 'file',
        content: 'This Service Agreement ("Agreement") is made between...',
        summary: 'IT consulting services agreement with confidentiality clauses',
        lastModified: '2024-01-20'
      },
      {
        id: '3',
        name: 'NDA.docx',
        type: 'file',
        content: 'This Non-Disclosure Agreement ("NDA") is entered into...',
        summary: 'Standard non-disclosure agreement',
        lastModified: '2024-01-19'
      }
    ]
  },
  {
    id: '4',
    name: 'Legal Forms',
    type: 'folder',
    content: '',
    lastModified: '2024-01-20',
    children: []
  }
];

interface FileExplorerProps {
  documents: FileData[];
  selectedDocument: FileData | null;
  onDocumentSelect: (file: FileData) => void;
}

export function FileExplorer({ 
  documents, 
  selectedDocument, 
  onDocumentSelect 
}: FileExplorerProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast()

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      const data = await response.json();
      if (response.ok) {
        setFiles(data);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('File selected for upload:', file.name);
    
    try {
      const content = await FileService.parseFile(file);
      console.log('File parsed successfully');
      
      const newFile: FileItem = {
        id: Date.now().toString(),
        name: file.name,
        type: 'file',
        content,
        lastModified: new Date().toISOString().split('T')[0],
      };

      // Save to database after parsing
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFile)
      });

      if (!response.ok) throw new Error('Failed to save document');
      
      await loadDocuments(); // Reload the file list
      showToast('File uploaded successfully');
      onDocumentSelect(newFile);
      e.target.value = '';
    } catch (error) {
      console.error('Failed to save document:', error);
      showToast('Failed to save document', 'error');
    }
  };

  return (
    <div className="h-full flex flex-col border-r border-border">
      {/* Header with search and actions */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search files..."
              className="w-full pl-8 pr-4 py-1 text-sm rounded-md border focus:border-primary focus:ring-1 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <label 
            htmlFor="file-upload"
            className="p-1.5 rounded-md bg-gray-900 text-white hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <Upload className="h-4 w-4" />
          </label>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".docx,.pdf,.txt"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto p-4">
        {files.length > 0 ? (
          <div className="space-y-1">
            {files.map((item) => (
              <FileItem 
                key={item.id} 
                item={item} 
                level={0}
                onSelect={onDocumentSelect}
                isSelected={selectedDocument?.id === item.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground text-sm py-4">
            No files yet. Click the upload button to add files.
          </div>
        )}
      </div>
    </div>
  );
}

// FileItem sub-component
function FileItem({ 
  item, 
  level, 
  onSelect, 
  isSelected 
}: { 
  item: FileItem; 
  level: number;
  onSelect: (file: FileItem) => void;
  isSelected: boolean;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div>
      <div 
        className={`
          flex items-center gap-2 p-1 rounded-md cursor-pointer
          ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'}
        `}
        style={{ paddingLeft: `${level * 16 + 4}px` }}
        onClick={() => {
          if (item.type === 'folder') {
            setIsOpen(!isOpen);
          } else {
            onSelect(item);
          }
        }}
      >
        {item.type === 'folder' ? (
          <FolderOpen className="h-4 w-4" />
        ) : (
          <File className="h-4 w-4" />
        )}
        <span className="text-sm">{item.name}</span>
      </div>
      {item.type === 'folder' && isOpen && item.children?.map((child) => (
        <FileItem 
          key={child.id}
          item={child}
          level={level + 1}
          onSelect={onSelect}
          isSelected={isSelected}
        />
      ))}
    </div>
  );
} 