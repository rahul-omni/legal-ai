
"use client";
import { createContext, FC, ReactNode, useContext, useState } from "react";

// Add the new loading states to the default loading state
const defaultLoadingState = {
  RISK_ANALYZE: false,
  TRANSLATE_TEXT: false,
  LOGGING_IN: false,
  SENDING_OTP: false,
  VERIFYING_OTP: false,
};

type LoadingType = keyof typeof defaultLoadingState;

const LoadingContext = createContext<{
  startLoading: (key: LoadingType) => void;
  stopLoading: (key: LoadingType) => void;
  isLoading: (key: LoadingType) => boolean;
  loadingState: Record<LoadingType, boolean>;
}>(null!);

export const LoadingProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [loadingState, setLoadingMap] =
    useState<Record<LoadingType, boolean>>(defaultLoadingState);

  const value = {
    loadingState,
    startLoading: (key: LoadingType) =>
      setLoadingMap((prev) => ({ ...prev, [key]: true })),
    stopLoading: (key: LoadingType) =>
      setLoadingMap((prev) => ({ ...prev, [key]: false })),
    isLoading: (key: LoadingType) => !!loadingState[key],
  };

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
};

// Custom hook
export function useLoadingContext() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error(
      "useLoadingContext must be used within a LoadingProvider"
    );
  }
  return context;
}