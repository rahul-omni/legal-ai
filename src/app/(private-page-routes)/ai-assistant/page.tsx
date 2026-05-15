"use client";

import { LegalAssistantChat } from "@/components/ai-assistant/LegalAssistantChat";

export default function AiAssistantPage() {
  return (
    <main className="flex-1 min-h-0 flex flex-col h-full">
      <LegalAssistantChat />
    </main>
  );
}
