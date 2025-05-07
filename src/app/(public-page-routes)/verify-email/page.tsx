"use client";
import { routeConfig } from "@/lib/routeConfig";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleAlert } from "lucide-react";

export default function EmailVerificationPage() {
  const router = useRouter();
  const email = useSearchParams().get("email") || "";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full text-center">
        <CircleAlert className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Verify Your Email
        </h1>
        <p className="text-gray-600 mb-6">
          Please verify your email address to proceed further. Check your inbox
          for the verification link. If you didn’t receive the email, you can
          resend it.
        </p>
        <div className="flex flex-col gap-4">
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
          <button
            //TODO - Implement resend verification email functionality
            // onClick={() => alert("Resend verification email functionality not implemented yet.")}
            className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition"
          >
            Resend Verification Email
          </button>
        </div>
      </div>
    </div>
  );
}
