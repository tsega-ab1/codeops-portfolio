import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { findUserById } from "@/lib/users";

const COOKIE_NAME = "session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days
// Put a long random SESSION_SECRET in .env.local. The fallback is for local learning only.
const SECRET = process.env.SESSION_SECRET || "dev-only-secret-change-me";

function sign(value) {
  return createHmac("sha256", SECRET).update(value).digest("base64url");
}

// cookie value = "<userId>.<signature>" — editing the userId in DevTools breaks the signature.
function readSessionValue(raw) {
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot < 1) return null;
  const userId = raw.slice(0, dot);
  const given = Buffer.from(raw.slice(dot + 1));
  const expected = Buffer.from(sign(userId));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return userId;
}

// The ONE helper every server component / action / handler uses.
// Role comes from the user record on the server, never from the cookie.
export async function getSession() {
  const store = await cookies();
  const userId = readSessionValue(store.get(COOKIE_NAME)?.value);
  if (!userId) return null;
  const user = findUserById(userId);
  if (!user) return null;
  return { userId: user.id, name: user.name, role: user.role };
}

export async function createSession(userId) {
  const store = await cookies();
  store.set(COOKIE_NAME, `${userId}.${sign(userId)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
