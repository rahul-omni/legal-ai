import { Spinner } from "@/components/Loader";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<Spinner />}>{children}</Suspense>;
}
