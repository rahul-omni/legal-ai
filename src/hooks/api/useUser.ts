import { UserResponse } from "@/app/api/(private-routes)/user/types";
import { apiRouteConfig } from "@/app/api/lib/apiRouteConfig";
import { apiClient } from "@/app/apiServices";
import { useState } from "react";

export default function useUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<UserResponse>(
        `${apiRouteConfig.privateRoutes.user}?email=${email}`
      );
      return response.data;
    } catch (err) {
      setError("Failed to fetch user");
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, fetchUser };
}
