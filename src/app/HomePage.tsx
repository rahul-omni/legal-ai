'use client'

import React from 'react'
import SideNav from '../components/SideNav'

const features = [
  { title: 'Document Drafting', description: 'Create and edit legal documents with ease.' },
  { title: 'AI Assistance', description: 'Get AI-powered suggestions and improvements.' },
  { title: 'File Management', description: 'Organize and manage your legal files efficiently.' },
  { title: 'Collaboration', description: 'Work with your team in real-time.' },
  { title: 'Templates', description: 'Access a library of legal document templates.' },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen bg-background text-text">
      <SideNav />
      <div className="ml-64 flex-1 p-8">
        <h1 className="text-3xl font-bold mb-8">Welcome to Legal Drafting App</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="card">
              <h2 className="text-xl font-semibold mb-2">{feature.title}</h2>
              <p className="text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 