// types/auth.ts
import { PermissionName, RoleName, User } from "@prisma/client";
import { ZodIssue } from "zod";

type SignupType = "individual" | "organization";

export interface IndividualSignupRequest {
  name?: string;
  email: string;
  password: string;
  roleId?: string; // Optional role ID (will use default if not provided)
  signupType: SignupType;
}

export interface OrganizationSignupRequest {
  orgName: string;
  adminName: string;
  email: string;
  password: string;
  roleId?: string; // Optional role ID (will use ADMIN if not provided)
  signupType: SignupType;
}

export type SignupRequest = IndividualSignupRequest & OrganizationSignupRequest;

export interface BaseUserResponse {
  id: string;
  name: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  roleId: string | null;
  email: string;
  isVerified: boolean | null;
  isIndividual: boolean | null;
}

export interface UserWithRoleResponse extends BaseUserResponse {
  role: {
    id: string;
    name: RoleName;
    description: string | null;
    permissions: {
      id: string;
      name: PermissionName;
    }[];
  } | null;
}

export interface OrganizationResponse {
  id: string;
  name: string;
  plan: "FREE" | "PRO" | "ENTERPRISE";
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IndividualSignupResponse {
  message: string;
  user: BaseUserResponse;
}

export interface OrganizationSignupResponse {
  message: string;
  user: BaseUserResponse;
  organization: OrganizationResponse;
}

export type SignupResponse =
  | IndividualSignupResponse
  | OrganizationSignupResponse;

export interface CreatePasswordResponse {
  success: boolean;
  message: string;
}

export interface ErrorResponse {
  errMsg: string;

  errors?:
    | Array<{
        path: string[];
        message: string;
      }>
    | ZodIssue[];
}
