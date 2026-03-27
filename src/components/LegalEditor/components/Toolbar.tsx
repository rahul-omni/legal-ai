import { MessageSquare, PanelLeft, PanelRightOpen } from "lucide-react";
import { useUIState } from "../reducersContexts/editorUiReducerContext";

export function Toolbar() {
  const { state, dispatch } = useUIState();


  return (
    <div className="flex gap-1 px-1 min-w-0 justify-end pr-6">
      <div className="flex gap-1 bg-transparent rounded p-1">
        <button
          type="button"
          onClick={() => dispatch({ type: "TOGGLE_LEFT_PANEL" })}
          className={`p-1.5 rounded ${
            state.showLeftPanel ? "bg-background-light shadow-sm" : "bg-transparent"
          } hover:bg-background-dark hover:shadow-sm transition-all`}
          title="File explorer"
          aria-pressed={state.showLeftPanel}
        >
          <PanelLeft className="w-4 h-4 text-text-dark" />
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "TOGGLE_AI_PANEL" })}
          className={`p-1.5 rounded ${
            state.showAIPanel ? "bg-background-light shadow-sm" : "bg-transparent"
          } hover:bg-background-dark hover:shadow-sm transition-all`}
          title="AI assistant"
          aria-pressed={state.showAIPanel}
        >
          <MessageSquare className="w-4 h-4 text-text-dark" />
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "TOGGLE_SMART_PROMPTS" })}
          className={`p-1.5 rounded ${
            state.showSmartPrompts ? "bg-background-light shadow-sm" : "bg-transparent"
          } hover:bg-background-dark hover:shadow-sm transition-all`}
          title="Smart prompts"
          aria-pressed={state.showSmartPrompts}
        >
          <PanelRightOpen className="w-4 h-4 text-text-dark" />
        </button>
      </div>
    </div>
  );
}
