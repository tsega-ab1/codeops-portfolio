#!/usr/bin/env bash
# Day 61 - Authentication with JWT: real users, argon2, access + refresh tokens. The API key is deleted.
# Run from INSIDE day61/addis-eats-api/ (a copy of the Day 60 project):   bash day61-jwt-auth.sh
set -e
[ -f package.json ] && [ -f src/config/swagger.setup.ts ] && [ -f src/common/guards/roles.guard.ts ] || { echo "Run this inside day61/addis-eats-api/, copied from Day 60 (it must contain src/config/swagger.setup.ts)."; exit 1; }

# ---- packages (argon2 ships a prebuilt binary, so there is nothing to compile)
COMMON_MAJOR=$(node -p "require('@nestjs/common/package.json').version.split('.')[0]")
case "$COMMON_MAJOR" in
  10 | 11) AUTH_PKGS="@nestjs/jwt@11 @nestjs/passport@11 passport@0.7 passport-jwt@4 argon2" ;;
  *) AUTH_PKGS="@nestjs/jwt@latest @nestjs/passport@latest passport@0.7 passport-jwt@4 argon2" ;;
esac
npm ls @nestjs/jwt >/dev/null 2>&1 || npm i $AUTH_PKGS --no-audit --no-fund
npm ls @types/passport-jwt >/dev/null 2>&1 || npm i -D @types/passport-jwt --no-audit --no-fund

mkdir -p src/users src/auth/dto src/auth/guards src/auth/strategies src/common/decorators

# =====================  configuration: the secrets live in .env, never in git  =====================
cat > .env.example << 'EOF'
# Copy this file to .env and fill in the blanks. .env is never committed.
# error | warn | info | debug | verbose. Production runs at info.
LOG_LEVEL=info

# Two DIFFERENT secrets, each at least 32 characters. Generate one with:
#   node -p "require('crypto').randomBytes(48).toString('hex')"
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

# Optional lifetimes: a number and one of s, m, h, d. The defaults are 15m and 7d.
# JWT_ACCESS_EXPIRES_IN=15m
# JWT_REFRESH_EXPIRES_IN=7d

# The password of the three development users (staff@example.et, almaz@example.et, dawit@example.et).
# At least 10 characters. Ignored in production, where no development users exist.
SEED_PASSWORD=
EOF

# .env: drop the old API keys, and generate the secrets that are missing (never a default in code)
node - << 'NODE'
const fs = require("fs");
const crypto = require("crypto");
const text = fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "";
const lines = text.split("\n").filter((l) => !/^(STAFF_API_KEY|CUSTOMER_API_KEY)=/.test(l));
const has = (k) => lines.some((l) => l.startsWith(k + "=") && l.slice(k.length + 1).trim() !== "");
const set = (k, v) => {
  const i = lines.findIndex((l) => l.startsWith(k + "="));
  if (i >= 0) lines[i] = k + "=" + v; else lines.push(k + "=" + v);
};
if (!has("LOG_LEVEL")) set("LOG_LEVEL", "info");
if (!has("JWT_ACCESS_SECRET")) set("JWT_ACCESS_SECRET", crypto.randomBytes(48).toString("hex"));
if (!has("JWT_REFRESH_SECRET")) set("JWT_REFRESH_SECRET", crypto.randomBytes(48).toString("hex"));
if (!has("SEED_PASSWORD")) set("SEED_PASSWORD", crypto.randomBytes(9).toString("base64url"));
fs.writeFileSync(".env", lines.join("\n").replace(/\n+$/, "") + "\n");
NODE
grep -qx '.env' .gitignore 2>/dev/null || echo '.env' >> .gitignore

cat > src/config/validate-env.ts << 'EOF'
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
EOF

# =====================  the API key is gone, for good  =====================
rm -f src/common/guards/api-key.guard.ts

cat > src/common/auth/auth.types.ts << 'EOF'
export type Role = "staff" | "customer";

// What the JWT strategy puts on the request (req.user). RolesGuard only ever reads this.
export interface AuthenticatedUser {
  id: number;
  email: string;
  roles: Role[];
}

// Just the parts of the HTTP request the guards use, so we need no `any`
export interface AuthRequest {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthenticatedUser;
}
EOF

# @Public(): the escape hatch from "every route needs a token"
cat > src/common/decorators/public.decorator.ts << 'EOF'
import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

