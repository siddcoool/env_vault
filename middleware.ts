import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";

const publicPaths = ["/login", "/register", "/docs"];
const authPaths = ["/login", "/register"];
const LEGACY_PATH = "/legacy";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));
  const isLegacyPath = pathname.startsWith(LEGACY_PATH);
  const isDocsPath = pathname.startsWith("/docs");

  if (session.isLegacySession && !session.isLoggedIn) {
    if (isDocsPath) {
      return response;
    }
    if (!isLegacyPath) {
      return NextResponse.redirect(new URL(LEGACY_PATH, request.url));
    }
    return response;
  }

  if (!session.isLoggedIn && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session.isLoggedIn && isAuthPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (session.isLoggedIn && isLegacyPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
