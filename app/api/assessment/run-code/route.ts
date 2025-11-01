import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export async function POST(request: Request) {
  try {
    const { code, language, testCases } = await request.json();

    const prompt = `You are a code execution engine. Execute the following ${language} code against the provided test cases and return ONLY a JSON array of results.

Code:
\`\`\`${language}
${code}
\`\`\`

Test Cases:
${testCases
  .map(
    (tc: any, idx: number) =>
      `Test ${idx + 1}: Input: ${tc.input}, Expected Output: ${tc.output}`
  )
  .join("\n")}

IMPORTANT: 
1. Execute the code for each test case
2. Compare the actual output with expected output
3. Return ONLY a JSON array in this exact format with no additional text:
[
  {"input": "test input", "output": "expected output", "passed": true/false},
  ...
]

Do not include any explanation, markdown formatting, or additional text. Return ONLY the JSON array.`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let text = response.text || "";

    // Clean up the response - remove markdown code blocks if present
    text = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Parse the JSON response
    let results;
    try {
      results = JSON.parse(text);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      // If parsing fails, return all tests as failed
      results = testCases.map((tc: any) => ({
        input: tc.input,
        output: tc.output,
        passed: false,
      }));
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error running code:", error);
    return NextResponse.json(
      { error: "Failed to execute code" },
      { status: 500 }
    );
  }
}
