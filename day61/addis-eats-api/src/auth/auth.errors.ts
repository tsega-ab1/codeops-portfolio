// ONE message for both login failures: "no such email" and "wrong password" must be
// indistinguishable, or the difference tells an attacker which addresses are registered.
export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid credentials");
    this.name = "InvalidCredentialsError";
  }
}

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super("Invalid refresh token");
    this.name = "InvalidRefreshTokenError";
  }
}
