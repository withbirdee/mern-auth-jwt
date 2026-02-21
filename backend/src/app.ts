import express from "express";
import cookieParser from "cookie-parser";
import errorHandler from "./middlewares/errorHandler.js";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import authenticate from "./middlewares/authenticate.js";
import sessionRoutes from "./routes/session.route.js";
import cors from "cors";
import { corsOptions } from "./configs/cors.js";

const app = express();

app.use(cors(corsOptions));
// Security: Identify real user IPs behind proxies (Vercel, Render, AWS)
app.set("trust proxy", 1);

app.use(express.json());
app.use(cookieParser());

// Health Check
app.get("/", (req, res) => {
  res.json({ status: "healthy" });
});

// Auth Routes
app.use("/auth", authRoutes);

// Protected Routes
app.use("/user", authenticate, userRoutes);
app.use("/sessions", authenticate, sessionRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
