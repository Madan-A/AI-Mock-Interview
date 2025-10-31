import Agent from "@/components/Agent";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";

// Force dynamic for auth check but enable faster navigation
export const dynamic = "force-dynamic";

const Page = async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
    return null;
  }

  return (
    <>
      <h3>Interview generation</h3>

      <Agent userName={user.name} userId={user.id} type="generate" />
    </>
  );
};

export default Page;
