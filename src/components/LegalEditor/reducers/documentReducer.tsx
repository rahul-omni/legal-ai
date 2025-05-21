import { useReducer } from "react";
import { RiskFinding } from "@/lib/riskAnalyzer";

// Language options type definition
export type LanguageOption = {
  label: string;
  value: string;
};

// Language options
export const indianLanguages: LanguageOption[] = [
  { label: "English", value: "English" },
  { label: "Hindi", value: "Hindi" },
  { label: "Tamil", value: "Tamil" },
  { label: "Telugu", value: "Telugu" },
  { label: "Bengali", value: "Bengali" },
  { label: "Marathi", value: "Marathi" },
  { label: "Gujarati", value: "Gujarati" },
  { label: "Kannada", value: "Kannada" },
  { label: "Malayalam", value: "Malayalam" },
];

// Define state type
export interface DocumentState {
  content: string;
  selectedLanguage: string;
  risks: RiskFinding[];
}

// Define action types
export type DocumentAction =
  | { type: "SET_CONTENT"; payload: string }
  | { type: "SET_LANGUAGE"; payload: string }
  | { type: "SET_RISKS"; payload: RiskFinding[] };

// Define reducer
function documentReducer(
  state: DocumentState,
  action: DocumentAction
): DocumentState {
  switch (action.type) {
    case "SET_CONTENT":
      return { ...state, content: action.payload };
    case "SET_LANGUAGE":
      return { ...state, selectedLanguage: action.payload };
    case "SET_RISKS":
      return { ...state, risks: action.payload };
    default:
      return state;
  }
}

// Custom hook
export function useDocumentState() {
  const [state, dispatch] = useReducer(documentReducer, {
    content: "This Agreement is made between...",
    selectedLanguage: indianLanguages[0].value,
    risks: [],
  });

  return { state, dispatch };
}
