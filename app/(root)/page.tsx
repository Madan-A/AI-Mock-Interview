import LandingPage from "@/components/LandingPage";
import { getCurrentUser } from "@/lib/actions/auth.action";
import HomeContent from "./HomeContent";

export default async function Page() {
  const user = await getCurrentUser();

  if (!user) return <LandingPage />;

  return <HomeContent />;
}
