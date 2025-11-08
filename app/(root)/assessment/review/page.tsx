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
    <div className="container mx-auto max-w-4xl py-6 px-4">
      <h1 className="text-2xl font-semibold mb-6">Assessment Review</h1>
      <AssessmentReviewClient />
    </div>
  );
}
