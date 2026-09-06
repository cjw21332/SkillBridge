import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import * as Sentry from "@sentry/node";
import { requestLogger } from "./utils/logger";
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import skillsRoutes from "./modules/skills/skills.routes";
import matchesRoutes from "./modules/matches/matches.routes";
import discoverRoutes from "./modules/discover/discover.routes";
import bookingsRoutes from "./modules/bookings/bookings.routes";
import notificationsRoutes from "./modules/notifications/notifications.routes";
import postsRoutes from "./modules/posts/posts.routes";
import { authRateLimiter, globalRateLimiter, writesRateLimiter } from "./middleware/rateLimit.middleware";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 1.0,
  });
}

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        origin === process.env.FRONTEND_URL ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.use(requestLogger);

app.use("/api/v1/health", (_req, res) => { res.json({ status: "ok" }); });

app.use("/api/v1", globalRateLimiter);

app.use("/api/v1/auth", authRateLimiter, authRoutes);
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/skills", skillsRoutes);
app.use("/api/v1/matches", writesRateLimiter, matchesRoutes);
app.use("/api/v1/discover", discoverRoutes);
app.use("/api/v1/bookings", writesRateLimiter, bookingsRoutes);
app.use("/api/v1/notifications", notificationsRoutes);
app.use("/api/v1/posts", postsRoutes);

if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

app.use(errorHandler);

export default app;
