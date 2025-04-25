import { SignupRequest } from "@/app/api/auth/types";
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

      // Redirect based on signup type
      if (data.signupType === "organization") {
        router.push("/projects");
      } else {
        router.push("/projects");
      }
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, signup };
}
