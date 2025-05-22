"use client";

import { useState } from "react";

interface AIAssistantProps {
  currentContent: string;
  onUpdateDocument: (content: string) => void;
}

interface PromptSuggestion {
  id: string;
  text: string;
  prompt: string;
}

const PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  {
    id: "chronology",
    text: "Create chronology of events in table format",
    prompt:
      "Create a detailed chronology of events from this case document in a table format with columns for Date, Event, and Significance. Make it comprehensive and well-organized.",
  },
  {
    id: "confidentiality",
    text: "Create a confidentiality clause",
    prompt: "Add a confidentiality clause",
  },
  {
    id: "payment",
    text: "Add a payment terms section",
    prompt: "Add a payment terms section",
  },
  {
    id: "liability",
    text: "Make the liability section more strict",
    prompt: "Make the liability section more strict",
  },
  {
    id: "force-majeure",
    text: "Add a force majeure clause",
    prompt: "Add a force majeure clause",
  },
];

export function AIAssistant({
  currentContent,
  onUpdateDocument,
}: AIAssistantProps) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    try {
      setIsLoading(true);
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: currentContent,
          prompt: prompt,
        }),
      });
      debugger;
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to process request");
      }

      onUpdateDocument(data.summary);
      setPrompt("");
    } catch (error) {
      console.error("AI Assistant error:", error);
      alert(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border border-gray-200">
      <div className="p-3 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">AI Assistant</h3>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <p className="text-sm text-gray-500 mb-4">Common actions:</p>
        <div className="space-y-2 mb-4">
          {PROMPT_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => setPrompt(suggestion.prompt)}
              className="w-full text-left p-2 text-sm rounded border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              {suggestion.text}
            </button>
          ))}
        </div>
      </div>
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your request..."
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-900"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Processing..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
