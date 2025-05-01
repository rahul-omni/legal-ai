import { PrismaClient } from "@prisma/client";

export interface SuccessResponse {
  successMessage: string;
}

export interface ErrorResponse {
  errorMessage: string;
}

export type Transaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;


