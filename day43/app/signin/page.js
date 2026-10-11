import { Suspense } from "react";
import { safeNext } from "@/lib/safe-next";

// searchParams is runtime data, so with cacheComponents it must be read
// inside a <Suspense> boundary.
async function SignInForm({ searchParams }) {
  const params = await searchParams;
  const next = safeNext(params.next);

  return (
    <>
      {params.error && <p role="alert">Invalid email or password.</p>}

      <form action="/api/signin" method="post">
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required />
        </div>

        <input type="hidden" name="next" value={next} />

        <button type="submit">Sign in</button>
      </form>

      <p>
        Demo accounts (password: <code>password123</code>): abebe@example.com,
        marta@example.com, staff@example.com
      </p>
    </>
  );
}

export default function SignInPage({ searchParams }) {
  return (
    <main>
      <h1>Sign in</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <SignInForm searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