// Routes are PROTECTED by default. Forgetting @Public() makes a route too strict and somebody
// reports it within a day. Forgetting a guard would leave it open, and nobody would report that.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
EOF

cat > src/common/decorators/current-user.decorator.ts << 'EOF'
import { ExecutionContext, UnauthorizedException, createParamDecorator } from "@nestjs/common";
import type { AuthenticatedUser, AuthRequest } from "../auth/auth.types.js";

// @CurrentUser() user: AuthenticatedUser  ->  what the JWT strategy's validate() returned
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const user = context.switchToHttp().getRequest<AuthRequest>().user;
    if (!user) throw new UnauthorizedException();
    return user;
  },
);
EOF

# =====================  users: behind a repository interface, like everything else  =====================
cat > src/users/user.types.ts << 'EOF'
import type { Role } from "../common/auth/auth.types.js";

// The RECORD. It contains hashes, so it must never leave the service layer.
export interface User {
  readonly id: number;
  email: string;
  passwordHash: string; // argon2id, with its salt inside the string
  roles: Role[];
  refreshHash: string | null; // argon2id of the CURRENT refresh token; null = logged out
}

// What may be shown to a caller: an explicit mapping, never the record itself
export interface PublicUser {
  id: number;
  email: string;
  roles: Role[];
}

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, roles: [...user.roles] };
}
EOF

cat > src/users/user.errors.ts << 'EOF'
export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super("Email already registered");
    this.name = "EmailAlreadyRegisteredError";
  }
}
EOF

cat > src/users/users.seed.ts << 'EOF'
import type { Role } from "../common/auth/auth.types.js";

// Development accounts, created at startup (never in production).
// Their password is SEED_PASSWORD from .env, so no password and no hash is ever committed.
export const SEED_USERS: ReadonlyArray<{ email: string; roles: Role[] }> = [
  { email: "staff@example.et", roles: ["staff"] },
  { email: "almaz@example.et", roles: ["customer"] },
  { email: "dawit@example.et", roles: ["customer"] },
];
EOF

cat > src/users/users.repository.ts << 'EOF'
import { Injectable } from "@nestjs/common";
import { EmailAlreadyRegisteredError } from "./user.errors.js";
import type { User } from "./user.types.js";

export const USER_REPOSITORY = "USER_REPOSITORY";

export type NewUser = Pick<User, "email" | "passwordHash" | "roles">;

// Async on purpose: PostgreSQL replaces the Map in Module 5 and nothing above this line changes
export interface UserRepository {
  findByEmail(email: string): Promise<User | undefined>;
  findById(id: number): Promise<User | undefined>;
  create(data: NewUser): Promise<User>;
  setRefreshHash(id: number, hash: string | null): Promise<void>;
}

@Injectable()
export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<number, User>();
  private nextId = 1;

  findByEmail(email: string): Promise<User | undefined> {
    return Promise.resolve([...this.users.values()].find((u) => u.email === email));
  }

  findById(id: number): Promise<User | undefined> {
    return Promise.resolve(this.users.get(id));
  }

  // Uniqueness is enforced HERE, with no await between the check and the insert,
  // so two simultaneous registrations cannot both succeed.
  create(data: NewUser): Promise<User> {
    if ([...this.users.values()].some((u) => u.email === data.email)) {
      return Promise.reject(new EmailAlreadyRegisteredError());
    }
    const user: User = { id: this.nextId++, ...data, refreshHash: null };
    this.users.set(user.id, user);
    return Promise.resolve(user);
  }

  setRefreshHash(id: number, hash: string | null): Promise<void> {
    const user = this.users.get(id);
    if (user) user.refreshHash = hash;
    return Promise.resolve();
  }
}
EOF

cat > src/users/users.service.ts << 'EOF'
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";
import { USER_REPOSITORY } from "./users.repository.js";
import type { NewUser, UserRepository } from "./users.repository.js";
import type { User } from "./user.types.js";
import { SEED_USERS } from "./users.seed.js";

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @Inject(USER_REPOSITORY) private readonly repo: UserRepository,
    private readonly config: ConfigService,
  ) {}

  // The three development users. Skipped entirely in production.
  async onModuleInit(): Promise<void> {
    if (this.config.get<string>("NODE_ENV") === "production") return;
    const password = this.config.getOrThrow<string>("SEED_PASSWORD");
    await Promise.all(
      SEED_USERS.map(async (seed) =>
        this.repo.create({
          email: seed.email,
          roles: seed.roles,
          passwordHash: await argon2.hash(password), // each user gets its own salt
        }),
      ),
    );
  }

  findByEmail(email: string): Promise<User | undefined> {
    return this.repo.findByEmail(email);
  }

  findById(id: number): Promise<User | undefined> {
    return this.repo.findById(id);
  }

  create(data: NewUser): Promise<User> {
    return this.repo.create(data);
  }

  setRefreshHash(id: number, hash: string | null): Promise<void> {
    return this.repo.setRefreshHash(id, hash);
  }
}
EOF

