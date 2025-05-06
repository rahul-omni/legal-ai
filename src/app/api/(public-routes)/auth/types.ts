// types/auth.ts
import { Organization, User } from "@prisma/client";

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

type BaseUserResponse = Omit<User, "password"> & {};

export interface IndividualSignupResponse {
  message: string;
  user: BaseUserResponse;
}

export interface OrganizationSignupResponse {
  message: string;
  user: BaseUserResponse;
  organization: Organization;
}

export type SignupResponse =
  | IndividualSignupResponse
  | OrganizationSignupResponse;

export interface CreatePasswordResponse {
  success: boolean;
  message: string;
}

export type OrgMembershipForAuth = {
  organizationId: string;
  organizationName: string;
  roleId: string;
};
