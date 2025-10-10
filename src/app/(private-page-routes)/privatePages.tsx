"use client";
import { Spinner } from "@/components/Loader";
import { Navigation } from "@/components/Navigation";
import { MobileNavigation } from "@/components/MobileNavigation";
import { TopNavbar } from "@/components/ui/TopNavbar";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useMobile } from "@/hooks/useMobile";
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
  const { isMobile } = useMobile();

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
    <div className={`${isMobile ? 'min-h-screen' : 'h-screen'} flex flex-col md:flex-row`}>
      {/* Desktop Navigation - only show on desktop */}
      {!isMobile && <Navigation />}
      
      <div className="flex flex-1 flex-col">
        <TopNavbar />
        {/* Breadcrumb Navigation */}
        <div className="px-6 py-2 bg-background">
          <Breadcrumb items={breadcrumbs} />
        </div>
        <div className={`flex-1 bg-background ${isMobile ? 'pb-20 min-h-screen' : 'overflow-auto h-full min-h-0'}`}>
          {children}
        </div>
      </div>
      
      {/* Mobile Navigation - only show on mobile */}
      {isMobile && <MobileNavigation />}
    </div>
  );
};

export default PrivatePages;
