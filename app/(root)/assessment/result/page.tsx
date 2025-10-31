import { getCurrentUser } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";

export default async function AssessmentResultPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
    return null;
  }

  const params = await searchParams;
  const attempted = Number(params.attempted ?? 0);
  const correct = Number(params.correct ?? 0);
  const score = Number(params.score ?? 0);
  const total = Number(params.total ?? 30);

  return (
    <div className="container mx-auto max-w-2xl py-10">
      <h1 className="text-2xl font-semibold mb-6">Assessment Result</h1>
      <div className="grid grid-cols-2 gap-4 p-6 rounded-md border">
        <div>
          <div className="text-sm text-muted-foreground">Total Questions</div>
          <div className="text-xl font-medium">{total}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Attempted</div>
          <div className="text-xl font-medium">{attempted}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Correct</div>
          <div className="text-xl font-medium">{correct}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Final Score</div>
          <div className="text-2xl font-semibold">
            {score} / {total}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <a
          href="/assessment/review"
          className="btn btn-primary px-4 py-2 rounded-md bg-primary text-primary-foreground"
        >
          Review Answers
        </a>
      </div>
    </div>
  );
}