cat > src/users/users.module.ts << 'EOF'
import { Module } from "@nestjs/common";
import { InMemoryUserRepository, USER_REPOSITORY } from "./users.repository.js";
import { UsersService } from "./users.service.js";

@Module({
  providers: [
    UsersService,
    { provide: USER_REPOSITORY, useClass: InMemoryUserRepository },
  ],
  exports: [UsersService], // AuthModule borrows it (Day 54's export-and-import rule, again)
})
export class UsersModule {}
EOF

# =====================  auth: errors, helpers, DTOs  =====================
cat > src/auth/auth.errors.ts << 'EOF'
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
EOF

cat > src/auth/auth.types.ts << 'EOF'
import type { Role } from "../common/auth/auth.types.js";

export const ISSUER = "addis-eats";

// The access token: who this is and what they were allowed to do AT THE MOMENT it was issued.
// A payload is a postcard: anyone can read it, nobody can change it. No phone number, no hash.
export interface AccessPayload {
  sub: string; // the user id (a JWT "sub" is a string)
  email: string;
  roles: Role[];
}

// The refresh token carries only an id and a unique id: it never authorises anything by itself
export interface RefreshPayload {
  sub: string;
  jti: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number; // seconds until the access token expires
}
EOF

cat > src/auth/duration.ts << 'EOF'
const UNIT_SECONDS = { s: 1, m: 60, h: 3600, d: 86400 } as const;

// "15m" -> 900. Seconds as a plain number are accepted by every version of the JWT library.
export function toSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) throw new Error(`"${value}" is not a duration like 15m`);
  return Number(match[1]) * UNIT_SECONDS[match[2] as keyof typeof UNIT_SECONDS];
}
EOF

cat > src/auth/dto/register.dto.ts << 'EOF'
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterDto {
  /** The account email. Letter case does not matter: it is stored in lower case. */
  @ApiProperty({ example: "sara@example.et" })
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(254)
  email!: string;

  /** 10 to 128 characters. The upper limit stops a huge password being hashed on purpose. */
  @ApiProperty({ example: "a-long-passphrase-123", minLength: 10, maxLength: 128 })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  password!: string;
}
EOF

