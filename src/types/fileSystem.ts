
export type FileSystemNodeProps = {
  id: string
  name: string
  type: 'FILE' | 'FOLDER'
  content?: string
  parentId?: string
  isExpanded?: boolean
  userId: string
  createdAt: Date
  updatedAt: Date
  children?: FileSystemNodeProps[] // For frontend use
}