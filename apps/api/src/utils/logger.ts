import pino from "pino";
import pinoHttp from "pino-http";

const env = process.env.NODE_ENV || "development";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: env === "development" ? { target: "pino-pretty" } : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
});

export const requestLogger = pinoHttp({
  logger,
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return "warn";
    } else if (res.statusCode >= 500 || err) {
      return "error";
    }
    return "info";
  },
  autoLogging: {
    ignore: (req) => req.url === "/api/v1/health",
  },
});