"use client";
import { login } from "@/app/apiServices/authServices";
import { loadingContext } from "@/context/loadingContext";
import { userContext } from "@/context/userContext";
import { routeConfig } from "@/lib/routeConfig";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { dispatchUser } = userContext();
  const { startLoading, stopLoading, isLoading } = loadingContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      startLoading("LOGGING_IN");
      const { token, user } = await login({ email, password });
      dispatchUser({
        type: "LOGIN_USER",
        payload: { user, token },
      });
      router.push(routeConfig.privateRoutes[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      stopLoading("LOGGING_IN");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 mt-10">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        <button
          type="submit"
          disabled={isLoading("LOGGING_IN")}
          className="w-full bg-primary text-white py-2 rounded hover:bg-primaryDark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading("LOGGING_IN") ? (
            <span>Loading...</span>
          ) : (
            <span>Login</span>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm">
          Don't have an account?{" "}
          <button
            onClick={() => router.push(routeConfig.publicRoutes[1])} // Assuming the signup page is the second public route
            className="text-primary hover:underline"
          >
            Sign up here
          </button>
        </p>
      </div>
    </div>
  );
}
