"use client";
import { Navigation } from "@/components/Navigation";
import { useRoleContext } from "@/context/roleContext";
import { useUserContext } from "@/context/userContext";
import useRoles from "@/hooks/api/useRoles";
import { useSession } from "next-auth/react";
import { FC, ReactNode, useEffect } from "react";

const PrivatePages: FC<{
  children: ReactNode;
}> = ({ children }) => {
  const { setRole } = useRoleContext();
  const { roles: roleList } = useRoles();
  const { dispatchUser } = useUserContext();

  const session = useSession();

  console.log(session, "session in private pages");

  useEffect(() => {
    if (!session.data?.user) return;
    const { memberships, ...user } = session.data.user;
    dispatchUser({
      type: "FETCH_USER",
      payload: {
        orgMemberships: session.data.user.memberships,
        user: session.data.user,
      },
    });
  }, [session]);

  useEffect(() => {
    setRole(roleList || []);
  }, [roleList]);

  if (session.status === "loading" || session.status === "unauthenticated") {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex">
      <Navigation />
      <div className="flex-1">{children}</div>
    </div>
  );
};

export default PrivatePages;
