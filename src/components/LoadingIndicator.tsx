import { loadingContext } from "@/context/loadingContext";

export function LoadingIndicator() {
  const { loadingState } = loadingContext();
  const anyLoading = Object.values(loadingState).some(Boolean);
  return anyLoading ? <div className="global-loader">Loading...</div> : null;
}
