import { useLoading } from "@/context/loadingContext";

export function LoadingIndicator() {
  const { loadingState } = useLoading();
  const anyLoading = Object.values(loadingState).some(Boolean);
  return anyLoading ? <div className="global-loader">Loading...</div> : null;
}
