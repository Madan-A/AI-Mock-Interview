import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { questions, submittedCodes, language } = await req.json();

    if (!questions || !submittedCodes || !language) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Prepare evaluation prompt
    const evaluationPrompt = `
You are an expert programming evaluator. Evaluate the following coding assessment submissions and provide a detailed score.

**Assessment Details:**
- Programming Language: ${language}
- Number of Questions: ${questions.length}
- Total Possible Score: ${
      questions.length * 100
    } points (100 points per question)

**Evaluation Criteria for Each Question:**
1. Correctness (40 points): Does the solution solve the problem correctly?
2. Code Quality (25 points): Is the code clean, readable, and well-structured?
3. Efficiency (20 points): Is the solution optimized and efficient?
4. Best Practices (15 points): Does it follow language-specific best practices?

${questions
  .map(
    (q: any, idx: number) => `
**Question ${idx + 1}: ${q.title}**
Difficulty: ${q.difficulty}
Description: ${q.description}

Test Cases:
${q.testCases
  .map(
    (tc: any, tcIdx: number) =>
      `Test ${tcIdx + 1}: Input: ${tc.input}, Expected: ${tc.expectedOutput}`
  )
  .join("\n")}

**Submitted Code:**
\`\`\`${language}
${submittedCodes[idx] || "// No code submitted"}
\`\`\`
`
  )
  .join("\n---\n")}

**Instructions:**
1. Evaluate each question based on the criteria above
2. For each question, provide:
   - Score out of 100
   - Brief feedback (2-3 sentences)
   - What was done well
   - What could be improved
3. Calculate the total score

**Respond in JSON format:**
{
  "questions": [
    {
      "questionNumber": 1,
      "score": 85,
      "feedback": "Good solution with correct logic...",
      "strengths": ["Correct implementation", "Clean code"],
      "improvements": ["Could optimize using..."]
    }
  ],
  "totalScore": 170,
  "maxScore": ${questions.length * 100},
  "percentage": 85,
  "overallFeedback": "Overall performance summary..."
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: evaluationPrompt,
    });

    const responseText = response.text || "";

    if (!responseText) {
      throw new Error("Empty response from Gemini");
    }

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse evaluation response");
    }

    const evaluation = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      score: evaluation.totalScore,
      totalScore: evaluation.maxScore,
      percentage: evaluation.percentage,
      feedback: evaluation,
    });
  } catch (error) {
    console.error("Error evaluating code:", error);
    return NextResponse.json(
      { error: "Failed to evaluate code" },
      { status: 500 }
    );
  }
}
