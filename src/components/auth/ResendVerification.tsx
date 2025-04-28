"use client";
import { useResendVerification } from "@/hooks/api/useAuth";
import { useState } from "react";

export default function ResendVerification({ email }: { email: string }) {
  const [message, setMessage] = useState("");
  const { resendVerification, isLoading } = useResendVerification();

  const handleResend = async () => {
    try {
      const response = await resendVerification(email);
      setMessage(response.data.message);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="text-center mt-4">
      <button onClick={handleResend} disabled={isLoading} className="text-sm">
        {isLoading ? "Sending..." : "Resend Verification Email"}
      </button>
      {message && (
        <p
          className={`text-sm mt-2 ${
            message.includes("success") ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
