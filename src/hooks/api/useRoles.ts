import { apiRouteConfig } from "@/app/api/lib/apiRouteConfig";
import { RoleResponse } from "@/app/api/roles/types";
import { apiClient } from "@/app/apiServices";
import { Role } from "@prisma/client";
import { useEffect, useState } from "react";

export default function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<RoleResponse>(
        apiRouteConfig.privateRoutes.roles
      );
      setRoles(response.data.roles);
    } catch (err) {
      setError("Failed to fetch roles");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return { roles, isLoading, error, refetch: fetchRoles };
}
