import { apiClient } from "@/app/apiServices";
import axios, { AxiosError, CancelTokenSource } from "axios";
import { useState, useCallback, useEffect, useRef } from "react";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const useAxios = <TResponse>() => {
  const [data, setData] = useState<TResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const cancelTokenSource = useRef<CancelTokenSource | null>(null);

  const fetchData = useCallback(
    async (
      url: string,
      method: HttpMethod = "GET",
      payload?: unknown,
      headers?: Record<string, string>
    ): Promise<TResponse | null> => {
      try {
        // Cancel previous request if exists
        if (cancelTokenSource.current) {
          cancelTokenSource.current.cancel();
        }

        // Create new cancel token
        cancelTokenSource.current = axios.CancelToken.source();
        setLoading(true);
        setError(null);

        const response = await apiClient({
          url,
          method,
          data: payload,
          headers,
          cancelToken: cancelTokenSource.current.token,
        });
     
        setData(response.data);
        return response.data;
      } catch (err) {
        if (!axios.isCancel(err)) {
          setError(
            (err as AxiosError).response?.data || (err as Error).message
          );
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Abort on unmount
  useEffect(() => {
    return () => {
      if (cancelTokenSource.current) {
        cancelTokenSource.current.cancel();
      }
    };
  }, []);

  return { data, loading, error, fetchData };
};

export default useAxios;
