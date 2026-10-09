import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { safeNext } from "@/lib/safe-redirect.mjs";
import SignInForm from "@/components/SignInForm";

export const metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function SignInPage({ searchParams }) {
  const { next } = await searchParams;
  const destination = safeNext(next); // /signin?next=https://evil.example -> "/"

  if (await getSession()) redirect(destination);

  return (
    <section>
      <h1>Sign in</h1>
      <SignInForm next={destination} />
      <p className="muted">
        Demo accounts (password addis123): 0911000001 Almaz · 0911000002 Dawit · 0911000010 staff
      </p>
    </section>
  );
}
