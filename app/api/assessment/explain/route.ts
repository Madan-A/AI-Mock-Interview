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
    }.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const explanation = response.text;

    return NextResponse.json({ explanation });
  } catch (error: any) {
    console.error("Error generating explanation:", error);
    return NextResponse.json(
      { error: "Failed to generate explanation", details: error.message },
      { status: 500 }
    );
  }
}
