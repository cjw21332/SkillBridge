import { Request, Response, NextFunction } from "express";
import * as Sentry from "@sentry/node";
import { logger } from "../utils/logger";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.statusCode || err.status || (err.name === "ZodError" ? 400 : 500);
  const message = err.message || "Something went wrong";

  if (status >= 500) {
    logger.error({ err, req: { method: req.method, url: req.originalUrl } }, "Internal Server Error");
    Sentry.captureException(err);
  } else {
    logger.warn({ err: message, req: { method: req.method, url: req.originalUrl } }, "Client Error");
  }

  res.status(status).json({ error: { code: err.code || "ERROR", message } });
};
