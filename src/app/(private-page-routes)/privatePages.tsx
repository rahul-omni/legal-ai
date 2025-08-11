"use client";
import { Spinner } from "@/components/Loader";
import { Navigation } from "@/components/Navigation";
import { TopNavbar } from "@/components/ui/TopNavbar";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
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
  const breadcrumbs = useBreadcrumbs();

  const session = useSession();

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
    return <Spinner />;
  }

  return (
    <div className="h-screen flex flex-row">
      <Navigation />
      <div className="flex flex-1 flex-col">
        <TopNavbar />
        {/* Breadcrumb Navigation */}
        <div className="px-6 py-2 bg-background">
          <Breadcrumb items={breadcrumbs} />
        </div>
        <div className="flex-1 overflow-auto bg-background h-full min-h-0">{children}</div>
      </div>
    </div>
  );
};

export default PrivatePages;
