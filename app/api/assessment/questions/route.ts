import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Question from "@/models/Question";

export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const url = new URL(request.url);
    const section = url.searchParams.get("section") || "aptitude";

    let results: any[] = [];
    if (section === "technical") {
      results = await Question.aggregate([
        { $match: { category: { $in: ["os", "dbms", "cn", "dsa"] } } },
        { $sample: { size: 30 } },
      ]);
    } else {
      const [quants, logical, verbal] = await Promise.all([
        Question.aggregate([
          { $match: { category: "quants" } },
          { $sample: { size: 10 } },
        ]),
        Question.aggregate([
          { $match: { category: "logical" } },
          { $sample: { size: 10 } },
        ]),
        Question.aggregate([
          { $match: { category: "verbal" } },
          { $sample: { size: 10 } },
        ]),
      ]);
      results = [...quants, ...logical, ...verbal];
    }

    const data = results.map((q: any, idx: number) => ({
      id: String(q._id),
      index: idx,
      category: q.category,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
    }));

    return NextResponse.json({ questions: data });
  } catch (error) {
    console.error("/api/assessment/questions error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch assessment questions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
