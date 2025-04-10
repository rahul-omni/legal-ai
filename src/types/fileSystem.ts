
export type FileSystemNode = {
  id: string
  name: string
  type: 'FILE' | 'FOLDER'
  content?: string
  parentId?: string
  isExpanded?: boolean
  userId: string
  createdAt: Date
  updatedAt: Date
  children?: FileSystemNode[] // For frontend use
}