import { auth } from "./auth";
import { prisma } from "./prisma";
import { redirect } from "next/navigation";

export type UserRole = "admin" | "contributor" | "user" | null;

/**
 * Check if the current user has admin panel access (admin or contributor).
 * Returns the session and role if authorized, throws redirect if not.
 * Use this in server components and API routes.
 */
export async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/admin");
  }

  // Fetch role from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const role = user?.role as UserRole;

  // Allow both admin and contributor roles
  if (role !== "admin" && role !== "contributor") {
    redirect("/");
  }

  return { ...session, role };
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

  // Fetch role from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  return {
    isAdmin: user?.role === "admin",
    session,
  };
}

/**
 * Require full admin access (not contributor).
 * Use this for admin-only pages like Dashboard, Analytics, Users, Links.
 */
export async function requireFullAdmin() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/admin");
  }

  // Fetch role from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "admin") {
    // Contributors get redirected to jobs page
    redirect("/admin/jobs");
  }

  return session;
}
