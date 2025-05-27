"use client";
import { login } from "@/app/apiServices/authServices";
import { useLoadingContext } from "@/context/loadingContext";
import { routeConfig } from "@/lib/routeConfig";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { startLoading, stopLoading, isLoading } = useLoadingContext();
  const emailParam = useSearchParams().get("email") || "";
  const redirectedFromParam = useSearchParams().get("from") || "";

  useEffect(() => {
    if (!emailParam) return;
    setEmail(emailParam);

    if (redirectedFromParam !== routeConfig.publicRoutes.signup) return;
    toast("Please verify your email before logging in", { icon: "ℹ️" });
  }, [emailParam, redirectedFromParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      startLoading("LOGGING_IN");
      const loggedIn = await login({ email, password });
      if (!loggedIn.success) return;
      router.push(routeConfig.privateRoutes.projects);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      stopLoading("LOGGING_IN");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 mt-10 bg-white shadow-md rounded-lg">
      <h1 className="text-3xl font-bold mb-4 text-center text-gray-800">
        Login
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter your email"
            required
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter your password"
            required
          />
        </div>

        {error && <p className="text-red-500 text-center">{error}</p>}

        <button
          type="submit"
          disabled={isLoading("LOGGING_IN")}
          className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primaryDark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading("LOGGING_IN") ? (
            <span>Loading...</span>
          ) : (
            <span>Login</span>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Forgot your password?{" "}
          <button
            // TODO: uncomment this when the route is ready
            // onClick={() => router.push(routeConfig.publicRoutes.forgotPassword)}
            className="text-primary hover:underline"
          >
            Reset it here
          </button>
        </p>
        <p className="text-sm text-gray-600 mt-4">
          {`Don't have an account?`}{" "}
          <button
            onClick={() => router.push(routeConfig.publicRoutes.signup)}
            className="text-primary hover:underline"
          >
            Sign up here
          </button>
        </p>
      </div>
    </div>
  );
}
