import { PrismaClient } from "@prisma/client";

export interface SuccessResponse {
  successMessage?: string;
  success?: boolean;
}

export type Transaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;
