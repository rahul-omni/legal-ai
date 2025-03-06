import React from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"

export default function SuggestionsPane() {
  return (
    <div className="h-full bg-background flex flex-col">
      <div className="border-b p-4">
        <h2 className="font-semibold">Suggestions</h2>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Messages/Suggestions will go here */}
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm">How would you like to modify the agreement?</p>
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input 
            placeholder="Type your prompt here..." 
            className="flex-1"
          />
          <Button size="icon">
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
} 