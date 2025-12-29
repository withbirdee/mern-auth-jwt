import mongoose from "mongoose";
import { MONGO_URI } from "../constants/env.js";

async function connectToDatabase() {
  await mongoose.connect(MONGO_URI);
  console.log("Successfully connected to MongoDB.");
}

// Initial or subsequent successful connection
mongoose.connection.on("connected", () => {
  // This triggers on the very first connection AND every successful reconnect
  console.log("MongoDB connection established.");
});

// Specific event for successful RE-connection
mongoose.connection.on("reconnected", () => {
  console.log("MongoDB connection re-established successfully.");
});

// Warning when connection is dropped
mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB connection lost. Attempting to reconnect...");
});

// Critical error monitoring
mongoose.connection.on("error", (err) => {
  console.error("MongoDB background connection error:", err);
});

export default connectToDatabase;
