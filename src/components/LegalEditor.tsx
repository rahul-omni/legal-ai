import React from 'react'
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import FileExplorer from './FileExplorer'
import DocumentPane from './DocumentPane'
import SuggestionsPane from './SuggestionsPane'

export default function LegalEditor() {
  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal">
        {/* Left Panel - File Explorer */}
        <ResizablePanel defaultSize={20} minSize={15}>
          <FileExplorer />
        </ResizablePanel>

        {/* Middle Panel - Document Editor */}
        <ResizablePanel defaultSize={45}>
          <DocumentPane />
        </ResizablePanel>

        {/* Right Panel - Suggestions/Prompts */}
        <ResizablePanel defaultSize={35}>
          <SuggestionsPane />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
} 