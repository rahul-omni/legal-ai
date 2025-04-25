"use client";

import { userContext } from "@/context/userContext";
import { routeConfig } from "@/lib/routeConfig";
import {
  BarChart2,
  ClipboardCheck,
  FileStack,
  FileText,
  FolderKanban,
  Gavel,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const navigationItems = [
  {
    name: "Editor",
    href: "/editor",
    icon: FileText,
  },
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
    name: "Analytics",
    href: "/analytics",
    icon: BarChart2,
  },
  {
    name: "Document Assembly",
    href: "/assembly",
    icon: FileStack,
  },
  {
    name: "Due Diligence",
    href: "/due-diligence",
    icon: ClipboardCheck,
  },
];

export function Navigation() {
  const { dispatchUser } = userContext();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    dispatchUser({ type: "LOGOUT_USER" });
    router.push(routeConfig.publicRoutes.login);
  };

  return (
    <nav
      className={`h-screen bg-white border-r flex flex-col transition-all duration-300 ${
        isExpanded ? "w-64" : "w-16"
      }`}
    >
      {/* Logo Area */}
      <div className="p-4 border-b flex items-center justify-between">
        {isExpanded ? (
          <span className="font-semibold text-lg">Legal Platform</span>
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
      <div className="p-4 border-t space-y-2">
        <div
          className={`flex items-start gap-3 ${
            isExpanded ? "" : "justify-center"
          }`}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
            <button className="text-sm " onClick={handleLogout}>
              Logout
            </button>
          </div>
          {isExpanded && (
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">John Doe</div>
              <div className="text-xs text-gray-500 truncate">
                john@example.com
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
