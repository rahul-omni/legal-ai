'use client'

import React from 'react'
import SideNav from '@/components/SideNav'
import { LegalTemplates } from '@/components/LegalTemplates'

export default function TemplatesPage() {
  const handleSelectTemplate = (content: string) => {
    // In a real app, this would create a new document or redirect to editor
    console.log('Template selected:', content.substring(0, 50) + '...')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SideNav />
      <div className="ml-64 flex-1 flex flex-col">
        <div className="bg-white border-b p-6">
          <h1 className="text-2xl font-bold">Legal Templates</h1>
          <p className="text-gray-600 mt-2">
            Browse our collection of professionally drafted legal templates
          </p>
        </div>
        
        <div className="flex-1">
          <LegalTemplates onSelectTemplate={handleSelectTemplate} />
        </div>
      </div>
    </div>
  )
} 