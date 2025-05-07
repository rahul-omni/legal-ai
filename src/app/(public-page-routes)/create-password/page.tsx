"use client";
import { CreatePasswordForm } from "@/components/auth/CreatePasswordForm";
import { useSearchParams } from "next/navigation";

export default function CreatePassword() {
  const email = useSearchParams().get("email") ?? "";

  return <CreatePasswordForm email={email} />;
}
