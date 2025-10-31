import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Process file using Gemini with inline data
async function processFileWithGemini(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  try {
    const base64Data = buffer.toString("base64");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            {
              text: "Extract all text content from this resume/document. Return only the extracted text without any additional commentary or formatting.",
            },
          ],
        },
      ],
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error processing file with Gemini:", error);
    throw new Error("Failed to process file");
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Get file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text using Gemini's native file processing
    let resumeText = "";

    if (file.type === "application/pdf" || file.type.startsWith("image/")) {
      resumeText = await processFileWithGemini(buffer, file.type);
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF or PNG/JPG" },
        { status: 400 }
      );
    }

    if (!resumeText || resumeText.length < 50) {
      return NextResponse.json(
        {
          error:
            "Could not extract enough text from the file. Please ensure the file contains readable text.",
        },
        { status: 400 }
      );
    }

    // Generate AI feedback using Gemini
    const prompt = `You are a professional resume reviewer and career consultant. Analyze the following resume and provide constructive feedback and suggestions for improvement.

Resume Content:
${resumeText}

Please provide:
1. Overall Assessment (2-3 sentences)
2. Key Strengths (3-4 bullet points)
3. Areas for Improvement (3-4 bullet points with specific suggestions)
4. Formatting & Structure recommendations (2-3 points)
5. Content & Impact suggestions (2-3 points)
6. Final recommendation

Keep your feedback constructive, professional, and actionable. Format your response in a clear, easy-to-read structure.`;

    const feedbackResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let feedback = feedbackResponse.text || "";

    // Clean up the response - remove markdown code blocks and extra formatting
    feedback = feedback
      .replace(/```markdown\n?/g, "") // Remove markdown code block opening
      .replace(/```\n?/g, "") // Remove code block closing
      .replace(/\*\*/g, "") // Remove bold markers
      .replace(/~~(.+?)~~/g, "$1") // Remove strikethrough
      .replace(/^#+\s/gm, "") // Remove markdown headers
      .trim();

    return NextResponse.json({ feedback });
  } catch (error: any) {
    console.error("Error reviewing resume:", error);
    return NextResponse.json(
      { error: "Failed to review resume", details: error.message },
      { status: 500 }
    );
  }
}
