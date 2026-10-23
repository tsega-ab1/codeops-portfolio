import { cookies } from "next/headers";
import { signToken, verifyToken } from "./token.mjs";
import { getUserById } from "./db";

export const SESSION_COOKIE = "session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// One place that answers "who is this request?" for pages,
// server actions and route handlers.
export async function getSession() {
  const store = await cookies();
  const payload = verifyToken(store.get(SESSION_COOKIE)?.value);
  if (!payload) return null;

  const user = getUserById(payload.sub);
  if (!user) return null;

  return { id: user.id, name: user.name, role: user.role };
}

export async function createSession(userId) {
  const store = await cookies();
  store.set(SESSION_COOKIE, signToken({ sub: userId, exp: Date.now() + MAX_AGE * 1000 }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
