import { getCurrentUser } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";
import ResultPageClient from "@/components/ResultPageClient";

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
    <ResultPageClient
      attempted={attempted}
      correct={correct}
      score={score}
      total={total}
    />
  );
}
