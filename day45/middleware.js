import { NextResponse } from "next/server";

// Layer 1: a fast early redirect. It only proves a cookie EXISTS.
// The page, query and action layers prove the session is real and allowed.
export function middleware(request) {
  if (!request.cookies.get("session")) {
    const url = new URL("/signin", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/checkout/:path*", "/orders/:path*", "/kitchen/:path*"]
};
