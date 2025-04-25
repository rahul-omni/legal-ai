import { User } from "@prisma/client";
import { apiClient } from ".";
import {
  ErrorResponse,
  SignupRequest,
  SignupResponse,
} from "../api/auth/types";

export const login = async (userDetails: {
  email: string;
  password: string;
}): Promise<{ token: string; user: User }> => {
  try {
    const { data } = await apiClient.post("/auth/login", userDetails);
    const { token, user } = data;

    return { token, user };
  } catch (error) {
    throw new Error("Failed to login user");
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
