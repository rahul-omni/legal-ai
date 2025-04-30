"use client";
import { Role } from "@prisma/client";
import { createContext, FC, ReactNode, useContext, useState } from "react";

interface RoleContextType {
  getAllRoles: () => Role[];
  setRole: (roles: Role[]) => void;
}

const RoleContext = createContext<RoleContextType>(null!);

export const RoleProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [roles, setRoles] = useState<Role[]>([]);

  const value = {
    getAllRoles: () => [...roles],
    setRole: (roles: Role[]) => setRoles(roles),
  };

  return (
    <RoleContext.Provider value={{ ...value }}>{children}</RoleContext.Provider>
  );
};

// Custom hook
export function useRoleContext() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRoleContext must be used within a RoleProvider");
  }
  return context;
}