cat > src/auth/dto/login.dto.ts << 'EOF'
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class LoginDto {
  /** The email the account was registered with. */
  @ApiProperty({ example: "sara@example.et" })
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(254)
  email!: string;

  /** The account password. */
  @ApiProperty({ example: "a-long-passphrase-123" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password!: string;
}
EOF

cat > src/auth/dto/refresh.dto.ts << 'EOF'
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class RefreshDto {
  /** The refresh token from the last login or refresh. It works once: every refresh issues a new one. */
  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  refreshToken!: string;
}
EOF

cat > src/auth/dto/user.response.ts << 'EOF'
import { ApiProperty } from "@nestjs/swagger";

// There is no passwordHash here, on purpose: the record is never returned, only this mapping
export class UserResponse {
  @ApiProperty({ example: 4 })
  id!: number;

  @ApiProperty({ example: "sara@example.et" })
  email!: string;

  @ApiProperty({ enum: ["staff", "customer"], isArray: true, example: ["customer"] })
  roles!: string[];
}
EOF

cat > src/auth/dto/token-pair.response.ts << 'EOF'
import { ApiProperty } from "@nestjs/swagger";

export class TokenPairResponse {
  @ApiProperty({ description: "Send it as `Authorization: Bearer <token>` on every request. Short-lived.", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
  accessToken!: string;

  @ApiProperty({ description: "Send it ONLY to POST /auth/refresh, when the access token has expired. It works once.", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
  refreshToken!: string;

  @ApiProperty({ example: "Bearer" })
  tokenType!: string;

  @ApiProperty({ example: 900, description: "Seconds until the access token expires." })
  expiresIn!: number;
}
EOF

# =====================  auth: the service  =====================
cat > src/auth/auth.service.ts << 'EOF'
import { randomUUID } from "node:crypto";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { UsersService } from "../users/users.service.js";
import { toPublicUser } from "../users/user.types.js";
import type { PublicUser, User } from "../users/user.types.js";
import { InvalidCredentialsError, InvalidRefreshTokenError } from "./auth.errors.js";
import { ISSUER } from "./auth.types.js";
import type { AccessPayload, RefreshPayload, TokenPair } from "./auth.types.js";
import type { LoginDto } from "./dto/login.dto.js";
import type { RegisterDto } from "./dto/register.dto.js";
import { toSeconds } from "./duration.js";

@Injectable()
export class AuthService implements OnModuleInit {
  // A real argon2 hash of a throwaway string. Login verifies against it when the email is unknown,
  // so "no such email" takes as long as "wrong password" and timing cannot enumerate accounts.
  private dummyHash = "";

  constructor(
    @InjectPinoLogger(AuthService.name) private readonly logger: PinoLogger,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.dummyHash = await argon2.hash(randomUUID());
  }

  async register(dto: RegisterDto): Promise<PublicUser> {
    // The roles are never read from the request: a new account is always a customer.
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.users.create({ email: dto.email, passwordHash, roles: ["customer"] });
    this.logger.info({ userId: user.id }, "user registered"); // an id, never the email or the password
    return toPublicUser(user); // an explicit mapping: the record contains passwordHash
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.users.findByEmail(dto.email);
    // ONE check and ONE message for both failures
    const matches = await argon2.verify(user?.passwordHash ?? this.dummyHash, dto.password);
    if (!user || !matches) {
      this.logger.warn("login failed");
      throw new InvalidCredentialsError();
    }
    this.logger.info({ userId: user.id }, "user logged in");
    return this.issueTokens(user);
  }

  // Rotation: a valid refresh token buys a NEW pair and stops working the moment the new one is stored
  async refresh(presented: string): Promise<TokenPair> {
    let payload: RefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(presented, {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
        algorithms: ["HS256"], // state what we accept: never let the token's own header decide
        issuer: ISSUER,
      });
    } catch {
      throw new InvalidRefreshTokenError(); // bad signature, expired, or an access token in disguise
    }

    const user = await this.users.findById(Number(payload.sub));
    const matches = user?.refreshHash ? await argon2.verify(user.refreshHash, presented) : false;
    if (!user || !matches) {
      // a validly-signed token that is not the CURRENT one: it was already used, or the user logged out
      this.logger.warn({ userId: payload.sub }, "refresh token rejected");
      throw new InvalidRefreshTokenError();
    }
    this.logger.info({ userId: user.id }, "tokens refreshed");
    return this.issueTokens(user);
  }

  private async issueTokens(user: User): Promise<TokenPair> {
    const accessSeconds = toSeconds(this.config.get<string>("JWT_ACCESS_EXPIRES_IN") || "15m");
    const refreshSeconds = toSeconds(this.config.get<string>("JWT_REFRESH_EXPIRES_IN") || "7d");

    const access: AccessPayload = { sub: String(user.id), email: user.email, roles: user.roles };
    const refresh: RefreshPayload = { sub: String(user.id), jti: randomUUID() }; // jti: two refresh tokens are never identical

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(access, {
        secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
        expiresIn: accessSeconds,
      }),
      this.jwt.signAsync(refresh, {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
        expiresIn: refreshSeconds,
      }),
    ]);

    // Only a HASH of the refresh token is kept. Setting it to null is the one revocation we have.
    await this.users.setRefreshHash(user.id, await argon2.hash(refreshToken));
    return { accessToken, refreshToken, tokenType: "Bearer", expiresIn: accessSeconds };
  }
}
EOF

# =====================  auth: strategy and guard  =====================
cat > src/auth/strategies/jwt.strategy.ts << 'EOF'
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { AuthenticatedUser } from "../../common/auth/auth.types.js";
import { ISSUER } from "../auth.types.js";
import type { AccessPayload } from "../auth.types.js";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>("JWT_ACCESS_SECRET"),
      algorithms: ["HS256"], // never let the token's own header decide how it is checked (alg:none)
      issuer: ISSUER,
      ignoreExpiration: false,
    });
  }

  // Runs only AFTER the signature, the issuer and the expiry have passed.
  // What it returns becomes req.user, and RolesGuard reads exactly that.
  validate(payload: AccessPayload): AuthenticatedUser {
    return { id: Number(payload.sub), email: payload.email, roles: payload.roles };
  }
}
EOF

