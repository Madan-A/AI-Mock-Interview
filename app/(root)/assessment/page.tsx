import AssessmentClient from "@/components/AssessmentClient";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";

export default async function AssessmentPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
    return null;
  }

  return (
    <div className="container mx-auto max-w-3xl py-6">
      <AssessmentClient />
    </div>
  );
}
