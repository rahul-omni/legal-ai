
import { CreatePasswordResponse, SignupRequest } from "@/app/api/(public-routes)/auth/types";
import { apiRouteConfig } from "@/app/api/lib/apiRouteConfig";
import { apiClient } from "@/app/apiServices";
import { routeConfig } from "@/lib/routeConfig";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function useSignup() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const router = useRouter();
 
  
  //  const signup = async (data: SignupRequest) => {
  //   setIsLoading(true);
  //   setError(null);

  //   try {
  //     // Send different data based on signup step
  //     let response;
  //     if (data.mobileOtp&& data.email) {
  //       // Final step with email
  //       response = await apiClient.post(apiRouteConfig.publicRoutes.signup, {
  //         ...data,
           
  //       });
  //       router.push(
  //         `${routeConfig.publicRoutes.verifyEmail}?email=${data.email}&from=${
  //           routeConfig.publicRoutes.signup
  //         }`
  //       );

  //        // After successful registration, log the user in
         
  //       return response.data;
  //     } else if (data.mobileOtp ) {
  //       // OTP verification step
  //       response = await apiClient.post(apiRouteConfig.publicRoutes.signup, {
  //         ...data,
           
  //       });
  //     } else {
  //       // Initial mobile submission
  //       response = await apiClient.post(apiRouteConfig.publicRoutes.signup, {
  //         ...data,
           
  //       });
  //     }
      
  //     return response.data;
  //   } catch (err) {
  //     setError(err);
  //     throw err;
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  
   const signup = async (data: SignupRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      await apiClient.post(apiRouteConfig.publicRoutes.signup, data);

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
      const response = await apiClient.post(
        apiRouteConfig.publicRoutes.resendVerification,
        {
          email,
        }
      );
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

export const useCreatePassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const createPassword = async (data: {
    email: string;
    password: string;
  }): Promise<CreatePasswordResponse | undefined> => {
    setIsLoading(true);
    setError(undefined);
    try {
      const response = await apiClient.post(
        apiRouteConfig.publicRoutes.createPassword,
        data
      );
      return response.data;
    } catch (err) {
      setError("Failed to create password");
    } finally {
      setIsLoading(false);
    }
  };

  return { createPassword, isLoading, error };
};
