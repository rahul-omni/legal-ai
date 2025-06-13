"use client"

import { FileSystemNodeProps } from '@/types/fileSystem';
import { FolderIcon, FileIcon, ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface TreeNodeProps {
  node: FileSystemNodeProps;
  onSelect: (_node: FileSystemNodeProps) => void;
}

export default function TreeNode({ node, onSelect }: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isFolder = node.type === 'FOLDER';

  const handleToggle = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    }
  };

  // const handleSelect = () => {
  //   if (!isFolder) {
  //     onSelect(node);
  //   } 
  //   else {
  //     handleToggle(); // Also toggle folder on click
  //   }
  // };
  const handleSelect = () => {
    if (isFolder) {
      return; // Skip selection for folders
    }
    onSelect(node);
  };
  return (
    <div className="ml-3">
      <div
        className="flex items-center py-0.5 px-1.5 rounded hover:bg-gray-100 cursor-pointer group"
        onClick={handleSelect}
      >
        {isFolder && (
          <button onClick={(e) => { e.stopPropagation(); handleToggle(); }} className="mr-0.5 p-0.5 rounded hover:bg-gray-200">
            {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />}
          </button>
        )}
        {isFolder ? (
          <FolderIcon className="w-3.5 h-3.5 mr-1.5 text-sky-500 flex-shrink-0" />
        ) : (
          <FileIcon className="w-3.5 h-3.5 mr-1.5 text-gray-400 flex-shrink-0" />
        )}
        <span className="text-xs text-gray-700 group-hover:text-gray-900 truncate">{node.name}</span>
      </div>
      {isFolder && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}