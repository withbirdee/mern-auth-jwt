import { CorsOptions } from "cors";
import { APP_ORIGIN, NODE_ENV } from "../constants/env.js";

// Convert comma-separated string to array
const allowedOrigins = APP_ORIGIN.split(",").map((origin) => origin.trim());

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests without origin (Postman, mobile apps, curl)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Log rejected origin
    console.warn(`[CORS] Rejected request from origin: ${origin}`);

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: NODE_ENV === "production" ? 600 : 0,
};
