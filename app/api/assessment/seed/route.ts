import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Question from "@/models/Question";
import fs from "fs";
import path from "path";

function tryLoadJsonCategory(category: "quants" | "logical" | "verbal") {
  const filePath = path.join(
    process.cwd(),
    "data",
    "assessment",
    `${category}.json`
  );
  if (!fs.existsSync(filePath))
    return [] as Array<{
      category: string;
      question: string;
      options: string[];
      correctAnswer: string;
    }>;
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(
      (q: any) =>
        q &&
        q.category === category &&
        typeof q.question === "string" &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        typeof q.correctAnswer === "string"
    );
  } catch {
    return [];
  }
}

export async function POST() {
  try {
    await connectToDatabase();

    const quants = tryLoadJsonCategory("quants");
    const logical = tryLoadJsonCategory("logical");
    const verbal = tryLoadJsonCategory("verbal");
    const data = [...quants, ...logical, ...verbal];

    if (data.length === 0) {
      return NextResponse.json(
        { error: "No valid questions found in data/assessment/*.json" },
        { status: 400 }
      );
    }

    await Question.deleteMany({});
    const inserted = await Question.insertMany(data);

    return NextResponse.json({
      message: "Seeded questions from JSON",
      count: inserted.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to seed questions" },
      { status: 500 }
    );
  }
}
