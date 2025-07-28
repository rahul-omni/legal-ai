"use client";
import { routeConfig } from "@/lib/routeConfig";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";

export default function EmailVerificationSuccessPage() {
  const router = useRouter();
  const email = useSearchParams().get("email") || "";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
      <div className="bg-background-light shadow-md rounded-lg p-8 max-w-md w-full text-center">
        <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-text-dark mb-4">Email Verified!</h1>
        <p className="text-text-light mb-6">
          Your email has been successfully verified. You can now proceed to log in.
        </p>
        <button
          onClick={() =>
            router.replace(
              `${routeConfig.publicRoutes.login}?email=${email}&from=${routeConfig.publicRoutes.verifyEmailSuccess}`
            )
          }
          className="px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition"
        >
          Proceed to Login
        </button>
      </div>
    </div>
  );
}