cat > src/auth/guards/jwt-auth.guard.ts << 'EOF'
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY } from "../../common/decorators/public.decorator.js";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    return isPublic ? true : super.canActivate(context);
  }

  // Every failure is a 401. The message tells a client WHAT to do next, without telling an attacker anything.
  handleRequest<TUser>(err: unknown, user: TUser | false, info: unknown): TUser {
    if (err || !user) {
      const reason = info instanceof Error ? info : undefined;
      if (reason?.name === "TokenExpiredError") {
        throw new UnauthorizedException("The access token has expired: call POST /auth/refresh");
      }
      if (reason?.message === "No auth token") {
        throw new UnauthorizedException("Authentication required: send an Authorization: Bearer <token> header");
      }
      throw new UnauthorizedException("Invalid access token");
    }
    return user;
  }
}
EOF

# =====================  auth: the controller and the module  =====================
cat > src/auth/auth.controller.ts << 'EOF'
import { Body, Controller, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import type { AuthenticatedUser } from "../common/auth/auth.types.js";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";
import { Public } from "../common/decorators/public.decorator.js";
import { ApiErrors } from "../common/swagger/api-errors.decorator.js";
import type { PublicUser } from "../users/user.types.js";
import { AuthService } from "./auth.service.js";
import { LoginDto } from "./dto/login.dto.js";
import { RefreshDto } from "./dto/refresh.dto.js";
import { RegisterDto } from "./dto/register.dto.js";
import { TokenPairResponse } from "./dto/token-pair.response.js";
import { UserResponse } from "./dto/user.response.js";
import type { TokenPair } from "./auth.types.js";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public() // you cannot have a token before you have registered
  @Post("register")
  @ApiOperation({
    summary: "Create an account",
    description: "A new account is always a customer. The response is the account WITHOUT any password data. Then call POST /auth/login.",
  })
  @ApiCreatedResponse({ type: UserResponse })
  @ApiErrors({
    400: "Validation failed: not an email, a password shorter than 10 or longer than 128 characters, or an undeclared field (including roles).",
    409: "That email is already registered.",
  })
  register(@Body() dto: RegisterDto): Promise<PublicUser> {
    return this.auth.register(dto);
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK) // nothing is created, so 200 and not 201
  @ApiOperation({
    summary: "Log in with email and password",
    description: "Returns a short-lived access token and a refresh token. The failure answer is the same whether the email is unknown or the password is wrong.",
  })
  @ApiOkResponse({ type: TokenPairResponse })
  @ApiErrors({
    400: "Validation failed: not an email, or no password.",
    401: "Invalid credentials (unknown email or wrong password: deliberately indistinguishable).",
  })
  login(@Body() dto: LoginDto): Promise<TokenPair> {
    return this.auth.login(dto);
  }

  @Public() // the access token has just expired: the refresh token is the proof
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Swap a refresh token for a new pair of tokens",
    description: "Rotation: the refresh token you send stops working, and a new one comes back with the new access token. Sending an old one again is a 401.",
  })
  @ApiOkResponse({ type: TokenPairResponse })
  @ApiErrors({
    400: "refreshToken is missing.",
    401: "The refresh token is invalid, expired, already used, or is really an access token.",
  })
  refresh(@Body() dto: RefreshDto): Promise<TokenPair> {
    return this.auth.refresh(dto.refreshToken);
  }

  @Get("me")
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Who am I?",
    description: "Returns what the access token says: your id, email and roles. The quickest way to check a token works.",
  })
  @ApiOkResponse({ type: UserResponse })
  @ApiErrors({ 401: "Missing, invalid or expired access token." })
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }
}
EOF

cat > src/auth/auth.module.ts << 'EOF'
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { UsersModule } from "../users/users.module.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { ISSUER } from "./auth.types.js";
import { toSeconds } from "./duration.js";
import { JwtStrategy } from "./strategies/jwt.strategy.js";

@Module({
  imports: [
    UsersModule, // it needs to find a user by email
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_ACCESS_SECRET"),
        signOptions: {
          algorithm: "HS256" as const,
          issuer: ISSUER,
          expiresIn: toSeconds(config.get<string>("JWT_ACCESS_EXPIRES_IN") || "15m"),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
EOF
