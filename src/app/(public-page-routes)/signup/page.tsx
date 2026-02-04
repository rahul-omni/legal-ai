"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import SignupForm from "@/components/auth/SignupForm";
import FormWrapper from "@/components/auth/FormWrapper";

export default function SignupPage() {
  const [signupType, setSignupType] = useState<"individual" | "organization">(
    "individual"
  );
  const searchParams = useSearchParams();
  const mobileParam = searchParams.get("mobile") || "";

  return (
    <FormWrapper title="Create your account">
      <div className="flex mb-6">
        <button
          className={`flex-1 py-2 font-medium ${
            signupType === "individual"
              ? "border-b-2 border-primary text-primary"
              : "text-muted"
          }`}
          onClick={() => setSignupType("individual")}
        >
          Individual
        </button>
        <button
          className={`flex-1 py-2 font-medium ${
            signupType === "organization"
              ? "border-b-2 border-primary text-primary"
              : "text-muted"
          }`}
          onClick={() => setSignupType("organization")}
        >
          Organization
        </button>
      </div>
      <SignupForm signupType={signupType} initialMobileNumber={mobileParam} />
    </FormWrapper>
  );
}
