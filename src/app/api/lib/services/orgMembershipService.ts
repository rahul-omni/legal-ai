import { db } from "@/lib/db";
import { Transaction } from "../../types";
import { ErrorApp } from "../errors";

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
    } catch (error) {
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
