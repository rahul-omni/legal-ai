import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { content } = await request.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        {
          role: "system",
          content: `You are a legal risk analysis expert. Analyze the content for potential risks including:
          - Unfavorable terms
          - Missing clauses
          - Ambiguous language
          - Liability issues
          - Compliance risks
          - Payment terms risks
          - Termination clause issues
          
          Return the analysis in JSON format with the following structure:
          {
            "risks": [
          {
              "severity": "high",
              "category": "category name",
              "description": "detailed description",
              "clause": "relevant text",
              "location": {"start": number, "end": number},
              "recommendation": "how to fix"
            },
          {
              "severity": "medium",
              "category": "category name",
              "description": "detailed description",
              "clause": "relevant text",
              "location": {"start": number, "end": number},
              "recommendation": "how to fix"
            },
          {
              "severity": "low",
              "category": "category name",
              "description": "detailed description",
              "clause": "relevant text",
              "location": {"start": number, "end": number},
              "recommendation": "how to fix"
            }
]
          }`,
        },
        {
          role: "user",
          content: content,
        },
      ],
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(
      completion.choices[0].message.content || '{"risks": []}'
    );
    return NextResponse.json(analysis.risks);
  } catch (error) {
    console.error("Risk analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze risks" },
      { status: 500 }
    );
  }
}
