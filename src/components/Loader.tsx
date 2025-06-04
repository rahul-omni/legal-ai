import { useLoadingContext } from "@/context/loadingContext";
import { Loader2 } from "lucide-react";

export const Spinner = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
