import { useUIState } from "./LegalEditor/reducersContexts/editorUiReducerContext";
import { SmartPrompts } from "./SmartPrompts";

export function SmartPromptsPanel() {
  const { state: uiState } = useUIState();
  return (
    <div
      className={`${
        uiState.showSmartPrompts ? "w-80" : "w-0"
      } transition-all duration-200`}
    >
      <div
        className={`h-full overflow-hidden ${
          !uiState.showSmartPrompts && "invisible"
        }`}
      >
        <div className="h-full bg-background-dark">
          <div className="py-3 px-4 bg-background-dark shadow-sm">
            <h2 className="font-medium text-gray-900">Smart Prompts</h2>
          </div>
          <SmartPrompts />
        </div>
      </div>
    </div>
  );
}
