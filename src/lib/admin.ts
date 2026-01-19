import { auth } from "./auth";
import { redirect } from "next/navigation";

/**
 * Check if the current user is an admin.
 * Returns the session if admin, throws redirect if not.
 * Use this in server components and API routes.
 */
export async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/admin");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  return session;
}

/**
 * Check if the current user is an admin (for API routes).
 * Returns { isAdmin: boolean, session } without redirecting.
 */
export async function checkAdmin() {
  const session = await auth();

  if (!session?.user) {
    return { isAdmin: false, session: null };
  }

  return {
    isAdmin: session.user.role === "admin",
    session,
  };
}
