import AssessmentClient from "@/components/AssessmentClient";
import AssessmentSectionPickerClient from "@/components/AssessmentSectionPickerClient";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";

// Enable dynamic rendering for auth
export const dynamic = "force-dynamic";

export default async function AssessmentPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
    return null;
  }

  const params = await searchParams;
  const sectionParam = (params?.section as string) || "";
  const section =
    sectionParam === "technical"
      ? "technical"
      : sectionParam === "aptitude"
      ? "aptitude"
      : "";

  return (
    <div className="container mx-auto max-w-3xl py-6">
      {section ? (
        <AssessmentClient section={section as "aptitude" | "technical"} />
      ) : (
        <AssessmentSectionPickerClient />
      )}
    </div>
  );
}
