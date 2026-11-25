import { Injectable, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { resolveRequestId } from "../request-id.js";

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // honour an id the caller already sent (or one the logger middleware already settled), or make one
    const id = resolveRequestId(req.headers["x-request-id"]);

    req.headers["x-request-id"] = id; // for the filter and the logger
    res.setHeader("x-request-id", id); // so the client can quote it

    next(); // ALWAYS call next(), or the request hangs with no error and no log line
  }
}
