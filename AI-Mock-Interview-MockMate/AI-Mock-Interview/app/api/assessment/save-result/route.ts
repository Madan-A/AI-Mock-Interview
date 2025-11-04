import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { saveAssessmentResult } from "@/lib/actions/dashboard.action";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { score, total, attempted, section } = body;

    const assessment = {
      score,
      total,
      attempted,
      section: section || "general",
      completedAt: Date.now(),
    };

    const result = await saveAssessmentResult(user.id, assessment);

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to save assessment result" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving assessment result:", error);
    return NextResponse.json(
      { error: "Failed to save assessment result" },
      { status: 500 }
    );
  }
}
