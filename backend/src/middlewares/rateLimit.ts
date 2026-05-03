import rateLimit from "express-rate-limit";
import { HTTP_STATUS } from "../constants/http.js";
import { NODE_ENV } from "../constants/env.js";

// Password reset limiter
export const passwordResetLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minute window
  limit: 2,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many password reset requests. Please try again in 5 minutes.",
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  skipFailedRequests: true,
  //   Bypasses the limiter in development environment
  skip: () => NODE_ENV === "development",
});

// Email verification resend limiter
export const emailVerificationRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3, // Allow 3 resend attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Too many verification email requests. Please try again in 15 minutes.",
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  skipFailedRequests: true,
  skip: () => NODE_ENV === "development",
});
