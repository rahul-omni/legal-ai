import { OrgMembership, User } from "@prisma/client";
import { SuccessResponse } from "../../types";

export interface UserResponse extends SuccessResponse {
  user: User;
  orgMemberships: OrgMembership[];
}
