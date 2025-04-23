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
    <div className="bg-white p-8 rounded shadow-md w-full h-screen">
      {children}
    </div>
  );
}
