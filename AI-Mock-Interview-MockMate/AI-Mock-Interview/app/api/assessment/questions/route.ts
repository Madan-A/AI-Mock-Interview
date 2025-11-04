import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Question from "@/models/Question";
import fs from "fs/promises";
import path from "path";

export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    try {
      await connectToDatabase();
    } catch (err) {
      // If DB connect fails (local dev without env vars), we'll fallback to
      // using the bundled JSON files under /data/assessment so the UI still
      // works. We don't rethrow here so the rest of the handler can proceed
      // using the local dataset.
      // eslint-disable-next-line no-console
      console.warn("connectToDatabase failed, falling back to local data:", err);
    }
    const url = new URL(request.url);
    const section = url.searchParams.get("section") || "aptitude";

    let results: any[] = [];

    // Prefer DB if connected; otherwise fallback to reading local JSON files.
    const useDb = !!process.env.MONGODB_URI;

    if (useDb) {
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
    } else {
      // Read local data files as a fallback
      const dataDir = path.join(process.cwd(), "data", "assessment");
      if (section === "technical") {
        const files = ["os.json", "dbms.json", "cn.json", "dsa.json"];
        for (const f of files) {
          try {
            const raw = await fs.readFile(path.join(dataDir, f), "utf8");
            const arr = JSON.parse(raw) as any[];
            results.push(...arr);
          } catch (e) {
            // ignore missing files
          }
        }
        // random sample 30
        results = shuffle(results).slice(0, 30);
      } else {
        const files = ["quants.json", "logical.json", "verbal.json"];
        for (const f of files) {
          try {
            const raw = await fs.readFile(path.join(dataDir, f), "utf8");
            const arr = JSON.parse(raw) as any[];
            results.push(...shuffle(arr).slice(0, 10));
          } catch (e) {
            // ignore
          }
        }
      }
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

function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
