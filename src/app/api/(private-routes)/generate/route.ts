import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { text, prompt } = body;
    
    const userContent = text ? `${prompt}:\n\n${text}` : prompt;
    
    // Create streaming response
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a legal document assistant. Respond only with clean, well-formatted plain text. Use the following formatting guidelines:
          - Use ALL CAPS or '##' for headings and section titles.
          - Use line breaks to separate paragraphs clearly.
          - Use bullet points (- or •) for lists.
          - Use **double asterisks** for bold emphasis when needed.
          Do not include any markdown syntax such as \`\`\`, \`html\`, or any code blocks.
Format the response as proper HTML with semantic markup. Use:
- <h1> for the main title
- <h2> for major sections
- <h3> for subsections
- <p> for paragraphs
- <ol> and <ul> for lists
- <strong> for emphasis
- <div> for sections
- Add appropriate classes for styling
          `
                       //"You are a legal document assistant. Create clear and professional legal content."
        },
        {
          role: "user",
          content: userContent
        }
      ],
      stream: true,
      temperature: 0.7,
    });

    // Create a TransformStream for streaming the response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      }
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    return new Response(error.message || 'An error occurred', { status: 500 });
  }
} 