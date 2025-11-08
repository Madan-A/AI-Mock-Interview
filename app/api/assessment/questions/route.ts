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
      console.warn(
        "connectToDatabase failed, falling back to local data:",
        err
      );
    }
    const url = new URL(request.url);
    const section = url.searchParams.get("section") || "aptitude";
    const page = Number(url.searchParams.get("page") || "1");
    const perPage = Number(url.searchParams.get("perPage") || "5");
    const sessionId = url.searchParams.get("sessionId") || "";

    let results: any[] = [];

    // Prefer DB if connected; otherwise fallback to reading local JSON files.
    const useDb = !!process.env.MONGODB_URI;

    if (useDb) {
      if (section === "technical") {
        // For technical: prefer 7 from each technical category, then add extras to reach 30
        const categories = ["os", "dbms", "cn", "dsa"];
        const perCat = 7;
        const picks: any[] = [];
        for (const cat of categories) {
          const docs = await Question.aggregate([
            { $match: { category: cat } },
            { $sample: { size: perCat } },
          ]);
          picks.push(...docs);
        }
        // If we still need more to reach 30, sample from the whole technical pool excluding already picked ids
        if (picks.length < 30) {
          const pickedIds = picks.map((p) => String(p._id));
          const extras = await Question.aggregate([
            {
              $match: {
                category: { $in: categories },
                _id: { $nin: pickedIds },
              },
            },
            { $sample: { size: 30 - picks.length } },
          ]);
          picks.push(...extras);
        }
        results = picks.slice(0, 30);
      } else {
        // Aptitude: 10 each from quants, logical, verbal
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
        const perCat = 7;
        for (const f of files) {
          try {
            const raw = await fs.readFile(path.join(dataDir, f), "utf8");
            const arr = JSON.parse(raw) as any[];
            results.push(...shuffle(arr).slice(0, perCat));
          } catch (e) {
            // ignore missing files
          }
        }
        // Fill extras if less than 30
        if (results.length < 30) {
          // gather all technical questions, exclude current picks
          let pool: any[] = [];
          for (const f of files) {
            try {
              const raw = await fs.readFile(path.join(dataDir, f), "utf8");
              const arr = JSON.parse(raw) as any[];
              pool.push(...arr);
            } catch (e) {}
          }
          const picked = new Set(results.map((r) => r.question));
          const extras = shuffle(pool).filter((p) => !picked.has(p.question));
          results.push(...extras.slice(0, 30 - results.length));
        }
        results = results.slice(0, 30);
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
    // Map results into normalized objects
    const normalized = results.map((q: any, idx: number) => ({
      id: q._id ? String(q._id) : String(q.id || idx),
      index: idx,
      category: q.category,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
    }));

    // Deterministic shuffle when sessionId provided, otherwise pseudo-random shuffle
    const list = sessionId
      ? seededShuffle([...normalized], sessionId)
      : shuffle([...normalized]);

    const total = list.length;
    const start = (Math.max(1, page) - 1) * Math.max(1, perPage);
    const paged = list.slice(start, start + Math.max(1, perPage));

    return NextResponse.json({ questions: paged, total });
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

// Deterministic seeded shuffle - converts a string seed to a number and uses a PRNG
function seededShuffle<T>(arr: T[], seedStr: string) {
  const seed = cyrb128(seedStr).reduce((a, b) => (a + b) >>> 0, 0);
  const rand = mulberry32(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function cyrb128(str: string) {
  let h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
