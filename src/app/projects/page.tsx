'use client'

import { useState, useEffect } from 'react'
import { FolderPlus, Upload, Search, MoreVertical } from 'lucide-react'
import { NewProjectModal } from '@/components/NewProjectModal'

interface Project {
  id: string;
  name: string;
  createdAt: string;
  files: number;
  lastModified: string;
}

export default function ProjectHub() {
  const [projects, setProjects] = useState<Project[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)

  // Load projects on mount
  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (!response.ok) throw new Error('Failed to fetch projects')
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error('Failed to load projects:', error)
      // Show error toast
    }
  }

  const handleCreateProject = async (name: string, description: string) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Server error:', errorData)
        throw new Error(errorData.error || 'Failed to create project')
      }
      
      await loadProjects() // Reload projects after creation
      setIsNewProjectModalOpen(false)
    } catch (error) {
      console.error('Failed to create project:', error)
      // Show error toast or alert
      alert(error instanceof Error ? error.message : 'Failed to create project')
    }
  }

  return (
    <>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="border-b bg-white">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-gray-800">Project Hub</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your legal projects and documents</p>
          </div>
        </header>

        {/* Toolbar */}
        <div className="border-b bg-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsNewProjectModalOpen(true)}
              className="px-3 py-1.5 bg-gray-900 text-white rounded-md flex items-center gap-2 hover:bg-gray-800 transition-colors text-sm"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              New Project
            </button>
            <button className="px-3 py-1.5 border border-gray-200 rounded-md flex items-center gap-2 hover:bg-gray-50 transition-colors text-sm">
              <Upload className="w-3.5 h-3.5" />
              Upload Files
            </button>
          </div>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400"
            />
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderPlus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No projects yet</h3>
              <p className="text-gray-500 mb-4">Create your first project to get started</p>
              <button 
                onClick={() => setIsNewProjectModalOpen(true)}
                className="px-3 py-1.5 bg-gray-900 text-white rounded-md flex items-center gap-2 hover:bg-gray-800 transition-colors text-sm mx-auto"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                New Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div key={project.id} className="border border-gray-200 rounded-lg bg-white p-4 hover:shadow-md transition-all hover:border-gray-300">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {project.files} files · Last modified {project.lastModified}
                      </p>
                    </div>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </>
  )
} 