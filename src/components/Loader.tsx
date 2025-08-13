import { useLoadingContext } from "@/context/loadingContext";
import { Loader2 } from "lucide-react";

export const Spinner = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div
        className="h-16 w-16 rounded-full border-8 border-primary border-t-transparent animate-spin"
        aria-label="Loading"
        role="status"
      />
    </div>
  );
};

export function GlobalLoader() {
  const { loadingState } = useLoadingContext();
  const anyLoading = Object.values(loadingState).some(Boolean);
  return anyLoading ? <Spinner /> : null;
}

export const IconLoader = () => {
  return <Loader2 className="w-4 h-4 animate-spin" />;
};
