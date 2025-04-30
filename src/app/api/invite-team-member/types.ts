import { InvitationStatus } from "@prisma/client";
import { SuccessResponse } from "../types";

export interface InviteUserReq {
  email: string;
  orgId: string;
  roleId: string;
}

export interface InviteUserRes extends SuccessResponse {
  email: string;
  token: string;
  orgId: string;
  orgName?: string;
  roleId: string;
  status: InvitationStatus;
}
