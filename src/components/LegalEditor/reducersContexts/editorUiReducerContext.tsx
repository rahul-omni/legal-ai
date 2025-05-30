import { createContext, useContext, useReducer, ReactNode } from "react";

// Define state type
export interface UIState {
  showLeftPanel: boolean;
  showSmartPrompts: boolean;
}

// Define action types - renamed to match handler functions
type UIAction =
  | { type: "TOGGLE_LEFT_PANEL" }
  | { type: "TOGGLE_SMART_PROMPTS" }

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

// Create context with handlers
interface UIContextType {
  state: UIState;
  dispatch: React.Dispatch<UIAction>;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

// Provider component
export function UIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(uiReducer, {
    showLeftPanel: true,
    showSmartPrompts: false,
  });

  return (
    <UIContext.Provider
      value={{
        state,
        dispatch,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

// Custom hook
export function useUIState() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUIState must be used within a UIProvider");
  }
  return context;
}
