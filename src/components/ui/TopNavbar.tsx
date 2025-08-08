"use client";

import React from 'react';
import { User, Bell, Search } from 'lucide-react';
import Link from 'next/link';

export interface TopNavbarProps {
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
  onLogout?: () => void;
  showSearch?: boolean;
  className?: string;
}

export function TopNavbar({ 
  user, 
  className = '' 
}: TopNavbarProps) {
  return (
    <nav className={`bg-white border-b border-border shadow-sm ${className}`}>
      <div className="px-6 py-1 flex justify-end">
        <div className="flex items-center justify-between">
          

          <div className="flex items-center gap-4">
            <button className="p-2 text-muted hover:text-text hover:bg-background rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
            </button>

            <Link
              href="/settings"
              className="flex items-center gap-2 text-sm text-text hover:bg-background rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || 'User'}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <span className="font-medium">My Account</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 