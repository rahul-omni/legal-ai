// authServices.ts
import { signIn as nextAuthSignIn } from "next-auth/react";
import { apiClient } from ".";
import { ErrorResponse } from "../api/lib/errors";
import { SignupRequest, SignupResponse } from "../api/(public-routes)/auth/types";

export interface OtpResponse {
  success: boolean;
  message?: string;
  retryAfter?: number;
  token?: string;
  user?: any;
}

export const login = async (credentials: {
  email: string;
  password: string;
}): Promise<{ success: boolean; message?: string }> => {
  try {
    const result = await nextAuthSignIn("credentials", {
      ...credentials,
      redirect: false,
    });

    if (result?.error) {
      console.error("Login error:", result.error);
      return { 
        success: false, 
        message: result.error 
      };
    }

    return { success: result?.ok ?? false };
  } catch (error: any) {
    console.error("Login error:", error);
    return {
      success: false,
      message: error.message || "Login failed"
    };
  }
};

export const sendOtp = async (mobileNumber: string): Promise<OtpResponse> => {
  try {
    // Basic validation
    const cleanedMobile = mobileNumber.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanedMobile)) {
      return {
        success: false,
        message: "Invalid Indian mobile number format (10 digits starting with 6-9)"
      };
    }

    const response = await apiClient.post<OtpResponse>("/auth/send-otp", { 
      mobileNumber: cleanedMobile
    });

    if (!response.data.success) {
      return {
        success: false,
        message: response.data.message || "Failed to send OTP"
      };
    }

    return {
      ...response.data,
      message: "OTP sent successfully"
    };
  } catch (error: any) {
    console.error("Send OTP error:", error);
    
    // Handle specific error cases
    if (error.response?.status === 429) {
      return {
        success: false,
        message: error.response.data?.message || "Too many OTP requests",
        retryAfter: error.response.data?.retryAfter
      };
    }

    return {
      success: false,
      message: error.response?.data?.message || "Failed to send OTP",
      ...error.response?.data
    };
  }
};

export const verifyOtp = async (mobileNumber: string, otp: string): Promise<OtpResponse> => {
  try {
    // Validate inputs
    const cleanedMobile = mobileNumber.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanedMobile)) {
      return {
        success: false,
        message: "Invalid Indian mobile number format"
      };
    }

    if (!/^\d{6}$/.test(otp)) {
      return {
        success: false,
        message: "OTP must be 6 digits"
      };
    }

    // Call backend to verify OTP
    const response = await apiClient.post<OtpResponse>("/auth/verify-otp", {
      mobileNumber: cleanedMobile,
      otp
    });

    if (!response.data.success) {
      return {
        success: false,
        message: response.data.message || "OTP verification failed"
      };
    }

    // If using NextAuth for session management
    const signInResponse = await nextAuthSignIn("credentials", {
      redirect: false,
      mobileNumber: cleanedMobile,
      otp
    });

    if (signInResponse?.error) {
      return {
        success: false,
        message: signInResponse.error || "Session creation failed"
      };
    }

    return {
      success: true,
      message: "Mobile number verified successfully",
      user: response.data.user,
      token: response.data.token
    };

  } catch (error: any) {
    console.error('Verify OTP error:', error);
    
    // Handle specific error cases
    if (error.response?.status === 429) {
      return {
        success: false,
        message: "Too many attempts. Please try again later",
        retryAfter: error.response.data?.retryAfter
      };
    }

    return {
      success: false,
      message: error.response?.data?.message || "OTP verification failed",
      ...error.response?.data
    };
  }
};

// Enhanced AuthService with mobile verification
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