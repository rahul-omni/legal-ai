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
    userApiCall();
  }, []);

  const userApiCall = async () => {
    const userEmail = localStorage.getItem("userEmail") || "";
    if (!userEmail) return;

    const data = await fetchUser(userEmail);

    if (!data) return;

    if (!data) {
      dispatchUser({ type: "LOGOUT_USER" });
      return;
    }

    dispatchUser({
      type: "FETCH_USER",
      payload: { orgMemberships: data.orgMemberships, user: data.user },
    });
  };

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
