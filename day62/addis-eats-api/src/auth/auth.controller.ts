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
