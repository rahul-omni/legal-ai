import { useReducer } from "react";

// Define state type
export interface UIState {
  showLeftPanel: boolean;
  showSmartPrompts: boolean;
}

// Define action types
export type UIAction = 
  | { type: "TOGGLE_LEFT_PANEL" }
  | { type: "TOGGLE_SMART_PROMPTS" };

// Define reducer
function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case "TOGGLE_LEFT_PANEL":
      return { ...state, showLeftPanel: !state.showLeftPanel };
    case "TOGGLE_SMART_PROMPTS":
      return { ...state, showSmartPrompts: !state.showSmartPrompts };
    default:
      return state;
  }
}

// Custom hook
export function useUIState() {
  const [state, dispatch] = useReducer(uiReducer, {
    showLeftPanel: true,
    showSmartPrompts: false,
  });

  return { state, dispatch };
}
