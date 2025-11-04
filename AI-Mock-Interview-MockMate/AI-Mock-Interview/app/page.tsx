import LandingPage from "@/components/LandingPage";
import { getCurrentUser } from "@/lib/actions/auth.action";
import HomeContent from "./(root)/HomeContent";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default async function Page() {
  // Show landing for guests; authenticated users see the home/dashboard content at '/'
  const user = await getCurrentUser();

  if (!user) return <LandingPage />;

  // Render the authenticated home wrapped with the same layout used for the
  // (root) area so Navbar/Footer appear at '/'.
  return (
    <div className="root-layout flex flex-col min-h-screen">
  {/* Navbar is a client component */}
  <Navbar user={user} />

      <main className="flex-1">
        <HomeContent />
      </main>

      <Footer />
    </div>
  );
}
