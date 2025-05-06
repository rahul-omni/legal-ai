import { User } from "@prisma/client";
import { apiClient } from ".";
import { signIn } from "../api/(public-routes)/auth/[...nextauth]/route";
import {
  SignupRequest,
  SignupResponse,
} from "../api/(public-routes)/auth/types";
import { ErrorResponse } from "../api/lib/errors";

export const login = async (userDetails: {
  email: string;
  password: string;
}): Promise<{ token: string; user: User } | null> => {
  try {
    const result = await signIn("credentials", {
      values: {
        email: userDetails.email,
        password: userDetails.password,
      },
    });

    if (result) {
      console.log("Error logging in:", result);
    }

    return result;
  } catch (error) {
    return null;
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
