import { PanelLeft, PanelRightOpen } from "lucide-react";
import { useUIState } from "../reducersContexts/editorUiReducerContext";

export function Toolbar() {
  const { state, dispatch } = useUIState();

  return (
    <div className="absolute top-0 right-0 z-50 flex gap-1 px-1">
      <div className="flex gap-1 bg-[#f9f9f9] shadow-sm rounded p-1">
        <button
          onClick={() => dispatch({ type: "TOGGLE_LEFT_PANEL" })}
          className={`p-1.5 rounded ${
            state.showLeftPanel ? "bg-white shadow-sm" : "bg-transparent"
          } hover:bg-white hover:shadow-sm transition-all`}
        >
          <PanelLeft className="w-4 h-4 text-gray-600/80" />
        </button>
        <button
          onClick={() => dispatch({ type: "TOGGLE_SMART_PROMPTS" })}
          className={`p-1.5 rounded ${
            state.showSmartPrompts ? "bg-white shadow-sm" : "bg-transparent"
          } hover:bg-white hover:shadow-sm transition-all`}
        >
          <PanelRightOpen className="w-4 h-4 text-gray-600/80" />
        </button>
      </div>
    </div>
  );
}
