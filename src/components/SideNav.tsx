'use client'

import React, { useState } from 'react'
import { ChevronRight, ChevronDown, FileText, Home, Settings, Users, BookOpen, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SideNav() {
  const [isOpen, setIsOpen] = useState(true)
  const pathname = usePathname()

  const navItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: FileText, label: 'Document Drafting', href: '/drafting' },
    { icon: BookOpen, label: 'Templates', href: '/templates' },
    { icon: Users, label: 'Collaboration', href: '/collaboration' },
    { icon: Settings, label: 'Settings', href: '/settings' },
    { icon: HelpCircle, label: 'Help & Support', href: '/help' },
  ]

  return (
    <div className="h-screen fixed left-0 top-0 bg-[#1E293B] text-white w-64 flex flex-col shadow-lg">
      {/* Logo and App Name */}
      <div className="p-5 border-b border-gray-700 flex items-center">
        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
        </div>
        <h1 className="text-xl font-bold">LegalDraft</h1>
      </div>

      {/* Navigation Toggle */}
      <div className="p-4 flex items-center justify-between border-b border-gray-700">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Navigation</h2>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded-md hover:bg-gray-700 transition-colors"
        >
          {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Navigation Items */}
      {isOpen && (
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-primary text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                  `}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}

      {/* User Profile */}
      <div className="p-4 border-t border-gray-700 mt-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-sm font-medium">JD</span>
          </div>
          <div>
            <p className="text-sm font-medium">John Doe</p>
            <p className="text-xs text-gray-400">Premium Plan</p>
          </div>
        </div>
      </div>
    </div>
  )
} 