import {
  InviteTeamMemberReq,
  InviteTeamMemberRes,
} from "@/app/api/(private-routes)/invite-team-member/types";
import { apiRouteConfig } from "@/app/api/lib/apiRouteConfig";
import { apiClient } from "@/app/apiServices";
import { useState } from "react";

export const useInviteTemMember = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inviteTeamMember = async (
    req: InviteTeamMemberReq
  ): Promise<InviteTeamMemberRes | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<InviteTeamMemberRes>(
        apiRouteConfig.publicRoutes.inviteTeamMember,
        req
      );

      return response.data;
    } catch (err) {
      setError("Failed to invite team member");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { inviteTeamMember, isLoading, error };
};

// hook to fetch invited team members
export const useFetchTeamMembers = (orgId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const fetchTeamMembers = async () => {};

  return { fetchTeamMembers, isLoading, error, data };
};
