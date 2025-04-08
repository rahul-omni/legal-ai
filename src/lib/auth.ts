import { getServerSession } from "next-auth"
import { db } from './db'

// Temporary auth function until we set up NextAuth properly
export async function auth() {
  // Try to find test user or create one
  let user = await db.user.findUnique({
    where: { email: "test@example.com" }
  })

  if (!user) {
    user = await db.user.create({
      data: {
        name: "Test User",
        email: "test@example.com"
      }
    })
  }

  return user
}

// Later we'll implement proper authentication:
/*
export async function auth() {
  const session = await getServerSession()
  return session?.user
}
*/ 