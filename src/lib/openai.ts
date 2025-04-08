import OpenAI from 'openai'

// Create a single instance of the OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) 