import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, correctAnswer, userAnswer, options } = body;

    if (!question || !correctAnswer) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Build the prompt for Gemini
    // We ask Gemini to return ONLY a JSON object with explanation and two reference URLs.
    const prompt = `You are a helpful tutor. Explain the following question and answer in 3-5 simple sentences that anyone can understand.

Question: ${question}

Options:
${options.map((opt: string, idx: number) => `${idx + 1}. ${opt}`).join("\n")}

Correct Answer: ${correctAnswer}
${
  userAnswer && userAnswer !== correctAnswer
    ? `User's Answer: ${userAnswer}`
    : ""
}

Provide a clear, concise explanation of why the correct answer is right${
      userAnswer && userAnswer !== correctAnswer
        ? " and why the user's answer was incorrect"
        : ""
    }.

IMPORTANT: Return ONLY a valid JSON object (no markdown, no extra text) with two fields:
{
  "explanation": "<explanation text>",
  "references": ["https://...", "https://..."]
}

The "references" array should contain two high-quality links (official docs, Wikipedia, authoritative tutorials) that relate to the topic in the question.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let text = response.text || "";
    // Clean up any fences
    text = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      // If parsing fails, fall back to sending the raw text as explanation and no links
      return NextResponse.json({ explanation: text, references: [] });
    }

    const explanation = parsed.explanation || parsed.text || "";
    const references = Array.isArray(parsed.references)
      ? parsed.references
      : [];

    return NextResponse.json({ explanation, references });
  } catch (error: any) {
    console.error("Error generating explanation:", error);
    return NextResponse.json(
      { error: "Failed to generate explanation", details: error.message },
      { status: 500 }
    );
  }
}
