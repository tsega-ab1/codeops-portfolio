import { NextResponse } from "next/server";

// Layer 1: an early checkpoint. It only proves a cookie EXISTS — it does not
// verify it. Real verification happens in getSession() (page) and in actions.
export function proxy(request) {
  const session = request.cookies.get("session");

  if (!session) {
    const url = new URL("/signin", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/checkout/:path*", "/orders/:path*", "/kitchen/:path*"],
};
