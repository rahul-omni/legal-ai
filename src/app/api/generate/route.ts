import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key not found');
    return NextResponse.json({ 
      error: "Server configuration error" 
    }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { text, prompt } = body;
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ 
        error: `Invalid or missing text. Received: ${typeof text}` 
      }, { status: 400 });
    }

<<<<<<< HEAD
=======
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ 
        error: `Invalid or missing prompt. Received: ${typeof prompt}` 
      }, { status: 400 });
    }

>>>>>>> 00613f9186d6c959b7499dd9ae8159274b6e58c0
    // Check if this is a chronology request
    const isChronologyRequest = prompt.toLowerCase().includes('chronology');
    
    const systemPrompt = isChronologyRequest 
      ? "You are a legal assistant that creates detailed chronologies from case documents. Format the output as a markdown table with | Date | Event | Significance | columns. Be comprehensive and precise with dates."
      : "You are a legal document assistant. Create clear and professional legal content.";

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `${prompt}:\n\n${text}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const summary = completion.choices[0].message.content;
    
    if (!summary) {
      throw new Error('No content generated');
    }

    return NextResponse.json({ summary });

  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json({ 
      error: "Failed to generate content: " + (error as Error).message 
    }, { status: 500 });
  }
} 