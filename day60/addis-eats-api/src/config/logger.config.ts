import type { ConfigService } from "@nestjs/config";
import type { Params } from "nestjs-pino";
import { resolveRequestId } from "../common/request-id.js";

// Wherever a secret or a phone number could appear, it is censored HERE, once,
// instead of trusting forty call sites to remember. pino wildcards cover ONE level each,
// so the depths we use are spelled out.
const REDACT_PATHS = [
  "req.headers.authorization",
  'req.headers["x-api-key"]',
  "req.headers.cookie",
  "req.body.password",
  "*.password",
  "phone",
  "*.phone",
  "*.*.phone",
  "telebirrPhone",
  "*.telebirrPhone",
  "*.*.telebirrPhone",
];

export function loggerConfig(config: ConfigService): Params {
  const level = config.get<string>("LOG_LEVEL") ?? "info";
  // JSON is the default and the pretty path is the exception: pretty only when asked for
  const pretty = config.get<string>("NODE_ENV") === "development";

  return {
    pinoHttp: {
      level,

      // The correlation id from the request-id helper. Same id the middleware and the filter use.
      genReqId: (req, res) => {
        const id = resolveRequestId(req.headers["x-request-id"]);
        req.headers["x-request-id"] = id;
        res.setHeader("x-request-id", id);
        return id;
      },
      customAttributeKeys: { reqId: "requestId", responseTime: "durationMs" },
      // Lines written DURING a request carry just { requestId, handler }. Without this every service
      // line would repeat the whole request object. The final "request completed" line still has it.
      quietReqLogger: true,

      // 5xx = our bug (error). 4xx = the caller's mistake, worth a weekly look (warn). The rest is a kept fact.
      customLogLevel: (_req, res, err) =>
        err || res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",

      // the Swagger page fetches many assets: keep them out of the log
      autoLogging: { ignore: (req) => (req.url ?? "").startsWith("/docs") },

      redact: { paths: REDACT_PATHS, censor: "[redacted]" },

      // "level":"info" instead of "level":30 (pino refuses a custom formatter together with a transport)
      formatters: pretty ? undefined : { level: (label) => ({ level: label }) },
      transport: pretty ? { target: "pino-pretty" } : undefined,
    },
  };
}
