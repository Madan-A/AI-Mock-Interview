import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Question from "@/models/Question";

export const revalidate = 0;

export async function GET() {
  try {
    await connectToDatabase();

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

    const data = [...quants, ...logical, ...verbal].map(
      (q: any, idx: number) => ({
        id: String(q._id),
        index: idx,
        category: q.category,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
      })
    );

    return NextResponse.json({ questions: data });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch assessment questions" },
      { status: 500 }
    );
  }
}
