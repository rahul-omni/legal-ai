import type { NextApiRequest, NextApiResponse } from 'next'
import { signIn } from '@/auth'
 
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { email, password } = req.body
    await signIn('credentials', { email, password })
 
    res.status(200).json({ success: true })
  } catch (error) {
    // if (error.type === 'CredentialsSignin') {
    //   res.status(401).json({ error: 'Invalid credentials.' })
    // } else {
    //   res.status(500).json({ error: 'Something went wrong.' })
    // }
  }
}