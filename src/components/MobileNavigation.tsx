"use client";

import {
  FolderKanban,
  Gavel,
  Settings,
  Clock,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  {
    name: "Cases",
    href: "/cases",
    icon: Gavel,
    id: 'cases'
  },
  {
    name: "Projects",
    href: "/projects",
    icon: FolderKanban,
    id: 'projecthub'
  },
  {
    name: "Reviews",
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

export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 md:hidden safe-area-pb">
      <div className="flex items-center justify-around py-2 px-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (pathname.includes(item.href) && item.href !== "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-0 flex-1 mx-1
                ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-gray-600 hover:text-gray-800"
                }
              `}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium truncate max-w-full">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
