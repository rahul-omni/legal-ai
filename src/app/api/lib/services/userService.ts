import { db } from "@/lib/db";
import { User } from "@prisma/client";

class UserService {
  /**
   * Finds a user by their email address
   */
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

  async findUserByEmailWithOrgs(email: string) {
    try {
      return await db.user.findUnique({
        where: { email },
        include: { organizations: true },
      });
    } catch (error) {
      console.error("Failed to find user by email:", error);
      throw new Error("Failed to find user in the database");
    }
  }

  /**
   * Creates a new verified user with the given email
   */
  async createUser(user: User) {
    try {
      return await db.user.create({
        data: {
          ...user,
        },
      });
    } catch (error) {
      console.error("Failed to create user:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to create user in the database");
    }
  }
}

// Export default instance for easier usage
export const userService = new UserService();
