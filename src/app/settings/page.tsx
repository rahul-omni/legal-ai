"use client";

import { Navigation } from "@/components/Navigation";
import { Settings } from "@/components/settings/Settings";

export default function SettingsPage() {
  return (
    <div className="h-screen flex">
      <Navigation />
      <main className="flex-1">
        <Settings />
      </main>
    </div>
  );
} 