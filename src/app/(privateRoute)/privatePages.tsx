"use client";
import { Navigation } from "@/components/Navigation";
import { useRoleContext } from "@/context/roleContext";
import useRoles from "@/hooks/api/useRoles";
import { FC, ReactNode, useEffect } from "react";

const PrivatePages: FC<{
  children: ReactNode;
}> = ({ children }) => {
  const { setRole } = useRoleContext();
  const { roles: roleList } = useRoles();

  useEffect(() => {
    setRole(roleList || []);
  }, [roleList]);

  return (
    <div className="flex">
      <Navigation />
      <div className="flex-1">{children}</div>
    </div>
  );
};

export default PrivatePages;
