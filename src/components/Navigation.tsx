"use client";

import {
  FolderKanban,
  Gavel,
  Settings,
  Clock,
  Users,
  Bell,
  ListChecks,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import VakeelAssistLogo from "./svg/VakeelAssistLogo";
import VakeelAssistLogoIcon from "./svg/VakeelAssistLogoIcon";

const navigationItems = [
  {
    name: "Cases",
    href: "/cases",
    icon: Gavel,
    id: 'cases'
  },
  {
    name: "Calendar",
    href: "/calendar",
    icon: ListChecks,
    id: 'calendar'
  },
  {
    name: "Project Hub",
    href: "/projects",
    icon: FolderKanban,
    id: 'projecthub'
  },
  {
    name: "Pending Reviews",
    href: "/pending-reviews",
    icon: Clock,
    id: 'pendingreviews'
  },
  {
    name: "Clients",
    href: "/clients",
    icon: Users,
    id: 'clients'
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    id: 'settings'
  },
];

export function Navigation() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <nav
      className={`h-full bg-white border-r flex-col transition-all duration-300 hidden md:flex ${
        isExpanded ? "w-64" : "w-16"
      }`}
    >
      {/* Logo Area */}
      <div className={`py-4 flex items-center justify-between ${isExpanded ? "px-4" : "px-1"}`}>
        {isExpanded ? (
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <VakeelAssistLogo width={149} height={26} />
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <VakeelAssistLogoIcon width={22} height={19} />
          </div>
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <Menu />
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (pathname.includes(item.href) && item.href !== "/")  ;
          const Icon = item.icon;

          return (
            <Link
              id={item.id || item.name}
              key={item.name}
              href={item.href}
              title={isExpanded ? "" : item.name}
              className={`
                relative flex items-center gap-3 px-4 py-3 rounded-none transition-colors
                ${isExpanded ? "" : "justify-center"} 
                ${
                  isActive
                    ? "bg-primary text-white"
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
      

      
    </nav>
  );
}
