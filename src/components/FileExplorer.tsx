import React from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Folder, File, ChevronRight, ChevronDown } from "lucide-react"

interface FileTreeItemProps {
  name: string;
  type: 'file' | 'folder';
  expanded?: boolean;
  children?: React.ReactNode;
}

export default function FileExplorer() {
  return (
    <div className="h-full bg-background border-r">
      <div className="p-4 font-semibold text-sm">Files</div>
      <ScrollArea className="h-[calc(100vh-40px)]">
        <div className="p-2">
          <FileTree />
        </div>
      </ScrollArea>
    </div>
  )
}

const FileTree = () => {
  return (
    <div className="space-y-1">
      <FileTreeItem name="Contracts" type="folder" expanded>
        <FileTreeItem name="Agreement.docx" type="file" />
        <FileTreeItem name="NDA.docx" type="file" />
      </FileTreeItem>
      <FileTreeItem name="Legal Forms" type="folder">
        <FileTreeItem name="Template.docx" type="file" />
      </FileTreeItem>
    </div>
  )
}

const FileTreeItem = ({ name, type, expanded, children }: FileTreeItemProps) => {
  const [isExpanded, setIsExpanded] = React.useState(expanded)

  return (
    <div>
      <div 
        className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-accent rounded-md cursor-pointer"
        onClick={() => type === 'folder' && setIsExpanded(!isExpanded)}
      >
        {type === 'folder' && (
          isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
        )}
        {type === 'folder' ? <Folder size={16} /> : <File size={16} />}
        <span>{name}</span>
      </div>
      {type === 'folder' && isExpanded && (
        <div className="ml-6 mt-1">{children}</div>
      )}
    </div>
  )
} 