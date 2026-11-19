import { randomUUID } from "node:crypto";
import { Injectable, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

// A caller's id is kept only if it is harmless to log: letters, digits, . _ - and not too long.
// Anything else (a huge string, a line break to forge log lines) is replaced by a fresh uuid.
const SAFE_ID = /^[A-Za-z0-9._-]{1,128}$/;

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // honour an id the caller already sent, or make one
    const sent = req.headers["x-request-id"];
    const candidate = Array.isArray(sent) ? sent[0] : sent;
    const id = candidate && SAFE_ID.test(candidate) ? candidate : randomUUID();

    req.headers["x-request-id"] = id; // for the filter and the logger
    res.setHeader("x-request-id", id); // so the client can quote it

    next(); // ALWAYS call next(), or the request hangs with no error and no log line
  }
}
