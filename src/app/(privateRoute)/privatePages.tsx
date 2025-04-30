"use client";
import { Navigation } from "@/components/Navigation";
import { useRoleContext } from "@/context/roleContext";
import { useUserContext } from "@/context/userContext";
import useRoles from "@/hooks/api/useRoles";
import useUser from "@/hooks/api/useUser";
import { FC, ReactNode, useEffect } from "react";

const PrivatePages: FC<{
  children: ReactNode;
}> = ({ children }) => {
  const { setRole } = useRoleContext();
  const { roles: roleList } = useRoles();
  const { dispatchUser } = useUserContext();
  const { fetchUser } = useUser();

  useEffect(() => {
    (async () => {
      const userEmail = localStorage.getItem("userEmail") || "";
      if (!userEmail) return;

      const user = await fetchUser(userEmail);

      if (!user) return;
      dispatchUser({
        type: "FETCH_USER",
        payload: { user },
      });
    })();
  }, []);

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
