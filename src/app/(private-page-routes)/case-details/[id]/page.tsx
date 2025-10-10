"use client";

import { CaseDetails } from "@/components/CaseDetails";
import { useParams } from "next/navigation";

export default function CaseDetailsPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <main className="flex-1">
      <CaseDetails id={id as string} />
    </main>
  );
} 