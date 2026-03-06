import { CorsOptions } from "cors";
import { APP_ORIGIN, NODE_ENV } from "../constants/env.js";

const allowedOrigins = [APP_ORIGIN];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Always allow in development mode
    if (
      NODE_ENV === "development" ||
      !origin ||
      allowedOrigins.includes(origin)
    ) {
      return callback(null, true);
    }

    // Log rejected origin
    console.warn(`[CORS] Rejected request from origin: ${origin}`);

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 600,
};
