"use client";

import {
  FolderKanban,
  Gavel,
  Settings,
  Clock,
  Users,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigationItems = [
  {
    name: "Project Hub",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    name: "Cases",
    href: "/cases",
    icon: Gavel,
  },
  {
    name: "Pending Reviews",
    href: "/pending-reviews",
    icon: Clock,
  },
  {
    name: "Clients",
    href: "/clients",
    icon: Users,
  },
  {
    name: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
];

export function Navigation() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <nav
      className={`h-full bg-white border-r flex flex-col transition-all duration-300 ${
        isExpanded ? "w-64" : "w-16"
      }`}
    >
      {/* Logo Area */}
      <div className="p-4 flex items-center justify-between">
        {isExpanded ? (
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="text-xl font-semibold text-primary">
                Vakeel<span className=" text-black">Assist</span>
              </div>
            </Link>
          </div>
        ) : (
          <span className="font-semibold text-lg w-full text-center">LP</span>
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          {isExpanded ? "←" : "→"}
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              title={isExpanded ? "" : item.name}
              className={`
                relative flex items-center gap-3 px-4 py-2 mx-2 rounded-md transition-colors
                ${isExpanded ? "" : "justify-center"} 
                ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-600 hover:bg-gray-50"
                }
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {isExpanded && (
                <span className="text-sm font-medium truncate">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* User Profile Area */}
      

      {/* Settings link */}
      <div className="flex justify-center py-4 mt-auto">
        <Link
          href="/settings"
          className="p-3 rounded hover:bg-gray-100 transition-colors"
          title="Settings"
        >
          <Settings className="w-5 h-5 text-gray-600" />
        </Link>
      </div>
    </nav>
  );
}
