import { CorsOptions } from "cors";
import { APP_ORIGIN, NODE_ENV } from "../constants/env.js";

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman/Mobile)
    if (!origin) return callback(null, true);

    // Production: Only allow the official APP_ORIGIN
    if (NODE_ENV === "production") {
      return origin === APP_ORIGIN
        ? callback(null, true)
        : callback(new Error("CORS Error: Origin not allowed in production"));
    }

    // Development: Allow localhost and home network IPs (192.168.x.x)
    const isLocal =
      origin.startsWith("http://localhost") ||
      origin.startsWith("http://127.0.0.1") ||
      origin.startsWith("http://192.168.");

    if (isLocal) return callback(null, true);

    // Log the rejected origin to help with debugging
    console.warn(`[CORS Rejected]: ${origin}`);
    return callback(new Error("CORS Error: Origin not allowed in development"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: NODE_ENV === "production" ? 600 : 0,
};
