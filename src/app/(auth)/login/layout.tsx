import { LoadingProvider } from "@/context/loadingContext";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LoadingProvider>
      <div className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        {children}
      </div>
    </LoadingProvider>
  );
}
