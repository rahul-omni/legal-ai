import { apiClient } from ".";
import { signIn } from "next-auth/react"; // Changed import to use client-side version
import {
  SignupRequest,
  SignupResponse,
} from "../api/(public-routes)/auth/types";
import { ErrorResponse } from "../api/lib/errors";

export const login = async (userDetails: {
  email: string;
  password: string;
}) => {
  try {
    console.log("Attempting to sign in with:", {
      email: userDetails.email,
      password: userDetails.password,
    });

    const result = await signIn("credentials", {
      email: userDetails.email,
      password: userDetails.password,
      redirect: false,
      // callbackUrl: routeConfig.privateRoutes.projects,
    });

    console.log("Sign-in result:", result);
    return result;
  } catch (error) {
    console.error("Error during sign-in:", error);
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
