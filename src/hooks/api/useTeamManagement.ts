// create a hook for inviting team members

import { apiRouteConfig } from "@/app/api/lib/apiRouteConfig";
import { apiClient } from "@/app/apiServices";
import { useState } from "react";

interface InviteTeamMemberRequest {
  email: string;
  roleId: string;
  orgId: string;
}

export const useInviteTemMember = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inviteTeamMember = async (req: InviteTeamMemberRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post(
        apiRouteConfig.publicRoutes.inviteTeamMember,
        req
      );

      return response.data;
    } catch (err) {
      setError("Failed to invite team member");
      return;
    } finally {
      setIsLoading(false);
    }
  };

  return { inviteTeamMember, isLoading, error };
};
