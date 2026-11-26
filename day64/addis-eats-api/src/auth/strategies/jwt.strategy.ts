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
    return {
      id: Number(payload.sub),
      email: payload.email,
      roles: payload.roles,
      ...(payload.restaurantId !== undefined ? { restaurantId: payload.restaurantId } : {}),
    };
  }
}
