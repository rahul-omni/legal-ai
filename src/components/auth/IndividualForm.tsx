
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "react-hot-toast";
 
import { routeConfig } from "@/lib/routeConfig";
import { useRouter } from "next/navigation";
 

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  mobileNumber: z.string().min(10, "Invalid mobile number").max(10),
  otp: z.string().min(6, "OTP must be 6 digits").max(6).optional(),
  email: z
  .string()
  .trim()
  .optional()
  .refine(
    (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    "Invalid email address"
  )
});

type FormData = z.infer<typeof schema>;

export default function IndividualForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (_data: FormData) => Promise<{ success: boolean; message?: string }>;
  isLoading: boolean;
}) {
  const [otpSent, setOtpSent] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mobileNumber = watch("mobileNumber");

  const handleSendOtp = async () => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      setError("mobileNumber", { message: "Valid mobile number required" });
      return;
    }

    setIsSendingOtp(true);
    try {
      const response = await fetch("/api/auth/signup-send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobileNumber }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to send OTP");

      setOtpSent(true);
      toast.success("OTP sent successfully!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send OTP";
      setError("root", { message: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otp = watch("otp");
    if (!otp || otp.length !== 6) {
      setError("otp", { message: "Valid OTP required" });
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const response = await fetch("/api/auth/signup-verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobileNumber, otp }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "OTP verification failed");

      setMobileVerified(true);
      toast.success("Mobile number verified!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "OTP verification failed";
      setError("otp", { message: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const onFormSubmit = async (data: FormData) => {
    try {
      const result = await onSubmit(data);
      
      if (result.success) {
        toast.success("Registration successful!");
          router.push(routeConfig.publicRoutes.login)// 👈 Redirect to login
         
      } else {
        toast.error(result.message || "Registration failed");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onFormSubmit)}>
      <div className="rounded-md shadow-sm space-y-4">
        <div>
          <label htmlFor="name" className="sr-only">
            Name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            {...register("name")}
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="Name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label htmlFor="mobileNumber" className="sr-only">
              Mobile Number
            </label>
            <input
              id="mobileNumber"
              type="tel"
              autoComplete="tel"
              {...register("mobileNumber")}
              disabled={otpSent}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100"
              placeholder="Mobile Number"
            />
            {errors.mobileNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.mobileNumber.message}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={otpSent || isSendingOtp}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isSendingOtp ? "Sending..." : otpSent ? "Sent" : "Send OTP"}
          </button>
        </div>

        {otpSent && (
          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="otp" className="sr-only">
                OTP
              </label>
              <input
                id="otp"
                type="text"
                {...register("otp")}
                disabled={mobileVerified}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100"
                placeholder="Enter OTP"
              />
              {errors.otp && (
                <p className="mt-1 text-sm text-red-600">{errors.otp.message}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={mobileVerified || isVerifyingOtp}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isVerifyingOtp ? "Verifying..." : mobileVerified ? "Verified" : "Verify"}
            </button>
          </div>
        )}

        {mobileVerified && (
          <>
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address(optional)"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
          </>
        )}
      </div>

      {errors.root && (
        <p className="text-sm text-red-600">{errors.root.message}</p>
      )}

      <button
        className="w-full bg-primary text-white py-2 rounded hover:bg-primaryDark disabled:opacity-50 disabled:cursor-not-allowed"
        type="submit"
        disabled={isLoading || !mobileVerified}
      >
        {isLoading ? "Creating account..." : "Sign up as Individual"}
      </button>
    </form>
  );
}