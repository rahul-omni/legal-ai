
"use client";
import { login, sendOtp, verifyOtp } from "@/app/apiServices/authServices";
import { useLoadingContext } from "@/context/loadingContext";
import { routeConfig } from "@/lib/routeConfig";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [activeTab, setActiveTab] = useState<"organization" | "individual">("individual");
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const { startLoading, stopLoading, isLoading } = useLoadingContext();
  const emailParam = useSearchParams().get("email") || "";
  const redirectedFromParam = useSearchParams().get("from") || "";

  useEffect(() => {
    if (!emailParam) return;
    setEmail(emailParam);

    if (redirectedFromParam !== routeConfig.publicRoutes.signup) return;
    toast("Please verify your email before logging in", { icon: "ℹ️" });
  }, [emailParam, redirectedFromParam]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendDisabled && resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    } else if (resendTimer === 0) {
      setResendDisabled(false);
      setResendTimer(30);
    }
    return () => clearTimeout(timer);
  }, [resendDisabled, resendTimer]);


  
  
 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  try {
    if (activeTab === "organization") {
      startLoading("LOGGING_IN");
      const loggedIn = await login({ email, password });
      if (!loggedIn.success) return;
      router.push(routeConfig.privateRoutes.cases);
    } else {
      if (!otpSent) {
        startLoading("SENDING_OTP");
        const otpResponse = await sendOtp(mobileNumber);
        console.log("OTP response:", otpResponse);
        
        //Add this check for mobile number not registered
        if (!otpResponse.success) {
         
            toast.error("Your number is not registered. Please sign up first.");
            return;
          
           
        }
       
        setOtpSent(true);
        setResendDisabled(true);
        toast.success("OTP sent successfully!");
      } else {
        startLoading("VERIFYING_OTP");
        const verified = await verifyOtp(mobileNumber, otp);
        
        if (!verified.success) {
          toast.error(verified.message || "OTP verification failed");
          return;
        }

        toast.success("Mobile number verified successfully!");
         router.push(routeConfig.privateRoutes.projects);
      }
    }
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Login failed");
    setError(err instanceof Error ? err.message : "Login failed");
  } finally {
    stopLoading(activeTab === "organization" ? "LOGGING_IN" : 
              otpSent ? "VERIFYING_OTP" : "SENDING_OTP");
  }
};
  const handleResendOtp = async () => {
    try {
      startLoading("SENDING_OTP");
      const otpSent = await sendOtp( mobileNumber ); // Changed to use mobileNumber
      
        if (!otpSent.success) {
     
        toast.error("Your number is not registered. Please sign up first.");
        return;
      
    }
    
  

 
      setResendDisabled(true);
      setResendTimer(30);
      toast.success("New OTP sent to your mobile number"); // Updated message
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend OTP");
    } finally {
      stopLoading("SENDING_OTP");
    }
  };

  
  const handleTabChange = (tab: "organization" | "individual") => {
    setActiveTab(tab);
    setOtpSent(false);
    setError("");
    setOtp("");
    setPassword("");
    setMobileNumber("");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding & Message */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-50 p-8">
        <div className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Background Pattern */}
          <div className="relative bg-gradient-to-br from-indigo-100 via-purple-50 to-cyan-100 h-full">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}></div>
            </div>
            
            {/* Abstract Graphics */}
            <div className="absolute bottom-0 right-0 opacity-20">
              <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="150" cy="150" r="40" fill="#6366f1" opacity="0.3"/>
                <circle cx="100" cy="120" r="20" fill="#8b5cf6" opacity="0.2"/>
                <circle cx="170" cy="100" r="15" fill="#06b6d4" opacity="0.2"/>
                 </svg>
            </div>
            
            {/* Content */}
            <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-gray-800 h-full">
              {/* Main Title */}
              <div className="mb-8">
                <h1 className="text-4xl font-light mb-6 leading-tight">
                  <span className="font-normal text-gray-600">“THE”</span><br/>
                  <span className="font-normal text-gray-600">FUTURE OF</span><br/>
                  <span className="font-bold text-indigo-700">LEGAL PRACTICE</span><br/>
                  <span className="font-normal text-gray-600">MANAGEMENT</span>
                </h1>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-base text-gray-600">Intelligent case alerts</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-base text-gray-600">Real-time case updates</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-base text-gray-600">AI-powered translations</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-base text-gray-600">Automated document drafting</span>
                  </div>
                </div>
              </div>

              {/* Bottom Text */}
              <div className="mt-auto">
                <p className="text-sm text-gray-500">Advanced AI-powered legal infrastructure</p>
               </div>
             </div>
           </div>
         </div>
       </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
        <div className="w-full max-w-md space-y-6">
          {/* Logo */}
          <div className="flex justify-center mb-16">
            <img 
              src="/logo.png" 
              alt="Vakeel Assist Logo" 
              className="h-14 w-auto object-contain"
            />
          </div>
          
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Sign in</h1>
            <p className="text-gray-600">
              Welcome back! Please sign in to access your legal workspace.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              className={`flex-1 py-3 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === "individual"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => handleTabChange("individual")}
            >
              Individual
            </button>
            <button
              className={`flex-1 py-3 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === "organization"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => handleTabChange("organization")}
            >
              Organization
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              {activeTab === "organization" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="Enter your email address"
                      disabled={isLoading("LOGGING_IN")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="Enter your password"
                      required
                      disabled={isLoading("LOGGING_IN")}
                    />
                  </div>
                </>
              )}

              {activeTab === "individual" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="Enter your mobile number"
                      required
                      disabled={isLoading("SENDING_OTP") || isLoading("VERIFYING_OTP")}
                    />
                  </div>

                  {otpSent && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        OTP (Sent to your mobile)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          placeholder="Enter 6-digit OTP"
                          required
                          maxLength={6}
                          disabled={isLoading("VERIFYING_OTP")}
                        />
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={resendDisabled || isLoading("SENDING_OTP")}
                          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {resendDisabled
                            ? `Resend OTP in ${resendTimer}s`
                            : isLoading("SENDING_OTP")
                            ? "Sending..."
                            : "Resend OTP"}
                        </button>
                        {otp.length > 0 && (
                          <span className="text-xs text-gray-500">
                            {otp.length}/6 digits
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-error-light p-4">
                <p className="text-sm text-error-dark">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={
                activeTab === "organization"
                  ? isLoading("LOGGING_IN") || !email || !password
                  : otpSent
                  ? isLoading("VERIFYING_OTP") || !otp || otp.length !== 6
                  : isLoading("SENDING_OTP") || !mobileNumber
              }
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {activeTab === "organization" ? (
                isLoading("LOGGING_IN") ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )
              ) : otpSent ? (
                isLoading("VERIFYING_OTP") ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  "Verify OTP"
                )
              ) : isLoading("SENDING_OTP") ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Sending OTP...
                </span>
              ) : (
                "Send OTP"
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-4">
            {activeTab === "organization" && (
              <p className="text-sm text-gray-600">
                <button 
                  type="button"
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                  // onClick={() => router.push(routeConfig.publicRoutes.forgotPassword)}
                >
                  Forgot your password?
                </button>
              </p>
            )}
            <p className="text-sm text-gray-600">
              {"Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => router.push(routeConfig.publicRoutes.signup)}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}