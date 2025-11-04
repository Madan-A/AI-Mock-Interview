import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { isAuthenticated } from "@/lib/actions/auth.action";

const AuthLayout = async ({ children }: { children: ReactNode }) => {
  // Guard the server-side auth check so missing/invalid admin creds don't
  // crash the auth pages during local development. If the check errors,
  // treat the user as unauthenticated so sign-in/sign-up can render.
  let isUserAuthenticated = false;
  try {
    isUserAuthenticated = await isAuthenticated();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Auth check failed in AuthLayout:", err);
    isUserAuthenticated = false;
  }

  if (isUserAuthenticated) {
    // Redirect authenticated users to root — root will render the
    // authenticated home for signed-in users.
    redirect("/");
  }

  return <div className="auth-layout">{children}</div>;
};

export default AuthLayout;