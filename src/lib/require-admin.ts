import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Every write endpoint and every endpoint that exposes customer data is for
 * the shop owner only. A signed-in session is not enough on its own: buyers
 * get a User row at checkout, so "has a session" and "is the owner" are two
 * different questions.
 */
export async function getAdminSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "admin") {
    return null;
  }

  return session;
}

/**
 * Returns a response to send back when the caller is not an admin, or null
 * when they are. Keeps route handlers to a two-line guard.
 *
 *   const denied = await requireAdmin();
 *   if (denied) return denied;
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user?.role !== "admin") {
    // Signed in, but not the owner: 403 rather than 401, since signing in
    // again will not help.
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  return null;
}
