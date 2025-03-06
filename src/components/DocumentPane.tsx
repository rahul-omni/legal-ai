import React from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"

export default function DocumentPane() {
  return (
    <div className="h-full bg-background border-r">
      <div className="border-b p-4">
        <h2 className="font-semibold">Agreement.docx</h2>
      </div>
      <ScrollArea className="h-[calc(100vh-57px)]">
        <div className="p-6 prose max-w-none">
          <h1>Service Agreement</h1>
          <p>This Agreement is made between...</p>
          {/* Add your document content here */}
        </div>
      </ScrollArea>
    </div>
  )
} 