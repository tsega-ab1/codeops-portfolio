import { Injectable } from "@nestjs/common";

@Injectable()
export class SlowService {
  // A real ASYNC delay. (A synchronous busy-wait would block the event loop,
  // and the timeout interceptor could not fire while it was blocked.)
  wait(ms: number): Promise<number> {
    return new Promise((resolve) => setTimeout(() => resolve(ms), ms));
  }
}
