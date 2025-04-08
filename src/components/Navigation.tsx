'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  FileText, 
  FolderKanban, 
  BarChart2, 
  BookOpen, 
  Users, 
  ShieldCheck, 
  FileOutput, 
  MessagesSquare, 
  Store, 
  ClipboardCheck,
  Calendar 
} from 'lucide-react'

const navigationItems = [
  {
    name: 'Document Editor',
    href: '/',
    icon: FileText
  },
  {
    name: 'Project Hub',
    href: '/projects',
    icon: FolderKanban
  },
  {
    name: 'Contract Analytics',
    href: '/analytics',
    icon: BarChart2
  },
  {
    name: 'Research Center',
    href: '/research',
    icon: BookOpen
  },
  {
    name: 'Client Portal',
    href: '/clients',
    icon: Users
  },
  {
    name: 'Compliance',
    href: '/compliance',
    icon: ShieldCheck
  },
  {
    name: 'Document Assembly',
    href: '/assembly',
    icon: FileOutput
  },
  {
    name: 'Team Collaboration',
    href: '/team',
    icon: MessagesSquare
  },
  {
    name: 'Forms Marketplace',
    href: '/marketplace',
    icon: Store
  },
  {
    name: 'Due Diligence',
    href: '/due-diligence',
    icon: ClipboardCheck
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: Calendar
  }
]

export function Navigation() {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <nav className={`h-screen bg-white border-r flex flex-col transition-all duration-300 ${
      isExpanded ? 'w-64' : 'w-16'
    }`}>
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
          {isExpanded ? '←' : '→'}
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 mx-2 rounded-md transition-colors ${
                isExpanded ? '' : 'justify-center'
              } ${
                isActive 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {isExpanded && (
                <span className="text-sm font-medium truncate">{item.name}</span>
              )}
            </Link>
          )
        })}
      </div>

      {/* User Profile Area */}
      <div className="p-4 border-t">
        <div className={`flex items-center gap-3 ${isExpanded ? '' : 'justify-center'}`}>
          <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
          {isExpanded && (
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">John Doe</div>
              <div className="text-xs text-gray-500 truncate">john@example.com</div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
} 