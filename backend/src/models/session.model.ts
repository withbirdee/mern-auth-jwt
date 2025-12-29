import mongoose, { Schema, Model } from "mongoose";
import { thirtyDaysFromNow } from "../utils/date.js";

interface Session {
  userId: mongoose.Types.ObjectId;
  userAgent?: string;
  createdAt: Date;
  expiresAt: Date;
}

interface SessionModel extends Model<Session> {}

const sessionSchema = new Schema<Session, SessionModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
      index: true,
    },
    userAgent: {
      type: String,
    },
    createdAt: {
      type: Date,
      required: true,
      default: Date.now,
      immutable: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: thirtyDaysFromNow,
    },
  },
  {
    timestamps: false,
  }
);

// Delete the document at the exact time in 'expiresAt'
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const SessionModel = mongoose.model<Session, SessionModel>(
  "Session",
  sessionSchema
);

export default SessionModel;
