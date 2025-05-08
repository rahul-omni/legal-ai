"use client";

import { PendingReviews } from "@/components/PendingReviews";
import { Navigation } from "@/components/Navigation";

export default function PendingReviewsPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Navigation />
      <main className="flex-1 overflow-auto p-4">
        <PendingReviews />
      </main>
    </div>
  );
} 