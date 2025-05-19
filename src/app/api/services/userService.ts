import { db } from "@/app/api/lib/db";
import { OrgMembership, User } from "@prisma/client";
import { ErrorNotFound } from "../lib/errors";
import { Transaction } from "../types";

type UserWithOrganizations = User & {
  orgMemberships: OrgMembership[];
};

class UserService {
  async findUserByEmail(email: string) {
    try {
      return await db.user.findUnique({
        where: { email },
      });
    } catch {
      throw new Error("Failed to find user in the database");
    }
  }

  async findUserByEmailWithOrgs(
    email: string
  ): Promise<UserWithOrganizations | null> {
    try {
      const user = await db.user.findUnique({
        where: { email },
        include: { orgMemberships: true },
      });

      return user;
    } catch {
      throw new ErrorNotFound("User not found");
    }
  }

  async createUser(user: User, tx?: Transaction) {
    try {
      const prisma = tx || db;
      return await prisma.user.create({
        data: user,
      });
    } catch {
      throw new Error("Failed to create user in the database");
    }
  }

  async findUserByEmailWithPassword(email: string) {
    try {
      return await db.user.findUnique({
        where: {
          email,
          password: { not: null },
        },
      });
    } catch {
      throw new ErrorNotFound("User not found");
    }
  }

  async updateUserById(user: User) {
    try {
      return await db.user.update({
        where: { id: user.id },
        data: user,
      });
    } catch {
      throw new ErrorNotFound("User not found");
    }
  }
}

// Export default instance for easier usage
export const userService = new UserService();
