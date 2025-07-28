import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
    }

    // Replace this with your actual external API URL
    const externalApiUrl = `${process.env.RAG_BACKEND}/query`;

    const externalRes = await fetch(externalApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!externalRes.ok) {
      throw new Error(`External API failed with status ${externalRes.status}`);
    }

    const results = await externalRes.json();

    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    console.error("Error calling external API:", error);
    return NextResponse.json({ error: "Failed to fetch search results" }, { status: 500 });
  }
}
