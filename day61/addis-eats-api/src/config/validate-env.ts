const DURATION = /^\d+[smhd]$/;

// Runs once at startup. A missing or weak secret stops the app with a clear message
// instead of letting it run with something guessable.
export function validateEnv(env: Record<string, unknown>): Record<string, unknown> {
  const required = (name: string): string => {
    const value = env[name];
    if (typeof value !== "string" || value === "") {
      throw new Error(`${name} is not set. Copy .env.example to .env and set it.`);
    }
    return value;
  };

  const access = required("JWT_ACCESS_SECRET");
  const refresh = required("JWT_REFRESH_SECRET");
  if (access.length < 32 || refresh.length < 32) {
    throw new Error(
      "The JWT secrets must be at least 32 characters. Generate one with: node -p \"require('crypto').randomBytes(48).toString('hex')\"",
    );
  }
  if (access === refresh) {
    // different secrets stop an access token being presented as a refresh token, and vice versa
    throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different values.");
  }

  for (const name of ["JWT_ACCESS_EXPIRES_IN", "JWT_REFRESH_EXPIRES_IN"]) {
    const value = env[name];
    if (value !== undefined && value !== "" && !(typeof value === "string" && DURATION.test(value))) {
      throw new Error(`${name} must be a number and one of s, m, h, d (for example 15m).`);
    }
  }

  if (env["NODE_ENV"] !== "production") {
    const seed = env["SEED_PASSWORD"];
    if (typeof seed !== "string" || seed.length < 10) {
      throw new Error("SEED_PASSWORD must be at least 10 characters (the development users' password).");
    }
  }
  return env;
}
