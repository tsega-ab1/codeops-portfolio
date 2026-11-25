import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { Public } from "../common/decorators/public.decorator.js";
import { ApiErrors } from "../common/swagger/api-errors.decorator.js";

class HealthResponse {
  @ApiProperty({ example: true })
  ok!: boolean;
}

@ApiTags("health")
@Controller("health")
export class HealthController {
  // A load balancer polls this every few seconds from ONE address. Rate-limit it and the platform decides the
  // API is down and takes it out of rotation: a common outage. So: public, and never throttled.
  @Public()
  @SkipThrottle()
  @Get()
  @ApiOperation({ summary: "Is the API up?", description: "Never rate limited and never needs a token: a load balancer polls it." })
  @ApiOkResponse({ type: HealthResponse })
  @ApiErrors({ 408: "The handler took longer than 5 seconds (the global timeout from Day 59): the API is up but not answering in time." })
  check(): HealthResponse {
    return { ok: true };
  }
}
