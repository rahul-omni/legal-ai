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
    console.log("📦 Request body received:", body);
    const { text, prompt } = body;
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ 
        error: `Invalid or missing text. Received: ${typeof text}` 
      }, { status: 400 });
    }
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ 
        error: `Invalid or missing prompt. Received: ${typeof prompt}` 
      }, { status: 400 });
    }

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

    //const summary = completion.choices[0].message.content?.trim()
    
    // if (!summary) {
    //   throw new Error('No content generated');
    // }


    const rawSummary = completion.choices?.[0]?.message?.content?.trim() || "";
    console.log("🧠 OpenAI Response:", completion.choices?.[0]?.message?.content);

if (!rawSummary || rawSummary === "" || rawSummary === "\n") {
  console.warn("⚠️ Model returned empty or useless output");
  return new Response("Model returned no usable content", { status: 500 });
}

    // return NextResponse.json({ summary });
    return new Response(rawSummary, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8"
      }
    });

  }catch (error: any) {
    console.error('❌ OpenAI API error:', error?.message || error);
  
    return new Response(
      "Something went wrong while processing files.\n\n" +
      (error?.message || JSON.stringify(error)),
      {
        status: 500,
        headers: {
          "Content-Type": "text/plain; charset=utf-8"
        }
      }
    );
  }
  
  
  // catch (error:any) {
  //   console.error('OpenAI API error:', error);
  //   return NextResponse.json({ 
  //     error: "Failed to generate content: " + (error as Error).message 
  //   }, { status: 500 });
  // }
 
} 