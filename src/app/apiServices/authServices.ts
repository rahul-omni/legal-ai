import { apiClient } from ".";
import { signIn as nextAuthSignIn } from "next-auth/react"; // Changed import to use client-side version
import {
  SignupRequest,
  SignupResponse,
} from "../api/auth/types";
import { ErrorResponse } from "../api/lib/errors";

export const login = async (credentials: {
  email: string;
  password: string;
}) => {
  try {
    const result = await nextAuthSignIn("credentials", {
      ...credentials,
      redirect: false,
    });

    if (result?.error) {
      console.log("Login error:", result.error);
    }

    return { success: result.ok };
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async signup(data: SignupRequest): Promise<SignupResponse | ErrorResponse> {
    try {
      const response = await apiClient.post("/auth/signup", data);

      return response as unknown as SignupResponse;
    } catch (error) {
      return error as ErrorResponse;
    }
  }
}

export const authService = AuthService.getInstance();
