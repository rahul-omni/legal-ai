import { Invitation } from "@prisma/client";
import { SuccessResponse } from "../../types";

export type OrgTeamMemberRes = SuccessResponse & {
  invitations: Invitation[];
};
