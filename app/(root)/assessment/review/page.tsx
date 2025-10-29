import AssessmentReviewClient from "@/components/AssessmentReviewClient";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";

export default async function AssessmentReviewPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
    return null;
  }

  return (
    <div className="container mx-auto max-w-3xl py-6">
      <h1 className="text-2xl font-semibold mb-4">Review Answers</h1>
      <AssessmentReviewClient />
    </div>
  );
}
