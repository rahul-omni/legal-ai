import toast from "react-hot-toast";

export const handleApiError = (error: unknown) => {
  const errorMessage =
    error instanceof Error
      ? error.message
      : "An unexpected error occurred. Please try again.";

  toast.error(errorMessage);
};
