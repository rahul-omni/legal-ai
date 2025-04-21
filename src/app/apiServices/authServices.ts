import { setAuthCookie } from "@/lib/auth";
import { apiClient } from ".";

export const login = async (userDetails: {
  email: string;
  password: string;
}): Promise<{ token: string }> => {
  try {
    const { data } = await apiClient.post("/auth/login", userDetails);
    const { token } = data;
    setAuthCookie(token);
    return token;
  } catch (error) {
    throw new Error("Failed to login user");
  }
};
