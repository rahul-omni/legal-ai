"use client";

import { ClientManagement } from "@/components/ClientManagement";
import { Navigation } from "@/components/Navigation";

export default function ClientsPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Navigation />
      <main className="flex-1 overflow-auto">
        <ClientManagement />
      </main>
    </div>
  );
} 