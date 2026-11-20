// Runs once at startup. A missing key stops the app with a clear message
// instead of letting every protected route fail mysteriously later.
export function validateEnv(env: Record<string, unknown>): Record<string, unknown> {
  for (const name of ["STAFF_API_KEY", "CUSTOMER_API_KEY"]) {
    const value = env[name];
    if (typeof value !== "string" || value === "") {
      throw new Error(`${name} is not set. Copy .env.example to .env and set it.`);
    }
  }
  return env;
}
