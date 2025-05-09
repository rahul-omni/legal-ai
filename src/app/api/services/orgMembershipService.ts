import { db } from "@/app/api/lib/db";
import { ErrorApp } from "../lib/errors";
import { Transaction } from "../types";

class OrgMembershipService {
  async createOrgMembership(
    userId: string,
    orgId: string,
    roleId: string,
    tx?: Transaction
  ) {
    const prisma = tx || db;

    try {
      return await prisma.orgMembership.create({
        data: {
          userId,
          orgId,
          roleId,
        },
      });
    } catch {
      throw new ErrorApp("Failed to create organization membership");
    }
  }

  async findMembershipsByUserId(userId: string) {
    try {
      return await db.orgMembership.findMany({
        where: { userId },
        include: {
          org: true,
          user: true,
        },
      });
    } catch (error) {
      console.error("Failed to fetch user memberships:", error);
      throw new Error("Failed to fetch user memberships from the database");
    }
  }
}

export const orgMembershipService = new OrgMembershipService();
