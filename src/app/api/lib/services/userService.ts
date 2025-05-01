import { db } from "@/lib/db";
import { OrgMembership, User, PrismaClient } from "@prisma/client";
import { Transaction } from "../../types";
import { NotFoundError } from "../errors";

type UserWithOrganizations = User & {
  orgMemberships: OrgMembership[];
};

class UserService {
  async findUserByEmail(email: string) {
    try {
      return await db.user.findUnique({
        where: { email },
      });
    } catch (error) {
      console.error("Failed to find user by email:", error);
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
    } catch (error) {
      throw new NotFoundError("User not found");
    }
  }

  async createUser(user: User, tx?: Transaction) {
    try {
      const prisma = tx || db;
      return await prisma.user.create({
        data: user,
      });
    } catch (error) {
      console.error("Failed to create user:", error);
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
    } catch (error) {
      throw new NotFoundError("User not found");
    }
  }

  async updateUserById(user: User) {
    try {
      return await db.user.update({
        where: { id: user.id },
        data: user,
      });
    } catch (error) {
      throw new NotFoundError("User not found");
    }
  }
}

// Export default instance for easier usage
export const userService = new UserService();
