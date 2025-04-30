import { Role } from "@prisma/client";
import { SuccessResponse } from "../types";

export interface RoleResponse extends SuccessResponse {
  roles: Role[]; // Optional, present when the request is successful
}
