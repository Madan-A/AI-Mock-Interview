import { getCurrentUser } from "@/lib/actions/auth.action";
import { getUserStats } from "@/lib/actions/dashboard.action";
import { redirect } from "next/navigation";
import DashboardClient from "@/components/DashboardClient";

// Enable dynamic rendering for fresh data
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
    return null;
  }

  const stats = await getUserStats(user.id);

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <DashboardClient user={user} stats={stats} />
    </div>
  );
}
