import { SmartPrompts } from './SmartPrompts';

export function SmartPromptsPanel() {
  return (
    <div className="h-full bg-gray-50">
      <div className="py-3 px-4 bg-white shadow-sm">
        <h2 className="font-medium text-gray-900">Smart Prompts</h2>
      </div>
      <SmartPrompts />
    </div>
  );
} 