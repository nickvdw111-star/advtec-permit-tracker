import { auth } from "~/server/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;

  if (!session) {
    return NextResponse.redirect(new URL("/auth/signin", nextUrl));
  }

  if (
    nextUrl.pathname.startsWith("/admin") &&
    session.user.role !== "OPS_MANAGER"
  ) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/teachers/:path*", "/admin/:path*"],
};
