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

    const access: AccessPayload = {
      sub: String(user.id),
      email: user.email,
      roles: user.roles,
      ...(user.restaurantId !== undefined ? { restaurantId: user.restaurantId } : {}),
    };
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
