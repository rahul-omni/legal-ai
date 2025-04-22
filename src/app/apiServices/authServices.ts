import { setAuthCookie } from "@/lib/auth";
import { apiClient } from ".";
import { User } from "@prisma/client";

export const login = async (userDetails: {
  email: string;
  password: string;
}): Promise<{ token: string; user: User }> => {
  try {
    const { data } = await apiClient.post("/auth/login", userDetails);
    const { token, user } = data;
    
    return {token, user };
  } catch (error) {
    throw new Error("Failed to login user");
  }
};
