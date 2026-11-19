import { Controller, Get, Query } from "@nestjs/common";
import { Roles } from "../common/decorators/roles.decorator.js";
import { SlowQuery } from "./slow.query.js";
import { SlowService } from "./slow.service.js";

@Controller("debug")
export class DebugController {
  constructor(private readonly slow: SlowService) {}

  // GET /api/v1/debug/slow?ms=6000  ->  408 after 5 seconds (the timeout interceptor)
  @Get("slow")
  @Roles("staff")
  async wait(@Query() query: SlowQuery): Promise<{ waitedMs: number }> {
    return { waitedMs: await this.slow.wait(query.ms) };
  }
}
