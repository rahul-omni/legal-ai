"use client"

import { FileSystemNode } from "@/types/fileSystem";
import { FileIcon, FolderIcon } from "lucide-react";
import { useState } from "react";

interface TreeNodeProps {
    node: FileSystemNode;
    onSelect: (node: FileSystemNode) => void;
  }
  
  const TreeNode: React.FC<TreeNodeProps> = ({ node, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
  
    const handleToggle = () => {
      if (node.type === "FOLDER") {
        setIsOpen(!isOpen);
      } else {
        onSelect(node); // When a file is selected
      }
    };
  
    return (
      <div className="ml-2">
        <div
          className="cursor-pointer flex items-center gap-2"
          onClick={handleToggle}
        >
          {node.type === "FOLDER" ? <FolderIcon size={16} /> : <FileIcon size={16} />}
          <span>{node.name}</span>
        </div>
        {isOpen && node.children && (
          <div className="ml-4">
            {node.children.map((child) => (
              <TreeNode key={child.id} node={child} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    );
  };
  

export default TreeNode;