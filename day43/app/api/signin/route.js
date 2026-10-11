import { NextResponse } from "next/server";
import { verifyCredentials } from "@/lib/users";
import { createSession } from "@/lib/session";
import { safeNext } from "@/lib/safe-next";

export async function POST(request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const next = safeNext(form.get("next"));

  const user = verifyCredentials(email, password);

  if (!user) {
    const url = new URL("/signin", request.url);
    url.searchParams.set("error", "1");
    url.searchParams.set("next", next);
    // 303 = "go GET this page". The default 307 would re-send the POST.
    return NextResponse.redirect(url, 303);
  }

  await createSession(user.id);
  return NextResponse.redirect(new URL(next, request.url), 303);
}
