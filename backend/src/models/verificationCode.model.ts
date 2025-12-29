import mongoose, { Schema, Types, Model } from "mongoose";
import {
  VerificationCode,
  VerificationCodeType,
} from "../constants/verificationCodeType.js";

interface Verification {
  userId: Types.ObjectId;
  type: VerificationCodeType;
  expiresAt: Date;
}

interface VerificationModel extends Model<Verification> {}

const verificationCodeSchema = new Schema<Verification, VerificationModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(VerificationCode),
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Delete the document at the exact time in 'expiresAt'
verificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const VerificationCodeModel = mongoose.model<Verification, VerificationModel>(
  "VerificationCode",
  verificationCodeSchema,
  "verification_code"
);

export default VerificationCodeModel;
