import { InvitationStatus } from "@prisma/client";
import { SuccessResponse } from "../types";

export interface InviteTeamMemberReq {
  email: string;
  orgId: string;
  roleId: string;
}

export interface InviteTeamMemberRes extends SuccessResponse {
  email: string;
  token: string | null;
  orgId: string;
  orgName?: string;
  roleId: string;
  status: InvitationStatus;
}
