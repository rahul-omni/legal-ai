import { LoadingProvider } from "@/context/loadingContext";
import { Metadata } from "next";
import React from "react";
import "../../globals.css";


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
    <html lang="en" suppressHydrationWarning>
      <body className="flex">
        <LoadingProvider>
          <div className="bg-white p-8 rounded shadow-md w-full h-screen">
            {children}
          </div>
        </LoadingProvider>
      </body>
    </html>
  );
}
