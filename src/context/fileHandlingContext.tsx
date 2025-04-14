"use client"
import React, { createContext, ReactNode, useContext, useReducer } from "react";
import {
  ActionType,
  FileHandlingStateProps,
  initialState,
  reducer,
} from "../reducer/fileHandlingReducer";

interface FileHandlingContextProps {
  fileHandlingState: FileHandlingStateProps;
  fileHandlingDispacth: React.Dispatch<ActionType>;
}

export const contextMade = createContext<FileHandlingContextProps | undefined>(
  undefined
);

interface FileHandlingProviderProps {
  children: ReactNode;
}

export const FileHandlingProvider: React.FC<FileHandlingProviderProps> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <contextMade.Provider
      value={{ fileHandlingState: state, fileHandlingDispacth: dispatch }}
    >
      {children}
    </contextMade.Provider>
  );
};

export const fileHandlingContext = () => {
  const context = useContext(contextMade);
  if (!context) {
    throw new Error(
      "useFileHandling must be used within a FileHandlingProvider"
    );
  }
  return context;
};
