import { Module } from "@nestjs/common";
import { DebugController } from "./debug.controller.js";
import { SlowService } from "./slow.service.js";

@Module({
  controllers: [DebugController],
  providers: [SlowService],
})
export class DebugModule {}
