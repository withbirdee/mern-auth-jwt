import rateLimit from "express-rate-limit";
import { HTTP_STATUS } from "../constants/http.js";
import { NODE_ENV } from "../constants/env.js";

// Initialize the middleware once and export it
const passwordResetLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minute window
  limit: 2, // 'limit' is preferred over 'max'
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

export default passwordResetLimiter;
