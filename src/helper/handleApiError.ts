export const handleApiError = (
  error: unknown,
  showToast?: (message: string, type?: "success" | "error") => void
) => {
  console.error("API Error:", error);

  const errorMessage =
    error instanceof Error
      ? error.message
      : "An unexpected error occurred. Please try again.";

  showToast && showToast(errorMessage, "error");
};
