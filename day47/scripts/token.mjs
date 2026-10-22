// node --env-file=.env.local scripts/token.mjs usr_32
// Prints a valid session cookie value for a seeded user (testing only).
import { signToken } from "../lib/token.mjs";

const id = process.argv[2];
if (!id) {
  console.error("usage: node --env-file=.env.local scripts/token.mjs <userId>");
  process.exit(1);
}
console.log(signToken({ sub: id, exp: Date.now() + 60 * 60 * 1000 }));
