"use client";
import React, { createContext, ReactNode, useContext, useReducer } from "react";
import {
  UserActionType,
  UserStateProps,
  initialState,
  reducer,
} from "../reducer/userReducer";

interface UserContextProps {
  userState: UserStateProps;
  dispatchUser: React.Dispatch<UserActionType>;
}

export const contextMade = createContext<UserContextProps | undefined>(
  undefined
);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <contextMade.Provider value={{ userState: state, dispatchUser: dispatch }}>
      {children}
    </contextMade.Provider>
  );
};

export const userContext = () => {
  const context = useContext(contextMade);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};
