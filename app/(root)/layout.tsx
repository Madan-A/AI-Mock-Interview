import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { isAuthenticated, getCurrentUser } from "@/lib/actions/auth.action";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Enable dynamic rendering but with caching
export const dynamic = "force-dynamic";

const Layout = async ({ children }: { children: ReactNode }) => {
  const isUserAuthenticated = await isAuthenticated();
  if (!isUserAuthenticated) redirect("/sign-in");

  const user = await getCurrentUser();

  return (
    <div className="root-layout flex flex-col min-h-screen">
      <Navbar user={user} />

      <main className="flex-1">{children}</main>

      <Footer />
    </div>
  );
};

export default Layout;
