import { SignupRequest } from "@/app/api/auth/types";
import { apiClient } from "@/app/apiServices";
import { routeConfig } from "@/lib/routeConfig";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function useSignup() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const router = useRouter();

  const signup = async (data: SignupRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw result;
      }

      router.push(
        `${routeConfig.publicRoutes.verifyEmail}?email=${data.email}&from=${
          routeConfig.publicRoutes.signup
        }`
      );
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, signup };
}

export const useResendVerification = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resendVerification = async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post("/auth/resend-verification", {
        email,
      });
      return response.data;
    } catch (err) {
      setError("Failed to resend verification email");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { resendVerification, isLoading, error };
};
