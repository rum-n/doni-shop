import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import { routing } from "./i18n/routing";

const handleI18n = createMiddleware(routing);

// Matches /admin and /en/admin, /bg/admin, … and anything beneath them
const ADMIN_PATH = new RegExp(`^(?:/(?:${routing.locales.join("|")}))?/admin(?:/|$)`);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (ADMIN_PATH.test(pathname)) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Anyone who is not the owner is sent to the login page rather than shown
    // the shell of a page they cannot use. Buyers get a User row at checkout,
    // so a session alone is not enough.
    if (token?.role !== "admin") {
      const login = new URL("/login", request.url);
      login.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(login);
    }
  }

  return handleI18n(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
