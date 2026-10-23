"use client";

import { useActionState } from "react";
import { signIn } from "@/app/actions";

export default function SignInForm({ next }) {
  const [state, formAction, pending] = useActionState(signIn, null);

  return (
    <form action={formAction} style={{ display: "grid", gap: 12, maxWidth: 320 }}>
      <input type="hidden" name="next" value={next} />
      <label>
        Phone number
        <input name="phone" inputMode="tel" autoComplete="username" required style={{ display: "block", width: "100%" }} />
      </label>
      <label>
        Password
        <input name="password" type="password" autoComplete="current-password" required style={{ display: "block", width: "100%" }} />
      </label>
      {state?.error && <p className="error" role="alert">{state.error}</p>}
      <button type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
