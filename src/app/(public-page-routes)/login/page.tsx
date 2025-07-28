
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
  const [activeTab, setActiveTab] = useState<"organization" | "individual">("organization");
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
      router.push(routeConfig.privateRoutes.projects);
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
      {/* Left side - Graphic (same as before) */}
              <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/90 to-primaryDark relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
         <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
         <div className="relative z-10 flex flex-col justify-center px-16 text-white">
           <div className="py-16">
             <h2 className="text-4xl font-bold mb-6">Welcome Back</h2>
             <p className="text-lg text-white/80">
               Streamline your legal workflow with AI-powered insights
             </p>
             <div className="mt-12 relative h-64">
               <div className="absolute inset-0 flex items-center justify-center">
                 {/* Modern geometric SVG pattern */}
                 <svg
                   width="320"
                   height="200"
                   viewBox="0 0 320 200"
                   fill="none"
                   xmlns="http://www.w3.org/2000/svg"
                   className="opacity-90"
                 >
                   <rect
                     x="30"
                     y="30"
                     width="60"
                     height="60"
                     rx="16"
                     fill="url(#rectGrad)"
                     opacity="0.18"
                   />
                   <circle
                     cx="220"
                     cy="60"
                     r="36"
                     fill="url(#circleGrad)"
                     opacity="0.13"
                   />
                   <polygon
                     points="160,160 200,190 120,190"
                     fill="url(#polyGrad)"
                     opacity="0.16"
                   />
                   <line
                     x1="40"
                     y1="170"
                     x2="280"
                     y2="170"
                     stroke="#fff"
                     strokeWidth="2"
                     opacity="0.08"
                   />
                   <ellipse
                     cx="80"
                     cy="140"
                     rx="28"
                     ry="12"
                     fill="#fff"
                     opacity="0.07"
                   />
                   <ellipse
                     cx="260"
                     cy="140"
                     rx="18"
                     ry="8"
                     fill="#fff"
                     opacity="0.09"
                   />
                   <rect
                     x="250"
                     y="30"
                     width="18"
                     height="18"
                     rx="4"
                     fill="#fff"
                     opacity="0.10"
                   />
                   <defs>
                     <linearGradient
                       id="rectGrad"
                       x1="30"
                       y1="30"
                       x2="90"
                       y2="90"
                       gradientUnits="userSpaceOnUse"
                     >
                       <stop stopColor="#fff" stopOpacity="0.5" />
                       <stop offset="1" stopColor="#fff" stopOpacity="0.1" />
                     </linearGradient>
                     <radialGradient
                       id="circleGrad"
                       cx="0"
                       cy="0"
                       r="1"
                       gradientTransform="translate(220 60) scale(36)"
                       gradientUnits="userSpaceOnUse"
                     >
                       <stop stopColor="#fff" stopOpacity="0.4" />
                       <stop offset="1" stopColor="#fff" stopOpacity="0.08" />
                     </radialGradient>
                     <linearGradient
                       id="polyGrad"
                       x1="120"
                       y1="190"
                       x2="200"
                       y2="190"
                       gradientUnits="userSpaceOnUse"
                     >
                       <stop stopColor="#fff" stopOpacity="0.3" />
                       <stop offset="1" stopColor="#fff" stopOpacity="0.08" />
                     </linearGradient>
                   </defs>
                 </svg>
               </div>
             </div>
           </div>
         </div>
       </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-info-light">
        <div className="w-full max-w-md space-y-8 bg-background-light rounded-2xl shadow-xl p-8 border border-border-light">
          <div>
            <h1 className="text-3xl font-bold text-text">Sign in</h1>
            <p className="mt-2 text-sm text-text-light">
              Access your legal workspace
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === "organization"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-text-light hover:border-border-dark"
              }`}
              onClick={() => handleTabChange("organization")}
            >
              Organization
            </button>
            <button
              className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                activeTab === "individual"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-text-light hover:border-border-dark"
              }`}
              onClick={() => handleTabChange("individual")}
            >
              Individual
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              {activeTab === "organization" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-text-light">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 block w-full px-4 py-3 border border-border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="Enter your email"
                      required
                      disabled={isLoading("LOGGING_IN")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-light">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 block w-full px-4 py-3 border border-border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
                    <label className="block text-sm font-medium text-text-light">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="mt-1 block w-full px-4 py-3 border border-border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="Enter your mobile number"
                      required
                      disabled={isLoading("SENDING_OTP") || isLoading("VERIFYING_OTP")}
                    />
                  </div>

                  {otpSent && (
                    <div>
                      <label className="block text-sm font-medium text-text-light">
                        OTP (Sent to your mobile)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="mt-1 block w-full px-4 py-3 border border-border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
                          className="text-xs text-primary hover:text-primaryDark font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {resendDisabled
                            ? `Resend OTP in ${resendTimer}s`
                            : isLoading("SENDING_OTP")
                            ? "Sending..."
                            : "Resend OTP"}
                        </button>
                        {otp.length > 0 && (
                          <span className="text-xs text-muted">
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
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primaryDark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              <p className="text-sm text-text-light">
                <button 
                  type="button"
                  className="text-primary hover:text-primaryDark font-medium"
                  // onClick={() => router.push(routeConfig.publicRoutes.forgotPassword)}
                >
                  Forgot your password?
                </button>
              </p>
            )}
            <p className="text-sm text-text-light">
              {"Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => router.push(routeConfig.publicRoutes.signup)}
                className="text-primary hover:text-primaryDark font-medium"
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