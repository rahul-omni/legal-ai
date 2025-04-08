import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Validation schema for project creation
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional()
})

export async function POST(req: Request) {
  try {
    // Get authenticated user
    const user = await auth()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Log the request body
    const body = await req.json()
    console.log('Request body:', body)

    // Validate request body
    const validatedData = createProjectSchema.parse(body)
    console.log('Validated data:', validatedData)

    // Create project with more detailed error handling
    try {
      const project = await db.project.create({
        data: {
          name: validatedData.name,
          description: validatedData.description || '',
          userId: user.id,
          createdAt: new Date(),
          lastModified: new Date()
        }
      })
      console.log('Created project:', project)
      return NextResponse.json(project)
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Database error', details: dbError },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Project creation error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid project data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create project', details: error },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    // Get authenticated user
    const user = await auth()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's projects
    const projects = await db.project.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: { files: true }
        }
      }
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Project fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
} 