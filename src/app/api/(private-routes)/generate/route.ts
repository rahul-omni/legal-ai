import OpenAI from "openai";
import { NextResponse } from "next/server";
import { fileSystemNodeService } from "../../services/fileSystemNodeService";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { text, prompt, files } = body;
    const newText = await fileSystemNodeService.getConcatenatedContentByIds(files);

    const userContent = files.length ? `${prompt}:\n\n${newText}` : text ? `${prompt}:\n\n${text}` : prompt;

    // Create streaming response
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a legal document assistant. Respond in legal language and be a little elaborate in your answers.`
        },
        {
          role: "user",
          content: userContent,
        },
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
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    return new Response(error.message || "An error occurred", { status: 500 });
  }
}
