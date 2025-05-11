import { OrgTeamMemberRes } from "@/app/api/(private-routes)/organization/types";
import { apiRouteConfig } from "@/app/api/lib/apiRouteConfig";
import { apiClient } from "@/app/apiServices";
import { OrgMembership } from "@prisma/client";
import { useState } from "react";

export default function useOrganizationUsers() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async (
    organizationId: string
  ): Promise<OrgMembership[] | undefined> => {
    if (!organizationId) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<OrgMembership[]>(
        apiRouteConfig.privateRoutes.organization(organizationId)
      );
      return response.data; // Return the array of OrgMembership
    } catch {
      setError("Failed to fetch organization users");
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, fetchUsers };
}
