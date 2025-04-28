"use client";
import { routeConfig } from "@/lib/routeConfig";
import { useRouter, useSearchParams } from "next/navigation";

export default function EmailVerificationSuccessPage() {
  const router = useRouter();
  const email = useSearchParams().get("email") || "";
  return (
    <div className="text-center p-6">
      <h1 className="text-2xl font-bold mb-4">Email Verified!</h1>
      <p>Your email has been successfully verified.</p>
      <button
        onClick={() =>
          router.replace(
            `${routeConfig.publicRoutes.login}?email=${email}&from=${routeConfig.publicRoutes.verifyEmailSuccess}`
          )
        }
        className="mt-4 inline-block text-primary hover:underline"
      >
        Proceed to Login
      </button>
    </div>
  );
}
