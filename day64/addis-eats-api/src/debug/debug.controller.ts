import { Controller, Get, Query } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { Roles } from "../common/decorators/roles.decorator.js";
import { SlowQuery } from "./slow.query.js";
import { SlowService } from "./slow.service.js";

@ApiExcludeController()
@Controller("debug")
export class DebugController {
  constructor(private readonly slow: SlowService) {}

  // GET /api/v1/debug/slow?ms=6000  ->  408 after 5 seconds (the timeout interceptor)
  @Get("slow")
  @Roles("staff")
  async wait(@Query() query: SlowQuery): Promise<{ waitedMs: number }> {
    return { waitedMs: await this.slow.wait(query.ms) };
  }

  // GET /api/v1/debug/boom  ->  a deliberate bug, to prove a 500 tells the client nothing (Day 63, attack 10).
  // DebugModule is not mounted when NODE_ENV=production, so this route does not exist there.
  @Get("boom")
  @Roles("staff")
  boom(): never {
    throw new Error("deliberate failure: the secret detail that must never reach the client");
  }
}
