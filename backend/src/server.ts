import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";
import { NODE_ENV, PORT } from "./constants/env.js";
import connectToDatabase from "./configs/db.js";

/**
 * Initializes and starts the application server.
 */
async function startServer() {
  try {
    await connectToDatabase();

    // Determine host binding.
    //  Binding to "0.0.0.0" allows the server to be discoverable
    //  on the local network via the machine's IP address.
    const host = NODE_ENV === "development" ? "0.0.0.0" : "127.0.0.1";

    // 3. Start the Network Listener
    const server = app.listen(PORT, host, () => {
      const displayHost = host === "0.0.0.0" ? "localhost" : host;
      console.log(
        `Server running at http://${displayHost}:${PORT} [${NODE_ENV}]`
      );
    });

    /**
     * GRACEFUL SHUTDOWN
     * Closes connections cleanly on system signals.
     */
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Cleaning up...`);

      server.close(async () => {
        console.log("HTTP server stopped.");
        await mongoose.connection.close();
        console.log("MongoDB connection terminated.");
        process.exit(0);
      });

      // Emergency exit if shutdown hangs
      setTimeout(() => process.exit(1), 30000).unref();
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("CRITICAL ERROR during startup:", error);
    process.exit(1);
  }
}

startServer();
