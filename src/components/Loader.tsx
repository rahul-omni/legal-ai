import { useLoadingContext } from "@/context/loadingContext";

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
