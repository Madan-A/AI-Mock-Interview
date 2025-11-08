import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const section = url.searchParams.get("section") || "aptitude";
    const page = Number(url.searchParams.get("page") || "1");
    const perPage = Number(url.searchParams.get("perPage") || "5");
    const sessionId = url.searchParams.get("sessionId") || "";

    let prompt = "";
    let total = 30;

    // Add timestamp and random seed for variation
    const seed = `${sessionId}-${page}-${Date.now()}-${Math.random()}`;

    if (section === "technical") {
      // Technical: os, dbms, cn, dsa - 30 total questions
      prompt = `Generate ${perPage} UNIQUE technical multiple-choice questions for a job interview assessment.

IMPORTANT: Generate completely NEW questions. Do NOT repeat common or typical interview questions. Be creative and unique.

Seed for uniqueness: ${seed}

Mix questions across these categories (aim for even distribution):
- Operating Systems (OS) - process management, memory, scheduling, file systems
- Database Management Systems (DBMS) - SQL, normalization, transactions, indexing
- Computer Networks (CN) - protocols, OSI model, TCP/IP, routing
- Data Structures & Algorithms (DSA) - arrays, trees, graphs, sorting, searching

Requirements:
- Each question must have exactly 4 options (A, B, C, D)
- Only ONE option should be correct
- Questions should be clear and professional
- Mix of easy, medium difficulty
- Make questions UNIQUE and VARIED - avoid typical questions
- No special characters that break JSON
- Use real-world scenarios when possible

Return ONLY a valid JSON array (no markdown, no extra text):

[
  {
    "id": "${seed}-1",
    "category": "os",
    "question": "Your unique question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A"
  }
]

Generate exactly ${perPage} questions. Make them DIFFERENT from standard interview questions.`;
    } else {
      // Aptitude: quants, logical, verbal - 30 total questions
      prompt = `Generate ${perPage} UNIQUE aptitude multiple-choice questions for a job interview assessment.

IMPORTANT: Generate completely NEW questions. Do NOT repeat common or typical questions. Be creative and unique.

Seed for uniqueness: ${seed}

Mix questions across these categories (aim for even distribution):
- Quantitative (quants) - arithmetic, algebra, percentages, profit/loss, time/distance, probability
- Logical Reasoning (logical) - patterns, sequences, analogies, puzzles, blood relations, coding-decoding
- Verbal Reasoning (verbal) - synonyms, antonyms, sentence completion, reading comprehension, error detection

Requirements:
- Each question must have exactly 4 options (A, B, C, D)
- Only ONE option should be correct
- Questions should be clear and professional
- Mix of easy, medium difficulty
- Make questions UNIQUE and VARIED - avoid typical questions
- No special characters that break JSON
- Use interesting scenarios and contexts

Return ONLY a valid JSON array (no markdown, no extra text):

[
  {
    "id": "${seed}-1",
    "category": "quants",
    "question": "Your unique question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A"
  }
]

Generate exactly ${perPage} questions. Make them DIFFERENT and CREATIVE.`;
    }

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let text = response.text || "";

    // Clean up response
    text = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Parse JSON
    let generatedQuestions = [];
    try {
      generatedQuestions = JSON.parse(text);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      throw new Error("Failed to parse questions from Gemini");
    }

    // Normalize questions format
    const questions = generatedQuestions.map((q: any, idx: number) => ({
      id: q.id || `${sessionId}-${page}-${idx}`,
      index: (page - 1) * perPage + idx,
      category: q.category || "general",
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
    }));

    return NextResponse.json({
      questions,
      total,
      generated: true,
    });
  } catch (error: any) {
    console.error("Error generating questions with Gemini:", error);

    // Fallback: return empty array with error info
    return NextResponse.json(
      {
        error: "Failed to generate questions",
        message: error.message,
        questions: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}
